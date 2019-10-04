const mongoose = require('mongoose');
const { LocationRestrictions, ParentalRestrictions } = require('../../permissions');

const permissionSchema = mongoose.Schema({
  deviceId: String,
  installedAppId: String,
  locationRestrictions: Object,
  parentalRestrictions: { type: String, default: ParentalRestrictions.ALWAYS_ASK },
  owners: [String], // Array of user ids
});

let Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;
