class SmartAppClient {
  constructor() {
    this.host = 'https://kadara.cs.washington.edu';
  }

  login(username, password, oauth, oauthState) {
    let args = {
      username: username,
      password: password,
      oauth: oauth ? 'true' : 'false'
    };
    if (oauthState) {
      args.oauthState = oauthState;
    }
    return fetch(`${this.host}/login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args)
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

  getHomeConfig() {
    return fetch(`${this.host}/homeConfig`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  getDeviceDescription(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/description`, {
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

  getRooms() {
    return fetch(`${this.host}/rooms`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  createRoom(name) {
    return fetch(`${this.host}/rooms/create`, {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({ name: name })
    }).then((response) => response.json());
  }

  deleteRoom(roomId) {
    return fetch(`${this.host}/rooms/${roomId}/delete`, {
      method: 'POST',
      credentials: 'same-origin',
    }).then((response) => response.json());
  }

  updateRoomName(roomId, name) {
    return fetch(`${this.host}/rooms/${roomId}/updateName`, {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({ name: name })
    }).then((response) => response.json());
  }

  addDeviceToRoom(roomId, deviceId) {
    return fetch(`${this.host}/rooms/${roomId}/addDevice`, {
      method: 'POST',
      credentials: 'same-origin',
      body: { deviceId: deviceId }
    }).then((response) => response.json());
  }

  removeDeviceFromRoom(roomId, deviceId) {
    return fetch(`${this.host}/rooms/${roomId}/removeDevice`, {
      method: 'POST',
      credentials: 'same-origin',
      body: { deviceId: deviceId }
    }).then((response) => response.json());
  }
}

export default SmartAppClient;