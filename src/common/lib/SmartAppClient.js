const uuid = require('uuid/v4');

function handleJsonResponse(response) {
  return response.json().then(json => {
    return response.ok ? json : Promise.reject(json);
  });
}

// Global variable holding the client's session id. Why? So that this variable
// is a singleton but the class is not, so that we can disable sessions for
// the OAuth client for the SmartThings webview. Aargh.
let sessionId;

class SmartAppClient {
  // @param noSession: set to true if we shouldn't generate a session, i.e.
  // in oauth mode (esp b/c smartthings app webview doesn't have localstorage)
  constructor(noSession) {
    this.host = 'https://kadara.cs.washington.edu';
    if (noSession) {
      return;
    }
    sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuid();
      localStorage.setItem('sessionId', sessionId);
    }
    console.log('Client session id: ' + sessionId);
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
    });
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
      sessionId = uuid();
      localStorage.setItem('sessionId', sessionId);
    });
  }

  register(username, password, confirmPassword) {
    return fetch(`${this.host}/register`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
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
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      credentials: 'same-origin',
      body: JSON.stringify(params.command)
    });
  }

  getDeviceStatus(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/status`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then((response) => response.json());
  }

  getHomeConfig() {
    return fetch(`${this.host}/homeConfig`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then((response) => response.json());
  }

  getDeviceDescription(deviceId) {
    return fetch(`${this.host}/devices/${deviceId}/description`, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then((response) => response.json());
  }

  updateNotificationToken(token) {
    return fetch(`${this.host}/notificationToken?token=${token}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      }
    });
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
    }).then((response) => response.json());
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
}

export default SmartAppClient;