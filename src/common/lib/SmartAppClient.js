class SmartAppClient {
  constructor(host) {
    this.host = host;
  }

  login(username, password) {
    let query = `username=${username}&password=${password}`;
    return fetch(`${this.host}/login?` + query, {
      method: 'POST',
      credentials: 'same-origin'
    });
  }

  executeDeviceCommand(params) {
    return fetch(`${this.host}/devices/${params.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(params.command)
    });
  }

  getDeviceStatus(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/status`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  getDeviceDescriptions() {
    return fetch(`${this.host}/deviceDescriptions`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  updateNotificationToken(token) {
    return fetch(`${this.host}/notificationToken?token=${token}`, {
      method: 'POST',
      credentials: 'same-origin'
    });
  }

  refreshAccessToken() {
    return fetch(`${this.host}/refresh`, {
      credentials: 'same-origin'
    });
  }
}

export default SmartAppClient;