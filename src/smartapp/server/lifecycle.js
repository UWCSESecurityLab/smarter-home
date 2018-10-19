const configuration = require('./configuration');
const Beacon = require('./db/beacon');
const Command = require('./db/command');
const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const log = require('./log');
const SmartThingsClient = require('./SmartThingsClient');
const SmartappConfig = require('../config/smartapp-config.js');
const Room = require('./db/room');
const User = require('./db/user');
const uuid = require('uuid/v4');

let APP_CONFIG;
if (process.env.SERVER_MODE === 'prod') {
  APP_CONFIG = SmartappConfig.pilotApp;
} else if (process.env.SERVER_MODE === 'dev') {
  APP_CONFIG = SmartappConfig.devApp;
}

module.exports = {
  handleConfiguration: function(req, res) {
    if (req.body.configurationData.phase == 'INITIALIZE') {
      res.json(configuration.init);
    } else if (req.body.configurationData.phase == 'PAGE') {
      res.json(configuration.pages[req.body.configurationData.pageId]);
    }
  },

  // Executed when a SmartApp is installed onto a new hub.
  handleInstall: function(req, res) {
    let data = new InstallData(req.body.installData);
    data.save()
      .then(subscribeToAuthorizedDevices)
      // .then(() => {
      //   log.log('Done subscribing, creating schedule');
      //   return SmartThingsClient.createTokenUpdateSchedule({
      //     installedAppId: data.installedApp.installedAppId,
      //     authToken: data.authToken
      //   });
      // })
      .then(() => createFirstRoom(req.body.installData))
      .then(() => {
        log.log('Install successful');
        res.json({
          installData: {}
        });
        res.status(200).send();
      })
      .catch((err) => {
        log.error('Install error:');
        console.log(JSON.stringify(err, null, 2));
        res.status(500).send('Problem installing app.');
      });
  },

  handleUpdate: async function(req, res) {
    try {
      const updateData = req.body.updateData;
      let installData = await InstallData.findOne({
        'installedApp.installedAppId': updateData.installedApp.installedAppId
      }).exec();
      if (!installData) {
        log.error(`Couldn't process update event - installdata ${updateData.installedApp.installedAppId} doesn't exist`);
        return;
      }

      let rooms = await Room.find({
        installedAppId: updateData.installedApp.installedAppId
      }).exec();

      let beacons = await Beacon.find({}).exec();
      let beaconNames = beacons.map((beacon) => beacon.name);

      // Get ids of devices in this update
      const updateDeviceIds = Object.values(installData.installedApp.config)
        .reduce((accumulator, current) => accumulator.concat(current), [])
        .map((entry) => entry.deviceConfig.deviceId);
      // Get ids of devices currently in rooms
      const roomDeviceIds = rooms.reduce((accumulator, current) => {
        return accumulator.concat(current.devices);
      }, []);

      // Calculate which devices were added and removed
      const newDeviceIds = updateDeviceIds.filter((updateDeviceId) => {
        return !roomDeviceIds.includes(updateDeviceId);
      });
      const removedDeviceIds = roomDeviceIds.filter((roomDeviceId) => {
        return !updateDeviceIds.includes(roomDeviceId) &&
               !beaconNames.includes(roomDeviceId);
      });

      console.log('Removed devices:');
      console.log(removedDeviceIds);
      console.log('Added devices:');
      console.log(newDeviceIds);

      // Update installdata object
      installData.authToken = updateData.authToken;
      installData.refreshToken = updateData.refreshToken;
      installData.installedApp = updateData.installedApp;
      installData.save();

      // Update rooms
      for (let room of rooms) {
        // Remove devices if necessary
        for (let removedDeviceId of removedDeviceIds) {
          const idx = room.devices.indexOf(removedDeviceId);
          if (idx > -1) {
            room.devices.splice(idx, 1);
          }
        }
        // Add devices to default room if necessary
        if (room.default && newDeviceIds.length > 0) {
          room.devices = room.devices.concat(newDeviceIds);
        }
        await room.save();
      }
    } catch(e) {
      log.error(e);
    }
  },

  handlePing: function(req, res) {
    res.status(200);
    res.json({
      pingData: {
        challenge: req.body.pingData.challenge
      }
    });
    res.send();
  },

  handleEvent: async function(req, res) {
    // if (req.body.eventData.events.find((event) => {
    //   if (!event || !event.timerEvent || !event.timerEvent.name ) {
    //     return false;
    //   }
    //   return event.timerEvent.name === 'update-tokens-schedule'
    // })) {
    //   handleUpdateTokensEvent(req, res);
    // }

    let deviceEvent = req.body.eventData.events.find((event) => {
      return event.eventType === 'DEVICE_EVENT';
    });
    if (!deviceEvent) {
      return;
    }
    let supportedCapabilities = ['switch', 'lock', 'contactSensor', 'motionSensor'];
    if (!supportedCapabilities.includes(deviceEvent.deviceEvent.capability)) {
      return;
    }

    try {
      const date = new Date(deviceEvent.eventTime);
      const installedAppId = req.body.eventData.installedApp.installedAppId
      const deviceId = deviceEvent.deviceEvent.deviceId;
      const component = deviceEvent.deviceEvent.componentId;
      const capability = deviceEvent.deviceEvent.capability;
      const value = deviceEvent.deviceEvent.value;

      // Find the installedApp for this event
      let installData = await InstallData.findOne({
        'installedApp.installedAppId': installedAppId
      }).exec();
      if (!installData) {
        log.error(`Could not find installdata on receiving event (${installedAppId})`);
        return;
      }

      // Find the command that triggered the event, if it exists.
      // First, look up commands that match the profile of the event.
      let commands = await Command.find({
        installedAppId: installedAppId,
        deviceId: deviceId,
        component: component,
        capability: capability
      });
      // Next, find the command that occurred the closest in time to the event.
      let closestCommand;
      let closestTimeDiff = Number.MAX_SAFE_INTEGER;
      for (let command of commands) {
        let timeDiff = date - command.date;
        // Exclude commands that occurred after the event, and commands
        // that were sent over ten minutes ago.
        if (timeDiff < closestTimeDiff && timeDiff >= 0 && timeDiff < 600000) {
          closestCommand = command;
          closestTimeDiff = timeDiff;
        }
      }
      // Get the user that triggered the command, if a command exists.
      let trigger;
      if (closestCommand) {
        let triggerUser = await User.findOne({ id: closestCommand.userId });
        trigger = triggerUser.displayName;
        await Command.deleteOne({ _id: closestCommand._id });
      } else {
        trigger = "another app, or manually";
      }
      log.log('Event was triggered by ' + trigger);

      // Find the users of the installedApp
      let users = await User.find({ installedAppId: installedAppId });
      if (users.length === 0) {
        log.error(`No users to notifiy for (${installedAppId})`);
        return;
      }

      // const newTokens = await SmartThingsClient.renewTokens(installedAppId, APP_CONFIG);

      // Get details about the device
      let description = await SmartThingsClient.getDeviceDescription({
        deviceId: deviceId,
        authToken: installData.authToken
      });

      // Find the beacon ids for the room that the device is in
      let room = await Room.findOne({ devices: deviceId });
      let beacons = await Beacon.find({ name: room.devices });
      let beaconNames = beacons.map((b) => b.name);

      // Send an FCM notification
      let responses = await Promise.all(
        users
          .filter((user) => user.permissionsFcmTokens.length > 0)
          .reduce((promises, user) => {
            return promises.concat(
              user.permissionsFcmTokens.map((token) => {
                fcmClient.sendActivityNotification({
                  beacons: beaconNames,
                  device: description.label,
                  deviceId: deviceId,
                  capability: capability,
                  value: value,
                  trigger: trigger
                }, token)
              })
            );
          }, [])
      );
      responses.forEach((response) => log.log(JSON.stringify(response)));
    } catch(e) {
      log.error(e);
    }
  },

  handleUpdateTokens: function(req, res) {
    SmartThingsClient.renewTokens(req.body.eventData.installedApp.installedAppId, APP_CONFIG);
  },

  handleOAuthCallback: function(req, res) {
    let userId = req.body.oauthCallbackData.urlPath.split('=')[1];
    let installedAppId = req.body.oauthCallbackData.installedAppId;

    User.findOneAndUpdate({ id: userId }, { '$set': {'installedAppId': installedAppId}})
      .then(() => {
        log.log(`Added user ${userId} to app ${installedAppId}`);
      }).catch((err) => {
        log.error(err);
      });
  }
}

// Given an InstallData object, subscribe to all of the attributes of all of the
// authorized devices.
function subscribeToAuthorizedDevices(installData) {
  let devices = [];
  // Flatten devices into a list
  for (let category in installData.installedApp.config) {
    for (let item of installData.installedApp.config[category]) {
      if (item.valueType === 'DEVICE') {
        devices.push(item);
      }
    }
  }
  // Form request body
  let subscriptions = devices.map((d) => {
    return {
      sourceType: 'DEVICE',
      device: {
        deviceId: d.deviceConfig.deviceId,
        stateChangeOnly: true
      }
    };
  });

  log.log('subscription data:');
  console.log(subscriptions);

  // return SmartThingsClient.subscribe({
  //   installedAppId: installData.installedApp.installedAppId,
  //   subscriptionBody: subscriptions,
  //   authToken: installData.authToken
  // });
  let requests = [];
  subscriptions.forEach((subscription) => {
   requests.push(SmartThingsClient.subscribe({
      installedAppId: installData.installedApp.installedAppId,
      subscriptionBody: subscription,
      authToken: installData.authToken
    }));
  });

  return Promise.all(requests);
}

async function createFirstRoom(installData) {
  const roomId = uuid();

  const devices = Object.values(installData.installedApp.config)
    .reduce((accumulator, current) => {
      return accumulator.concat(current)
    }, [])
    .map((entry) => entry.deviceConfig.deviceId);

  const room = new Room({
    installedAppId: installData.installedApp.installedAppId,
    roomId: roomId,
    name: 'Home',
    devices: devices,
    default: true
  });

  return room.save();
}
