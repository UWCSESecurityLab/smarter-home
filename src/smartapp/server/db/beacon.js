const mongoose = require('mongoose');

// This Schema is used to represent individual beacons.
let beaconSchema = mongoose.Schema({
  namespace: String, // Namespace of this beacon
  id: String,        // ID of this beacon.
  name: String       // User friendly name, physically labeled on beacon
});

let Beacon = mongoose.model('Beacon', beaconSchema);
module.exports = Beacon;