const express = require('express');
const bodyParser = require('body-parser');

function handlePing(req, res) {
  res.status(200);
  res.json({
    pingData: {
      challenge: req.body.pingData.challenge
    }
  });
  res.send();
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

app.post('/webhook', (req, res) => {
  switch (req.body.lifecycle) {
    case 'PING':
      handlePing(req, res);
      break;
    case 'CONFIGURATION':
      if (req.body.configurationData == 'INITIALIZE') {
        handleConfigurationInit(req, res);
      } else {
        handleConfigurationPage(req, res);
      }
      break;
    case 'INSTALL':

    default:
      res.status(400);
      res.send();
  }
});


app.listen(5051);