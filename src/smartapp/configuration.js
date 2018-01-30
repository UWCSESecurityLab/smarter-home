module.exports = {
  init: {
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
  },
  pages: [{
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
  }]
};