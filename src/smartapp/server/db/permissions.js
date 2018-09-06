const mongoose = require('mongoose');
const { LocationRestrictions, ParentalRestrictions } = require('../../permissions');

const permissionSchema = mongoose.Schema({
  deviceId: String,
  installedAppId: String,
  locationRestrictions: { type: String, default: LocationRestrictions.ANYWHERE },
  parentalRestrictions: { type: String, default: ParentalRestrictions.ALWAYS_ASK }
});

let Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;
