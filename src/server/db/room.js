const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

// This Schema represents a "room", which is the virtual representation of
// a physical room and all of the devices and beacons within it.
let roomSchema = mongoose.Schema({
  installedAppId: String,  // The app instance the room belongs to.
  roomId: String,          // Unique identifier for this room.
  name: String,            // User-defined string for room.
  devices: [String],       // List of device ids for devices in this room.
  default: Boolean,        // Whether this is the 'default' room that unassigned
                           // devices go into and can't be deleted
  pendingTransactions: [ObjectId]
});

let Room = mongoose.model('Room', roomSchema);
module.exports = Room;