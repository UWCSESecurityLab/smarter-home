const log = require('./log');
const Flags = require('../flags');
const request = require('request');
const {google} = require('googleapis');

const FIREBASE_CONFIG = require('../config/firebase-messaging.json');

const ActivityPush = {
  fcmTokens: 'activityPushFcmTokens',
  fcmKey: 'activityPushFcmKey',
  keyName: '-activity-push'
}

const ActivityData = {
  fcmTokens: 'activityDataFcmTokens',
  fcmKey: 'activityDataFcmKey',
  keyName: '-activity-data'
}


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

function sendNotification(notification) {
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

function sendDataNotification(data, notificationKey) {
  let notification = {
    "to": notificationKey,
    "data": {
      smartapp: JSON.stringify(data)
    }
  }
  return sendNotification(notification);
}

function sendPushNotification(data, notificationKey) {
  let notification = {
    to: notificationKey,
    notification: {
      title: `${data.device} | ${data.capability} → ${data.value}`,
      body: 'Triggered by ' + data.trigger
    }
  }
  return sendNotification(notification);
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
    return fcmClient.createDeviceGroup({
      user: user,
      fcmToken: newToken,
      keyName: keyName
    }).then((newKey) => {
      user[fcmKey] = newKey;
      user[fcmTokens].push(newToken);
      return user.save();
    });
  } else if (!user[fcmTokens].includes(newToken)){
    return fcmClient.addDeviceToDeviceGroup({
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
  const { fcmTokens, keyName } = group;
  if (user[fcmTokens].includes(newToken)) {
    return fcmClient.removeDeviceFromDeviceGroup({
      user: user,
      fcmToken: newToken,
      keyName: keyName
    }).then(() => {
      user[fcmTokens].splice(user[fcmTokens].indexOf(newToken), 1);
      return user.save();
    });
  } else {
    return Promise.resolve();
  }
}

function updateActivityNotifications({flags, user, token}) {
  switch (flags.activityNotifications) {
    case Flags.ActivityNotifications.ON: {
      return Promise.all([
        ensureTokenIsInGroup({
          user: user,
          newToken: token,
          group: ActivityPush
        }),
        ensureTokenIsNotInGroup({
          user: user,
          newToken: token,
          group: ActivityData
        })
      ]);
    }
    case Flags.ActivityNotifications.PROXIMITY: {
      return Promise.all([
        ensureTokenIsNotInGroup({
          user: user,
          newToken: token,
          group: ActivityPush
        }),
        ensureTokenIsInGroup({
          user: user,
          newToken: token,
          group: ActivityData
        })
      ]);
    }
    case Flags.ActivityNotifications.OFF: {
      return Promise.all([
        ensureTokenIsNotInGroup({
          user: user,
          newToken: token,
          group: ActivityPush
        }),
        ensureTokenIsNotInGroup({
          user: user,
          newToken: token,
          group: ActivityData
        })
      ]);
    }
    default:
      return Promise.reject({ error: 'Missing ActivityNotifications flag'});
  }
}

module.exports = {
  sendDataNotification: sendDataNotification,
  sendPushNotification: sendPushNotification,
  createDeviceGroup: createDeviceGroup,
  addDeviceToDeviceGroup: addDeviceToDeviceGroup,
  removeDeviceFromDeviceGroup: removeDeviceFromDeviceGroup,
  ensureTokenIsInGroup: ensureTokenIsInGroup,
  ensureTokenIsNotInGroup: ensureTokenIsNotInGroup,
  updateActivityNotifications: updateActivityNotifications
}