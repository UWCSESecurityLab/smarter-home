const {google} = require('googleapis');
const log = require('./log');
const request = require('request');
const FIREBASE_CONFIG = require('../config/firebase-messaging.json');

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

function sendNotification(data, notificationKey) {
  let notification = {
    "to": notificationKey,
    "data": {
      smartapp: JSON.stringify(data)
    }
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

function modifyDeviceGroup({user, fcmToken, operation, android}) {
  log.magenta('FCM Client', `modifyDeviceGroup: op = ${operation}, token = ${fcmToken}, key = ${user.notificationKey}`);
  let key_name = user.id;
  if (android) {
    key_name += '-android';
  }

  let body = {
    operation: operation,
    notification_key_name: key_name,
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
 * @param {bool} params.android Whether this group should receive data
 *                              notifications.
 */
function createDeviceGroup(params) {
  params.operation = 'create';
  return modifyDeviceGroup(params);
}

/**
 * @param {User} params.user The mongoose user document.
 * @param {string} params.fcmToken The token to add to the user's existing
 *                                  device group.
 * @param {bool} params.android Whether this token should be added to the
 *                              data notifications group.
 */
function addDeviceToDeviceGroup(params) {
  params.operation = 'add'
  return modifyDeviceGroup(params);
}

/**
 * @param {User} params.user The mongoose user document.
 * @param {string} params.fcmToken The token to include in the new device group.
 * @param {bool} params.android true if this token needs to be removed from the
 *                              data notifications group.
 */
function removeDeviceFromDeviceGroup(params) {
  params.operation = 'remove'
  return modifyDeviceGroup(params);
}

module.exports = {
  sendNotification: sendNotification,
  createDeviceGroup: createDeviceGroup,
  addDeviceToDeviceGroup: addDeviceToDeviceGroup,
  removeDeviceFromDeviceGroup: removeDeviceFromDeviceGroup
}