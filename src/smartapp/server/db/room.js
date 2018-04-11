const mongoose = require('mongoose');

// This Schema represents a "room", which is the virtual representation of
// a physical room and all of the devices and beacons within it.
let roomSchema = mongoose.Schema({
  installedAppId: String,  // The app instance the room belongs to.
  roomId: String,          // Unique identifier for this room.
  name: String,            // User-defined string for room.
  beaconNamespace: String, // The namespace for all beacons in this room
  devices: [String]        // List of device ids for devices in this room.
});

let Room = mongoose.model('Room', roomSchema);
module.exports = Room;