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
const {LocationRestrictions} = require('../permissions');

const TEST_APP = '2be2b5a7-420c-4f99-aa5c-c5c20eefac33';

mongoose.connect('mongodb://localhost:27017/smarterhome', { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', analyze);

async function analyze() {
  try {
    let users = await User.find({});
    let installDatas = await InstallData.find({});
    let permissions = await Permissions.find({});


    // finalACPolicies(users, permissions, installDatas);
    finalNotificationPrefs(users, installDatas);
    // await logPermissions(users, installDatas);
    // await logReactive(users, installDatas);

  } catch (e) {
    console.log(e);
  } finally {
    db.close();
  }
}

async function logPermissions(users, installDatas) {
  let permissionUpdates = await Log.find({
    'meta.method': 'POST',
    'meta.url': {$regex: /.*\/devices\/.*\/permissions.*/}
  });
  // permissionUpdates.forEach(pu => console.log(pu.meta.body));
  let households = {}

  for (let update of permissionUpdates) {
    if (update.meta.installedAppId === TEST_APP) {
      continue;
    }
    if (!households[update.meta.installedAppId]) {
      households[update.meta.installedAppId] = [];
    }
    let deviceId = update.meta.url.split('/')[2];
    let user = users.find(u => u.id == update.meta.user);
    let username = user ? user.displayName : update.meta.user;
    let changed = Object.assign({}, update.meta.body);

    if (changed.removeOwner) {
      changed.removeOwner = users.find(u => u.id === changed.removeOwner).displayName;
    }
    if (changed.addOwner) {
      changed.addOwner = users.find(u => u.id === changed.addOwner).displayName;
    }

    households[update.meta.installedAppId].push({
      timestamp: update.timestamp,
      updater: username,
      deviceId: deviceId,
      deviceType: getDeviceType(deviceId, installDatas, update.meta.installedAppId),
      changed: JSON.stringify(changed),
    });
  }

  Object.values(households).forEach(h => {
    h.sort((a, b) => {
      if (a.timestamp < b.timestamp) {
        return -1;
      }
      if (a.timestamp > b.timestamp) {
        return 1;
      }
      return 0
    });
    h.forEach(entry => entry.timestamp = entry.timestamp.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}))
    console.table(h)
  });
}

async function logReactive(users, installDatas) {
  let reactive = await Log.find({
    'meta.method': 'POST',
    'meta.url': { $regex: /\/pendingCommands\/.*/ }
  });

  let askDecisions = await Log.find({
    'message': 'Ask-Request Decision',
    'meta.ask.decision': { $ne: 'ApprovalState_ALLOW' }
  });
  // console.log(askDecisions);
  // console.log(askDecisions[10].meta.body);
  // console.log(askDecisions[10].meta.ask);

  let households = {};
  for (let decision of reactive) {
    if (decision.meta.installedAppId === TEST_APP) {
      continue;
    }
    if (!households[decision.meta.installedAppId]) {
      households[decision.meta.installedAppId] = [];
    }
    let deviceId = decision.meta.url.split('/')[2];
    let user = users.find(u => u.id == decision.meta.user);
    let username = user ? user.displayName : decision.meta.user;
    let body = JSON.stringify(decision.meta.body);

    households[decision.meta.installedAppId].push({
      timestamp: decision.timestamp.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}),
      updater: username,
      deviceId: deviceId,
      deviceType: getDeviceType(deviceId, installDatas, decision.meta.installedAppId),
      decision: JSON.stringify(body),
    });
  }

  for (let decision of askDecisions) {
    if (decision.meta.installedAppId === TEST_APP) {
      continue;
    }
    if (!households[decision.meta.installedAppId]) {
      households[decision.meta.installedAppId] = [];
    }
    let deviceId = decision.meta.url.split('/')[2];
    let user = users.find(u => u.id == decision.meta.user);
    let username = user ? user.displayName : decision.meta.user;
    let ask = JSON.stringify(decision.meta.ask);

    households[decision.meta.installedAppId].push({
      timestamp: decision.timestamp.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}),
      updater: username,
      deviceId: deviceId,
      deviceType: getDeviceType(deviceId, installDatas, decision.meta.installedAppId),
      decision: JSON.stringify(ask),
    });
  }

  Object.values(households).forEach(h => {
    h.sort((a, b) => {
      if (a.timestamp < b.timestamp) {
        return -1;
      }
      if (a.timestamp > b.timestamp) {
        return 1;
      }
      return 0
    });
    h.forEach(entry => entry.timestamp = entry.timestamp.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}))
    console.table(h)
  });
}


function finalNotificationPrefs(users, installDatas) {
  users.forEach(u => {
    console.log(u.displayName);
    if (!u.notificationPrefs) {
      return;
    }
    console.table(Object.entries(u.notificationPrefs).map(np =>
      [getDeviceType(np[0], installDatas, u.installedAppId), np[1]]
    ));
  });
}

function getDeviceType(deviceId, installDatas, installedAppId) {
  let installData = installDatas.find(id => id.installedApp.installedAppId == installedAppId);
  if (!installData) {
    return 'unknown device type';
  }
  let config = installData.installedApp.config;
  let inCategory = function(device) {
    return device.deviceConfig.deviceId === deviceId;
  }
  if (config.motionSensors && config.motionSensors.find(inCategory)) {
    return 'motion sensor';
  }
  if (config.switches && config.switches.find(inCategory)) {
    return 'switch';
  }
  if (config.contactSensors && config.contactSensors.find(inCategory)) {
    return 'contact sensor';
  }
  if (config.doorLocks && config.doorLocks.find(inCategory)) {
    return 'door lock';
  }
  return 'unknown device type';
}

function finalACPolicies(users, permissions, installDatas) {
  installDatas.forEach((installData) => {
    let installedAppId = installData.installedApp.installedAppId;
    console.log(users
      .filter(u => u.installedAppId === installedAppId)
      .map(u => u.displayName)
      .join(', '));

    console.log(permissions.filter(p =>
      p.installedAppId === installedAppId &&
      p.locationRestrictions &&
      !Object.values(p.locationRestrictions).every(lr => lr === LocationRestrictions.ANYWHERE)));
    });
}
