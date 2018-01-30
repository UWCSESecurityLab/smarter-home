const bodyParser = require('body-parser');
const configuration = require('./configuration');
const express = require('express');
const httpSignature = require('http-signature');
const InstallData = require('./db/installData');
const mongoose = require('mongoose');
const request = require('request');

const APP_CONFIG = require('./auth/config.json');
const PUBLIC_KEY = APP_CONFIG.app.webhookSmartApp.publicKey;

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connection established');
});

let app = express();
app.use(bodyParser.json());

function handlePing(req, res) {
  res.status(200);
  res.json({
    pingData: {
      challenge: req.body.pingData.challenge
    }
  });
  res.send();
}

function signatureIsVerified(req) {
  try {
    let parsed = httpSignature.parseRequest(req);
    if (!httpSignature.verifySignature(parsed, PUBLIC_KEY)) {
      console.log('forbidden - failed verifySignature');
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

function handleConfigurationInit(req, res) {
  res.json(configuration.init);
  res.send();
}

function handleConfigurationPage(req, res) {
  res.json(configuration.pages[0]);
  res.send();
}

// Given an InstallData object, subscribe to all of the attributes of all of the
// authorized devices.
function subscribeToAuthorizedDevices(installData) {
  console.log(installData);
  // return new Promise((resolve, reject) => {
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

  return Promise.all(subscriptions.map((subscription) => {
    return new Promise((resolve, reject) => {
      request({
        url: `https://api.smartthings.com/v1/installedapps/${installData.installedApp.installedAppId}/subscriptions`,
        method: 'POST',
        json: true,
        headers: {
          'Authorization': `Bearer ${installData.authToken}`
        },
        body: subscription
      }, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          console.log(res.statusCode);
          reject(body);
          return;
        }
        resolve(body);
      });
    });
  }));
}

// Executed when a SmartApp is installed onto a new hub.
function handleInstall(req, res) {
  let data = new InstallData(req.body.installData);
  data.save()
    .then(subscribeToAuthorizedDevices)
    .then(() => {
      res.json({
        installData: {}
      });
      res.status(200);
      res.send();
    })
    .catch((err) => {
      console.log(JSON.stringify(err, null, 2));
      res.status(500);
      res.send('Problem installing app.');
    });
}

app.post('/', (req, res) => {
  if (!req.body) {
    res.status(400);
    res.send('Invalid request');
    return;
  }

  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.lifecycle === 'PING') {
    handlePing(req, res);
    return;
  }

  // if (!signatureIsVerified(req)) {
  //   res.status(403);
  //   res.send('Unauthorized');
  //   return;
  // }

  switch (req.body.lifecycle) {
    case 'CONFIGURATION':
      if (req.body.configurationData.phase == 'INITIALIZE') {
        handleConfigurationInit(req, res);
      } else if (req.body.configurationData.phase == 'PAGE') {
        handleConfigurationPage(req, res);
      }
      break;
    case 'INSTALL':
      handleInstall(req, res);
      break;
    case 'UPDATE':
      res.status(200);
      res.json({
        updateData: {}
      });
      res.send();
      break;
    case 'EVENT':
      res.status(200);
      res.json({
        eventData: {}
      });
      res.send();
      break;
    case 'OAUTH_CALLBACK':
      res.status(200);
      res.json({
        oAuthCallbackData: {}
      });
      res.send();
      break;
    case 'UNINSTALL':
      res.status(200);
      res.json({
        uninstallData: {}
      });
      res.send();
      break;
    default:
      res.status(400);
      res.send();
  }
});
app.listen(5000);
console.log('Listening on port 5000');