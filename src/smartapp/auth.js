const bcrypt = require('bcrypt');
const shortid = require('shortid');
const User = require('./db/user');

const SALT_ROUNDS = 10;

module.exports = {
  verify: function(username, password) {
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
  generate: function(username, password) {
    return new Promise((resolve, reject) => {
      User.findOne({ username: username }, (err, user) => {
        if (user) {
          reject({message: 'Username already exists'});
        } else {
          bcrypt.hash(password, SALT_ROUNDS, (hash) => {
            let user = new User({
              id: shortid.generate(),
              username: username,
              hashedPassword: hash
            });
            user.save((err) => {
              if (err) {
                console.log(err);
                reject({message: 'Couldn\'t save password'});
              } else {
                resolve();
              }
            });
          });
        }
      });
    });
  }
};