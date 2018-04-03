const mongoose = require('mongoose');

// This Schema is used to represent individual beacons, and catalog devices
// that are near the beacon, to enable nearby access.
let beaconSchema = mongoose.Schema({
  namespace: String, // Namespace of this beacon (corresponds to a room).
  id: String,        // ID of this beacon.
  devices: [String]  // Device ids of nearby devices.
});

let Beacon = mongoose.model('Beacon', beaconSchema);
module.exports = Beacon;