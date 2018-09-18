const mongoose = require('mongoose');

let pendingCommandSchema = mongoose.Schema({
  id: String,
  date: Date,

  nearbyApproval: String,
  ownerApproval: String,
  decided: Boolean,

  deviceId: String,
  capability: String,
  command: String,

  installedAppId: String,
  requesterId: String,
  owners: [String]
});

let PendingCommand = mongoose.model('PendingCommand', pendingCommandSchema);
module.exports = PendingCommand;