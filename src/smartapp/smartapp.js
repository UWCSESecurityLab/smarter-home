const bodyParser = require('body-parser');
const express = require('express');
const httpSignature = require('http-signature');
const InstallData = require('./db/installData');
const mongoose = require('mongoose');

const CONFIG = require('./auth/config.json');
const PUBLIC_KEY = CONFIG.app.webhookSmartApp.publicKey;

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
  res.json({
    configurationData: {
      initialize: {
        name: 'Smart Notifications',
        description: 'Location-aware notifications',
        id: 'app',
        permissions: [
          'r:installedapps:*',
          'l:devices',
          'r:devices:*',
          'w:devices:*',
          'x:devices:*',
          'r:schedules',
          'r:locations:*'
        ],
        firstPageId: '1'
      }
    }
  });
  res.send();
}

function handleConfigurationPage(req, res) {
  res.json({
    configurationData: {
      page: {
        pageId: '1',
        name: 'Dependent settings',
        nextPageId: null,
        previousPageId: null,
        complete: true,
        sections: [
          {
            'name': 'Get smart notifications about door locks opening and closing.',
            'settings': [
              {
                'id': 'doorLock',
                'name': 'Which door locks?',
                'description': 'Tap to set',
                'type': 'DEVICE',
                'required': false,
                'multiple': true,
                'capabilities': [
                  'lock'
                ],
                'permissions': [
                  'r', 'x'
                ]
              }
            ]
          },
          {
            'name': 'Get smart notifications about switches turning on and off.',
            'settings': [
              {
                'id': 'switches',
                'name': 'Which switches?',
                'description': 'Tap to set',
                'type': 'DEVICE',
                'required': false,
                'multiple': true,
                'capabilities': [
                  'switch'
                ],
                'permissions': [
                  'r', 'x'
                ]
              }
            ]
          }
        ]
      }
    }
  });
  res.send();
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
    case 'INSTALL': {
      res.status(200);
      let data = new InstallData(req.body.installData);
      data.save((err) => {
        if (err) {
          console.log(err);
          res.status(500);
          res.send('Couldn\'t save installData.');
        } else {
          res.json({
            installData: {}
          });
          res.send();
        }
      });
      break;
    }
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