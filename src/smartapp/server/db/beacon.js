const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// This Schema is used to represent individual beacons.
let beaconSchema = mongoose.Schema({
  namespace: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  // User friendly name, physically labeled on beacon
  name: { type: String, required: true, unique: true }
});
beaconSchema.plugin(uniqueValidator);

let Beacon = mongoose.model('Beacon', beaconSchema);
module.exports = Beacon;