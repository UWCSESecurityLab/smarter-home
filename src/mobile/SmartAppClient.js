import ORIGIN from './origin';

class SmartAppClient {
  static executeDeviceCommand(params) {
    return fetch(`${ORIGIN}/devices/${params.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(params.command)
    });
  }

  static getDeviceStatus(deviceId) {
    return fetch(`${ORIGIN}/devices/${deviceId}/status`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  static getDeviceDescriptions() {
    return fetch(`${ORIGIN}/deviceDescriptions`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  static updateNotificationToken(token) {
    return fetch(`${ORIGIN}/notificationToken?token=${token}`, {
      method: 'POST',
      credentials: 'same-origin'
    });
  }

  static refreshAccessToken() {
    return fetch(`${ORIGIN}/refresh`, {
      credentials: 'same-origin'
    });
  }
}

export default SmartAppClient;