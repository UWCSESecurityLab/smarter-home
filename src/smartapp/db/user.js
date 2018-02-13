const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
  id: String,
  username: String,
  hashedPassword: String,
  oauthClients: [String]
});

let User = mongoose.model('User', userSchema);
module.exports = User;