const mongoose = require('mongoose');

// This schema uniquely identifies a user of the SmarterHome app.
let userSchema = mongoose.Schema({
  id: String,
  username: String,
  hashedPassword: String,     // bcrypt hash, 10 salt rounds
  notificationToken: String,  // FCM notification token
  installedAppId: String
});

let User = mongoose.model('User', userSchema);
module.exports = User;