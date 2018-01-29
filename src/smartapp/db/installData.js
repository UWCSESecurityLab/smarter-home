const mongoose = require('mongoose');

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