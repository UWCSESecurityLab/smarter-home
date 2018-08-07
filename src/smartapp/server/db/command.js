const mongoose = require('mongoose');

// Used to store commands issued by users, so that they can be matched with
// events from SmartThings to provide attribution.
let commandSchema = mongoose.Schema({
  date: Date,
  installedAppId: String,
  userId: String,
  deviceId: String,
  component: String,
  capability: String,
  command: String,
});

let Command = mongoose.model('Command', commandSchema);
module.exports = Command;