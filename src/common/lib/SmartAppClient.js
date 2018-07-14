function handleJsonResponse(response) {
  return response.json().then(json => {
    return response.ok ? json : Promise.reject(json);
  });
}

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
    }).then(handleJsonResponse);
  }

  getRooms() {
    return fetch(`${this.host}/rooms`, {
      credentials: 'same-origin'
    }).then((response) => response.json());
  }

  createRoom(name, roomId) {
    return fetch(`${this.host}/rooms/create`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: name, roomId: roomId })
    }).then(handleJsonResponse);
  }

  deleteRoom(roomId) {
    return fetch(`${this.host}/rooms/${roomId}/delete`, {
      method: 'POST',
      credentials: 'same-origin',
    }).then(handleJsonResponse);
  }

  updateRoomName(roomId, name) {
    return fetch(`${this.host}/rooms/${roomId}/updateName`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: name })
    }).then(handleJsonResponse);
  }

  reorderDeviceInRoom(roomId, srcIdx, destIdx) {
    return fetch(`${this.host}/rooms/${roomId}/reorderDeviceInRoom`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ srcIdx: srcIdx, destIdx: destIdx })
    }).then(handleJsonResponse);
  }

  moveDeviceBetweenRooms(srcRoom, destRoom, srcIdx, destIdx) {
    return fetch(`${this.host}/rooms/moveDeviceBetweenRooms`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        srcRoom: srcRoom,
        destRoom: destRoom,
        srcIdx: srcIdx,
        destIdx: destIdx })
    }).then(handleJsonResponse);
  }
}

export default SmartAppClient;