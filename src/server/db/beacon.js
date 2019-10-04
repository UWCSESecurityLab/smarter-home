const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// This Schema is used to represent individual beacons.
let beaconSchema = mongoose.Schema({
  // User friendly name, physically labeled on beacon
  name: { type: String, required: true, unique: true },
  // iBeacon properties
  uuid: { type: String, required: true },
  major: { type: Number, required: true },
  minor: { type: Number, required: true },
  // Eddystone-UID properties
  instanceId: String,
  namespace: String,
  // Eddystone-URL
  url: String
});
beaconSchema.plugin(uniqueValidator);

let Beacon = mongoose.model('Beacon', beaconSchema);
module.exports = Beacon;
