const mongoose = require('mongoose');
const Room = require('./room');

let roomTransactionSchema = mongoose.Schema({
  srcRoom: String,
  destRoom: String,
  srcIdx: Number,
  destIdx: Number,
  state: String, // initial, pending, applied, done, canceling, canceled
  lastModified: Date
});

let RoomTransaction = mongoose.model('RoomTransaction', roomTransactionSchema);

async function changeTxnState(txnId, current, next) {
  return RoomTransaction.updateOne(
    { _id: txnId, state: current },
    {
      $set: { state: next },
      $currentDate: { lastModified: true }
    }
  ).exec();
}


async function moveDeviceBetweenRooms(srcRoom, destRoom, srcIdx, destIdx) {
  let txn = new RoomTransaction({
    srcRoom: srcRoom,
    destRoom: destRoom,
    srcIdx: srcIdx,
    destIdx: destIdx,
    state: 'initial',
    lastModified: new Date()
  });
  const txnId = txn.id;
  let deviceId = null;

  try {
    await txn.save(); // Save Initial

    // Move to 'pending' state
    await changeTxnState(txnId, 'initial', 'pending');

    // Swap the rooms
    let [srcRoomDoc, destRoomDoc] = await Promise.all([
      Room.findOne({ roomId: srcRoom }).exec(),
      Room.findOne({ roomId: destRoom }).exec()
    ]);

    if (!srcRoomDoc) {
      throw { error: 'Can\'t find room ' + srcRoom };
    } else if (!destRoomDoc) {
      throw { error: 'Can\'t find room ' + destRoom };
    }

    [deviceId] = srcRoomDoc.devices.splice(srcIdx, 1);
    destRoomDoc.devices.splice(destIdx, 0, deviceId);

    srcRoomDoc.pendingTransactions.push(txnId);
    destRoomDoc.pendingTransactions.push(txnId);

    await Promise.all([srcRoomDoc.save(), destRoomDoc.save()]);

    // Move to 'applied' state
    await changeTxnState(txnId, 'pending', 'applied');

    // Remove pending transactions from rooms
    await Promise.all([
      Room.updateOne(
        { roomId: srcRoom, pendingTransactions: txnId },
        { $pull: { pendingTransactions: txnId }}
      ).exec(),
      Room.updateOne(
        { roomId: destRoom, pendingTransactions: txnId },
        { $pull: { pendingTransactions: txnId }}
      ).exec()
    ]);
    // Move to done state
    await changeTxnState(txnId, 'applied', 'done');
  } catch(e) {
    // TODO: maybe do all of this in scheduled recovery
    let failedTxn = await RoomTransaction.findOne({ _id: txnId });

    if (failedTxn.state === 'initial') {
      throw e;
    } else if (failedTxn.state === 'pending') {
      // If it fails during pending phase, try to undo the operation
      await changeTxnState(txnId, 'pending', 'canceling');

      if (!deviceId) {
        throw e;
      }
      let [srcRoomDoc, destRoomDoc] = await Promise.all([
        Room.findOne({ roomId: srcRoom }).exec(),
        Room.findOne({ roomId: destRoom }).exec()
      ]);
      if (srcRoomDoc && srcRoomDoc[srcIdx] !== deviceId) {
        srcRoomDoc.splice(srcIdx, 0, deviceId);
      }
      if (destRoomDoc && destRoomDoc[destIdx] === deviceId) {
        destRoomDoc.splice(destIdx, 1);
      }

      if (srcRoomDoc) {
        srcRoomDoc.pendingTransactions =
            srcRoomDoc.pendingTransactions.filter((txn) => txn !== txnId);
      }
      if (destRoomDoc) {
        destRoomDoc.pendingTransactions =
            destRoomDoc.pendingTransactions.filter((txn) => txn !== txnId);
      }
      await Promise.all([srcRoomDoc.save(), destRoomDoc.save()]);
      await changeTxnState(txnId, 'pending', 'cancelled');
      throw e;

    } else if (failedTxn.state === 'applied') {
      // If it was successfully applied, just attempt to remove pending
      // transactions.
      await Promise.all([
        Room.updateOne(
          { roomId: srcRoom, pendingTransactions: txnId },
          { $pull: { pendingTransactions: txnId }}
        ).exec(),
        Room.updateOne(
          { roomId: destRoom, pendingTransactions: txnId },
          { $pull: { pendingTransactions: txnId }}
        ).exec()
      ]);
      // Move to done state
      await changeTxnState(txnId, 'applied', 'done');
      return;
    } else {
      throw e;
    }
  }
}

module.exports = {
  model: RoomTransaction,
  moveDeviceBetweenRooms: moveDeviceBetweenRooms
}