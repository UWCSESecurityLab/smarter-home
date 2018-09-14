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
        description: 'Location-aware notifications',
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
          name: 'Setup Smart Notifications',
          nextPageId: 'devices',
          previousPageId: null,
          complete: false,
          sections: [{
            name: 'Connect with the Smart Notifications service',
            settings: [
              {
                id: 'oauth',
                name: 'Log in with your Smart Notifications account',
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
              name: 'Get smart notifications about door locks opening and closing.',
              settings: [
                {
                  id: 'doorLocks',
                  name: 'Which door locks?',
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
              name: 'Get smart notifications about switches turning on and off.',
              settings: [
                {
                  id: 'switches',
                  name: 'Which switches?',
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
              name: 'Get smart notifications about when your contact sensors open and close.',
              settings: [
                {
                  id: 'contactSensors',
                  description: 'Tap to set',
                  type: 'DEVICE',
                  required: false,
                  multiple: true,
                  capabilities: ['contactSensor'],
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