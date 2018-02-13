const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');
const User = require('./db/user');

const SALT_ROUNDS = 10;

module.exports = {
  verifyUser: function(username, password) {
    return new Promise((resolve, reject) => {
      User.findOne({ username: username }, function(err, user) {
        if (err) {
          return reject(err);
        }
        if (!user) {
          return reject({ message: 'BAD_USERNAME' });
        }
        bcrypt.compare(password, user.hashedPassword, (err, res) => {
          if (res) {
            resolve(user);
          } else {
            reject({ message: 'BAD_PASSWORD' });
          }
        });
      });
    });
  },
  createUser: function(username, password) {
    return new Promise((resolve, reject) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) {
          reject({ message: 'DB_ERROR'});
        }
        if (user) {
          reject({ message: 'USERNAME_TAKEN'});
        } else {
          bcrypt.hash(password, SALT_ROUNDS, (hash) => {
            let user = new User({
              id: uuid(),
              username: username,
              hashedPassword: hash,
              oauthClients: []
            });
            user.save((err) => {
              if (err) {
                console.log(err);
                reject({ message: 'CREATE_ERROR' });
              } else {
                resolve();
              }
            });
          });
        }
      });
    });
  },
  createToken: function(user) {
    return new Promise((resolve, reject) => {
      let token = uuid();
      user.oauthClients.push(token);
      user.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  }
};