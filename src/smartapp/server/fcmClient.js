const log = require('./log');
const Flags = require('../flags');
const request = require('request');
const {google} = require('googleapis');

const FIREBASE_CONFIG = require('../config/firebase-messaging.json');

const ActivityGroup = {
  fcmTokens: 'activityFcmTokens',
  fcmKey: 'activityFcmKey',
  keyName: '-activity'
};

const ParentalControlsGroup = {
  fcmTokens: 'parentalControlsFcmTokens',
  fcmKey: 'parentalControlsFcmKey',
  keyName: '-parental-controls'
};

function getAccessToken() {
  return new Promise(function(resolve, reject) {
    var key = require('../config/firebase.json');
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/firebase.messaging'],
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

function handleFcmResponse(resolve, reject, err, res, body) {
  if (err) {
    log.error('FCM error');
    log.error(err);
    reject(err);
  }
  let json = JSON.stringify(body);
  if (res.statusCode !== 200) {
    log.error('FCM error');
    log.error(res.statusCode);
    log.error(json);
    reject(json);
  }
  log.yellow('FCM response', json);
  resolve(json);
}

function sendActivityNotification(data, notificationKey) {
  let notification = {
    to: notificationKey,
    android: {
      data: {
        smartapp: JSON.stringify(data)
      }
    },
    webpush: {
      data: {
        smartapp: JSON.stringify(data)
      }
    }
    // TODO: APNS
  }

  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Authorization': `key=${FIREBASE_CONFIG.server_key}`
      },
      json: true,
      body: notification
    }, (err, res, body) => handleFcmResponse(resolve, reject, err, res, body));
  });
}

function modifyDeviceGroup({user, fcmToken, operation, keyName}) {
  log.magenta('FCM Client', `modifyDeviceGroup: op = ${operation}, token = ${fcmToken}, key = ${user.notificationKey}`);
  let body = {
    operation: operation,
    notification_key_name: user.id + '-' + keyName,
    registration_ids: [fcmToken]
  }
  if (operation == 'add' || operation == 'remove') {
    body.notification_key = user.notificationKey;
  }

  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://fcm.googleapis.com/fcm/notification',
      headers: {
        'Authorization': `key=${FIREBASE_CONFIG.server_key}`,
        'project_id': FIREBASE_CONFIG.sender_id
      },
      json: true,
      body: body
    }, (err, res, body) => handleFcmResponse(resolve, reject, err, res, body));
  });
}

/**
 * @param {User} params.user The mongoose user document.
 * @param {string} params.fcmToken The token to include in the new device group.
 * @param {bool} params.keyName
 */
function createDeviceGroup(params) {
  params.operation = 'create';
  return modifyDeviceGroup(params);
}

/**
 * @param {User} params.user The mongoose user document.
 * @param {string} params.fcmToken The token to add to the user's existing
 *                                  device group.
 * @param {bool} params.keyName
 */
function addDeviceToDeviceGroup(params) {
  params.operation = 'add'
  return modifyDeviceGroup(params);
}

/**
 * @param {User} params.user The mongoose user document.
 * @param {string} params.fcmToken The token to include in the new device group.
 * @param {bool} params.keyName
 */
function removeDeviceFromDeviceGroup(params) {
  params.operation = 'remove'
  return modifyDeviceGroup(params);
}

function ensureTokenIsInGroup({ user, newToken, group }) {
  const { fcmTokens, fcmKey, keyName } = group;
  if (user[fcmTokens].length == 0) {
    return createDeviceGroup({
      user: user,
      fcmToken: newToken,
      keyName: keyName
    }).then((newKey) => {
      user[fcmKey] = newKey;
      user[fcmTokens].push(newToken);
      return user.save();
    });
  } else if (!user[fcmTokens].includes(newToken)){
    return addDeviceToDeviceGroup({
      user: user,
      fcmToken: newToken,
      keyName: keyName
    }).then(() => {
      user[fcmTokens].push(newToken);
      return user.save();
    });
  } else {
    return Promise.resolve();
  }
}

function ensureTokenIsNotInGroup({ user, newToken, group }) {
  const { fcmTokens, fcmKey, keyName } = group;
  if (user[fcmTokens].includes(newToken)) {
    return removeDeviceFromDeviceGroup({
      user: user,
      fcmToken: newToken,
      keyName: keyName
    }).then(() => {
      user[fcmTokens].splice(user[fcmTokens].indexOf(newToken), 1);
      if (user[fcmTokens].length == 0) {
        user[fcmKey] = null;
      }
      return user.save();
    });
  } else {
    return Promise.resolve();
  }
}

function updateActivityNotifications({ flags, user, token }) {
  const { ON, PROXIMITY, OFF} = Flags.ActivityNotifications;
  if (flags.activityNotifications == ON ||
      flags.activityNotifications == PROXIMITY ) {
    return ensureTokenIsInGroup({
      user: user,
      newToken: token,
      group: ActivityGroup
    });
  } else if (flags.activityNotifications == OFF) {
    return ensureTokenIsNotInGroup({
      user: user,
      newToken: token,
      group: ActivityGroup
    });
  } else {
    return Promise.reject({ error: 'Missing ActivityNotifications flag'});
  }
}

module.exports = {
  sendActivityNotification: sendActivityNotification,
  createDeviceGroup: createDeviceGroup,
  addDeviceToDeviceGroup: addDeviceToDeviceGroup,
  removeDeviceFromDeviceGroup: removeDeviceFromDeviceGroup,
  ensureTokenIsInGroup: ensureTokenIsInGroup,
  ensureTokenIsNotInGroup: ensureTokenIsNotInGroup,
  updateActivityNotifications: updateActivityNotifications
}