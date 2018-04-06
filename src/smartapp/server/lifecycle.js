const configuration = require('./configuration');
const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const log = require('./log');
const SmartThingsClient = require('./SmartThingsClient');
const User = require('./db/user');

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
    let supportedCapabilities = ['switch', 'lock', 'contactSensor'];
    if (!supportedCapabilities.includes(deviceEvent.deviceEvent.capability)) {
      return;
    }

    try {
      let user = await User.findOne({}).exec();
      let installData = await InstallData.findOne({}).exec();

      if (!user.notificationToken) {
        log.error('No notification token found');
        return;
      }

      let description = await SmartThingsClient.getDeviceDescription({
        deviceId: deviceEvent.deviceEvent.deviceId,
        authToken: installData.authToken
      });

      fcmClient.sendNotification({
        device: description.label,
        deviceId: deviceEvent.deviceEvent.deviceId,
        capability: deviceEvent.deviceEvent.capability,
        value: deviceEvent.deviceEvent.value
      }, user.notificationToken);
    } catch(e) {
      log.error(e);
    }
  },

  handleUpdateTokens: function(req, res) {
    SmartThingsClient.renewTokens(req.body.eventData.installedApp.installedAppId);
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