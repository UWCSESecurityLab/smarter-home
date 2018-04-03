const mongoose = require('mongoose');

// This schema uniquely identifies a user of the SmarterHome app.
// TODO: include field for SmartThings installedAppId once their OAuth works.
let userSchema = mongoose.Schema({
  id: String,
  username: String,
  hashedPassword: String,     // bcrypt hash, 10 salt rounds
  notificationToken: String,  // FCM notification token
});

let User = mongoose.model('User', userSchema);
module.exports = User;