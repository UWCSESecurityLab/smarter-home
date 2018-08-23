const bcrypt = require('bcrypt');
const Errors = require('../errors');
const User = require('./db/user');
const uuid = require('uuid/v4');

const SALT_ROUNDS = 10;

module.exports = {
  verifyUser: function(username, password) {
    return new Promise((resolve, reject) => {
      User.findOne({ username: username }, function(err, user) {
        if (err) {
          console.log(err);
          return reject({ error: Errors.DB_ERROR });
        }
        if (!user) {
          return reject({ error: Errors.LOGIN_BAD_USER_PW });
        }
        bcrypt.compare(password, user.hashedPassword, (err, res) => {
          if (res) {
            resolve(user);
          } else {
            reject({ error: Errors.LOGIN_BAD_USER_PW });
          }
        });
      });
    });
  },
  createUser: function(username, displayName, password) {
    return new Promise((resolve, reject) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) {
          reject({ error: Errors.DB_ERROR });
        }
        if (user) {
          reject({ error: Errors.REGISTER_USERNAME_TAKEN });
        } else {
          bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
            if (err) {
              reject(err);
              return;
            }
            let user = new User({
              id: uuid(),
              username: username,
              displayName: displayName,
              hashedPassword: hash,
              notificationTokens: []
            });
            user.save((err) => {
              if (err) {
                console.log(err);
                reject({ error: Errors.DB_ERROR });
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