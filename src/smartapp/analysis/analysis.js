const mongoose = require('mongoose');
const Beacon = require('../server/db/beacon');
const Command = require('../server/db/command');
const InstallData = require('../server/db/installData');
const Log = require('../server/db/log');
const PendingCommand = require('../server/db/pending-command');
const Permissions = require('../server/db/permissions');
const RoomTransaction = require('../server/db/room-transaction');
const Room = require('../server/db/room');
const UserReport = require('../server/db/user-report');
const User = require('../server/db/user');

mongoose.connect('mongodb://localhost:27017/smarterhome', { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', analyze);

async function analyze() {
  try {
    let users = await User.find({});
    users.forEach((user) => {
      console.log(user.displayName);
    });
  } catch (e) {
    console.log(e);
  } finally {
    db.close();
  }
}
