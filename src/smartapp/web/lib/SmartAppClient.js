const uuid = require('uuid/v4');

function handleJsonResponse(response) {
  return response.json().then(json => {
    return response.ok ? json : Promise.reject(json);
  });
}

class SmartAppClient {
  // @param noSession: set to true if we shouldn't generate a session, i.e.
  // in OAuth mode.
  constructor(noSession) {
    this.host = process.env.NODE_ENV === 'production'
    ? 'https://kadara.cs.washington.edu'
    : 'https://dev.kadara.cs.washington.edu';

    if (noSession) {
      // Early exit here, because the SmartThings Android App's Webview doesn't
      // support localStorage, and will crash and fail to render the page.
      return;
    }
    this.sessionId = localStorage.getItem('sessionId');
    if (!this.sessionId) {
      this.sessionId = uuid();
      localStorage.setItem('sessionId', this.sessionId);
    }
    console.log('Client session id: ' + this.sessionId);
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
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify(args)
    }).then(handleJsonResponse)
  }

  logout() {
    return fetch(`${this.host}/logout`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse)
    .then(() => {
      localStorage.setItem('authenticated', false);
    });
  }

  register(username, displayName, password, confirmPassword) {
    return fetch(`${this.host}/register`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({
        username: username,
        displayName: displayName,
        password: password,
        confirm: confirmPassword
      })
    }).then(handleJsonResponse);
  }

  executeDeviceCommand(params) {
    return fetch(`${this.host}/devices/${params.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      credentials: 'same-origin',
      body: JSON.stringify(params.command)
    }).then(handleJsonResponse);
  }

  getDeviceStatus(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/status`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then(handleJsonResponse);
  }

  getHomeConfig() {
    return fetch(`${this.host}/homeConfig`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then(handleJsonResponse);
  }

  getDeviceDescription(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/description`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then(handleJsonResponse);
  }

  updateNotificationToken(token, flags) {
    return fetch(`${this.host}/notificationToken`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        flags: flags
      })
    }).then(handleJsonResponse);
  }

  refreshAccessToken() {
    return fetch(`${this.host}/refresh`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  getRooms() {
    return fetch(`${this.host}/rooms`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  createRoom(name, roomId) {
    return fetch(`${this.host}/rooms/create`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({ name: name, roomId: roomId })
    }).then(handleJsonResponse);
  }

  deleteRoom(roomId) {
    return fetch(`${this.host}/rooms/${roomId}/delete`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  updateRoomName(roomId, name) {
    return fetch(`${this.host}/rooms/${roomId}/updateName`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({ name: name })
    }).then(handleJsonResponse);
  }

  reorderDeviceInRoom(roomId, srcIdx, destIdx) {
    return fetch(`${this.host}/rooms/${roomId}/reorderDeviceInRoom`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({ srcIdx: srcIdx, destIdx: destIdx })
    }).then(handleJsonResponse);
  }

  moveDeviceBetweenRooms(srcRoom, destRoom, srcIdx, destIdx) {
    return fetch(`${this.host}/rooms/moveDeviceBetweenRooms`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({
        srcRoom: srcRoom,
        destRoom: destRoom,
        srcIdx: srcIdx,
        destIdx: destIdx })
    }).then(handleJsonResponse);
  }

  addBeacon(beaconName) {
    return fetch(`${this.host}/beacon/add`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "Content-Type": "application/json",
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({
        name: beaconName
      })
    }).then(handleJsonResponse);
  }

  removeBeacon(beaconName) {
    return fetch(`${this.host}/beacon/remove`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "Content-Type": "application/json",
        'Client-Session': this.sessionId
      },
      body: JSON.stringify({
        name: beaconName
      })
    }).then(handleJsonResponse);
  }

  listUsers() {
    return fetch(`${this.host}/users`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  getUser(userId) {
    return fetch(`${this.host}/users/${userId}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  updateUserRole(userId, role) {
    return fetch(`${this.host}/users/${userId}/updateRole`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: role })
    }).then(handleJsonResponse);
  }

  addNewUser(publicKey, displayName, role) {
    return fetch(`${this.host}/users/new`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicKey: publicKey, displayName: displayName, role: role })
    }).then(handleJsonResponse);
  }

  addKeyToUser(publicKey, userId) {
    return fetch(`${this.host}/users/addKey`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicKey: publicKey, userId: userId })
    }).then(handleJsonResponse);
  }

  authChallenge(publicKey) {
    return fetch(`${this.host}/authChallenge`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicKey: publicKey })
    }).then(handleJsonResponse);
  }

  authResponse(signature) {
    return fetch(`${this.host}/authResponse`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signature: signature })
    }).then(handleJsonResponse);
  }

  postUserReport(report, type) {
    return fetch(`${this.host}/userReport/${type}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ report: report })
    }).then(handleJsonResponse);
  }

  getPermissions(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/permissions`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    }).then(handleJsonResponse);
  }

  modifyPermission({ deviceId, ...permissions }) {
    return fetch(`${this.host}/devices/${deviceId}/permissions`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permissions)
    }).then(handleJsonResponse);
  }
}

export default SmartAppClient;