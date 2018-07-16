const assert = require('assert');
const mongoose = require('mongoose');
const Room = require('./room');


async function moveDeviceBetweenRooms(srcRoom, destRoom, srcIdx, destIdx) {
  let session = await mongoose.startSession()
  session.startTransaction();
  try {
    let [srcRoomDoc, destRoomDoc] = await Promise.all([
      Room.findOne({ roomId: srcRoom }).session(session),
      Room.findOne({ roomId: destRoom }).session(session)
    ]);
    assert.ok(srcRoomDoc.$session());
    assert.ok(destRoomDoc.$session());

    let [deviceId] = srcRoomDoc.devices.splice(srcIdx, 1);
    destRoomDoc.devices.splice(destIdx, 0, deviceId);

    await Promise.all([srcRoomDoc.save(), destRoomDoc.save()]);
    assert.ok(srcRoomDoc.$session());
    assert.ok(destRoomDoc.$session());

    session.commitTransaction();
  } catch(e) {
    console.log(e);
    session.abortTransaction();
  }
}


module.exports = {
  moveDeviceBetweenRooms: moveDeviceBetweenRooms
}