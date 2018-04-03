const mongoose = require('mongoose');

// This schema maps directly to the InstallData JSON object returned from
// SmartThings when the SmartApp is first installed.
let installSchema = mongoose.Schema({
  authToken: String,
  refreshToken: String,
  installedApp: {
    installedAppId: String,
    locationId: String,
    config: {},
    permissions: [String]
  }
});

let InstallData = mongoose.model('InstallData', installSchema);
module.exports = InstallData;