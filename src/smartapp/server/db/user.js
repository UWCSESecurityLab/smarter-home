const mongoose = require('mongoose');

// This schema uniquely identifies a user of the SmarterHome app.
let userSchema = mongoose.Schema({
  id: String,
  username: String,
  hashedPassword: String,        // bcrypt hash, 10 salt rounds
  notificationTokens: [String],  // Per-device FCM notification tokens
  notificationKey: String,       // FCM device group notification key
  installedAppId: String
});

let User = mongoose.model('User', userSchema);
module.exports = User;