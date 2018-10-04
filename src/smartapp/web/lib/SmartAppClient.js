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

  getJson(url) {
    return fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Client-Session': this.sessionId
      },
    }).then(handleJsonResponse);
  }

  postJson(url, body) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Client-Session': this.sessionId
      },
      body: JSON.stringify(body)
    }).then(handleJsonResponse);
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
    return this.postJson(`${this.host}/register`, {
      username: username,
      displayName: displayName,
      password: password,
      confirm: confirmPassword
    });
  }

  executeDeviceCommand(params) {
    return this.postJson(`${this.host}/devices/${params.deviceId}/commands`, params.command);
  }

  requestDeviceCommand(params) {
    return this.postJson(`${this.host}/devices/${params.deviceId}/requestCommand`, params.command);
  }

  getPendingCommands() {
    return this.getJson(`${this.host}/pendingCommands`);
  }

  postPendingCommand(commandId, approvalType, approvalState) {
    return this.postJson(`${this.host}/pendingCommands/${commandId}`, {
      approvalType: approvalType,
      approvalState: approvalState
    });
  }

  getDeviceStatus(deviceId) {
    return this.getJson(`${this.host}/devices/${deviceId}/status`);
  }

  getHomeConfig() {
    return this.getJson(`${this.host}/homeConfig`);
  }

  getDeviceDescription(deviceId) {
    return this.getJson(`${this.host}/devices/${deviceId}/description`);
  }

  updateNotificationToken(token, flags) {
    return this.postJson(`${this.host}/notificationToken`, {
      token: token,
      flags: flags
    });
  }

  refreshAccessToken() {
    return this.getJson(`${this.host}/refresh`);
  }

  getRooms() {
    return this.getJson(`${this.host}/rooms`);
  }

  createRoom(name, roomId) {
    return this.postJson(`${this.host}/rooms/create`, {
      name: name,
      roomId: roomId
    });
  }

  deleteRoom(roomId) {
    return this.postJson(`${this.host}/rooms/${roomId}/delete`, {});
  }

  updateRoomName(roomId, name) {
    return this.postJson(`${this.host}/rooms/${roomId}/updateName`, {
      name: name
    });
  }

  reorderDeviceInRoom(roomId, srcIdx, destIdx) {
    return this.postJson(`${this.host}/rooms/${roomId}/reorderDeviceInRoom`, {
      srcIdx: srcIdx,
      destIdx: destIdx
    });
  }

  moveDeviceBetweenRooms(srcRoom, destRoom, srcIdx, destIdx) {
    return this.postJson(`${this.host}/rooms/moveDeviceBetweenRooms`, {
      srcRoom: srcRoom,
      destRoom: destRoom,
      srcIdx: srcIdx,
      destIdx: destIdx
    });
  }

  addBeacon(beaconName) {
    return this.postJson(`${this.host}/beacon/add`, {
      name: beaconName
    });
  }

  removeBeacon(beaconName) {
    return this.postJson(`${this.host}/beacon/remove`, {
      name: beaconName
    });
  }

  listUsers() {
    return this.getJson(`${this.host}/users`);
  }

  getUser(userId) {
    return this.getJson(`${this.host}/users/${userId}`);
  }

  updateUserRole(userId, role) {
    return this.postJson(`${this.host}/users/${userId}/updateRole`, {
      role: role
    });
  }

  addNewUser(publicKey, displayName, role) {
    return this.postJson(`${this.host}/users/new`, {
      publicKey: publicKey,
      displayName: displayName,
      role: role
    });
  }

  addKeyToUser(publicKey, userId) {
    return this.postJson(`${this.host}/users/addKey`, {
      publicKey: publicKey,
      userId: userId
    });
  }

  authChallenge(publicKey) {
    return this.postJson(`${this.host}/authChallenge`, {
      publicKey: publicKey
    });
  }

  authResponse(signature) {
    return this.postJson(`${this.host}/authResponse`, {
      signature: signature
    });
  }

  postUserReport(report, type) {
    return this.postJson(`${this.host}/userReport/${type}`, {
      report: report
    });
  }

  getPermissions(deviceId) {
    return this.getJson(`${this.host}/devices/${deviceId}/permissions`);
  }

  modifyPermission({ deviceId, ...permissions }) {
    return this.postJson(`${this.host}/devices/${deviceId}/permissions`, permissions);
  }

  sendClientLog(level, message, meta) {
    console.log(meta);
    return this.postJson(`${this.host}/clientLog`, {
      level: level,
      message: message,
      meta: meta
    });
  }
}

export default SmartAppClient;