const mongoose = require('mongoose');

// This schema uniquely identifies a user of the SmarterHome app.
let userSchema = mongoose.Schema({
  id: String,
  username: String,
  displayName: String,
  hashedPassword: String,        // bcrypt hash, 10 salt rounds
  publicKeys: [],                // Array of JWK formatted ECDSA keys
  installedAppId: String,        // The SmartApp instance that the user can access
  notificationTokens: [String],  // Per-device FCM notification tokens
  notificationKey: String,       // FCM device group notification key
  // Per-device FCM notification tokens for Android devices that receive data
  // notifications (for proximity-based notifications).
  androidNotificationTokens: [String],
  // FCM device group key for data notifications.
  androidNotificationKey: String,
});

let User = mongoose.model('User', userSchema);
module.exports = User;