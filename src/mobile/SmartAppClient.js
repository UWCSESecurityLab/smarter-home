import ORIGIN from './origin';

class SmartAppClient {
  static executeDeviceCommand(params) {
    return fetch(`${ORIGIN}/devices/${params.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'credentials': 'same-origin',
        'content-type': 'application/json'
      },
      body: JSON.stringify(params.command)
    });
  }

  static getDeviceStatus(deviceId) {
    return fetch(`${ORIGIN}/devices/${deviceId}/status`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }
}

export default SmartAppClient;