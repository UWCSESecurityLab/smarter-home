const bodyParser = require('body-parser');
const express = require('express');
const httpSignature = require('http-signature');

const CONFIG = require('./auth/config.json');
const PUBLIC_KEY = CONFIG.app.webhookSmartApp.publicKey;

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
          'i:deviceprofiles',
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
  });
  res.send();
}

app.post('/', (req, res) => {
  if (!req.body) {
    res.status(400);
    res.send('Invalid request');
    return;
  }

  if (req.body.lifecycle === 'PING') {
    console.log('PING');
    console.log(req.body);
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
      console.log('CONFIGURATION');
      console.log(req.body);
      if (req.body.configurationData == 'INITIALIZE') {
        handleConfigurationInit(req, res);
      } else {
        handleConfigurationPage(req, res);
      }
      break;
    case 'INSTALL':
      console.log('UNINSTALL');
      console.log(req.body);
      res.status(200);
      res.json({
        installData: {}
      });
      res.send();
      break;
    case 'UPDATE':
      console.log('UPDATE');
      console.log(req.body);
      res.status(200);
      res.json({
        updateData: {}
      });
      res.send();
      break;
    case 'EVENT':
      console.log('EVENT');
      console.log(req.body);
      res.status(200);
      res.json({
        eventData: {}
      });
      res.send();
      break;
    case 'OAUTH_CALLBACK':
      console.log('OAUTH_CALLBACK');
      console.log(req.body);
      res.status(200);
      res.json({
        oAuthCallbackData: {}
      });
      res.send();
      break;
    case 'UNINSTALL':
      console.log('UNINSTALL');
      console.log(req.body);
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