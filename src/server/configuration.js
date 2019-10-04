let oauthUrl;
if (process.env.SERVER_MODE === 'prod') {
  oauthUrl = 'https://kadara.cs.washington.edu/oauth';
} else if (process.env.SERVER_MODE === 'dev') {
  oauthUrl = 'https://dev.kadara.cs.washington.edu/oauth'
}


module.exports = {
  init: {
    configurationData: {
      initialize: {
        name: 'SmarterHome',
        description: 'Smart notifications, parental controls, and location controls',
        id: 'app',
        permissions: [],
        firstPageId: 'oauth'
      }
    }
  },
  pages: {
    oauth: {
      configurationData: {
        page: {
          pageId: 'oauth',
          name: 'Setup SmarterHome',
          nextPageId: 'devices',
          previousPageId: null,
          complete: false,
          sections: [{
            name: 'Connect SmarterHome with SmartThings',
            settings: [
              {
                id: 'oauth',
                name: 'Log in with your SmarterHome account',
                description: 'Tap here to log in',
                type: 'OAUTH',
                urlTemplate: oauthUrl
              }
            ]
          }]
        }
      }
    },
    devices: {
      configurationData: {
        page: {
          pageId: 'devices',
          name: 'Select Devices',
          nextPageId: null,
          previousPageId: 'oauth',
          complete: true,
          sections: [
            {
              name: 'Please grant SmarterHome access to the devices in your home.',
              settings: [
                {
                  id: 'doorLocks',
                  name: 'Select door locks',
                  description: 'Tap to set',
                  type: 'DEVICE',
                  required: false,
                  multiple: true,
                  capabilities: ['lock'],
                  permissions: ['r', 'x']
                }
              ]
            },
            {
              name: '',
              settings: [
                {
                  id: 'switches',
                  name: 'Select switches',
                  description: 'Tap to set',
                  type: 'DEVICE',
                  required: false,
                  multiple: true,
                  capabilities: ['switch'],
                  permissions: ['r', 'x']
                }
              ]
            },
            {
              name: '',
              settings: [
                {
                  id: 'contactSensors',
                  name: 'Select contact sensors',
                  description: 'Tap to set',
                  type: 'DEVICE',
                  required: false,
                  multiple: true,
                  capabilities: ['contactSensor'],
                  permissions: ['r', 'x']
                }
              ]
            },
            {
              name: '',
              settings: [
                {
                  id: 'motionSensors',
                  name: 'Select motion sensors',
                  description: 'Tap to set',
                  type: 'DEVICE',
                  required: false,
                  multiple: true,
                  capabilities: ['motionSensor'],
                  permissions: ['r', 'x']
                }
              ]
            }
          ]
        }
      }
    }
  }
};