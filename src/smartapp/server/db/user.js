const mongoose = require('mongoose');
const Roles = require('../../roles');

// This schema uniquely identifies a user of the SmarterHome app.
let userSchema = mongoose.Schema({
  id: String,
  username: String,
  displayName: String,
  hashedPassword: String,        // bcrypt hash, 10 salt rounds
  publicKeys: [],                // Array of JWK formatted ECDSA keys
  installedAppId: String,        // The SmartApp instance that the user can access
  // FCM notification tokens and keys for home activity notifications.
  activityFcmTokens: [String],
  role: { type: String, default: Roles.USER }
});

let User = mongoose.model('User', userSchema);
module.exports = User;