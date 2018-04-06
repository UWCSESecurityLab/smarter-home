class SmartAppClient {
  constructor(host) {
    this.host = host;
  }

  login(username, password, oauth) {
    return fetch(`${this.host}/login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        oauth: oauth ? 'true' : 'false'
      })
    });
  }

  register(username, password, confirmPassword) {
    return fetch(`${this.host}/register`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        confirm: confirmPassword
      })
    });
  }

  executeDeviceCommand(params) {
    return fetch(`${this.host}/devices/${params.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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