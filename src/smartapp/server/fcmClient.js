const log = require('./log');
const Flags = require('../flags');
const request = require('request');
const {google} = require('googleapis');

const FIREBASE_CONFIG = require('../config/firebase.json');

const ActivityGroup = 'activityFcmTokens';
const ParentalControlsGroup = 'parentalControlsFcmTokens';

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

function sendActivityNotification(data, token) {
  let message = {
    message: {
      token: token,
      android: {
        data: {
          activity: JSON.stringify(data)
        }
      },
      webpush: {
        data: {
          activity: JSON.stringify(data)
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `${data.device} | ${data.capability} → ${data.value}`,
              body: `Triggered by ${data.trigger}`
            },
            badge: 0,
            sound: 'default'
          }
        }
      }
    }
  }
  console.log(message);

  return new Promise((resolve, reject) => {
    getAccessToken().then((accessToken) => {
      request.post({
        url: `https://fcm.googleapis.com/v1/projects/${FIREBASE_CONFIG.project_id}/messages:send`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        json: true,
        body: message
      }, (err, res, body) => handleFcmResponse(resolve, reject, err, res, body));
    });
  });
}

function ensureTokenIsInGroup({ user, newToken, tokenGroup }) {
  if (user[tokenGroup].length == 0) {
      user[tokenGroup].push(newToken);
      return user.save();
  } else if (!user[tokenGroup].includes(newToken)){
    user[tokenGroup].push(newToken);
    return user.save();
  } else {
    return Promise.resolve();
  }
}

function ensureTokenIsNotInGroup({ user, newToken, tokenGroup }) {
  if (user[tokenGroup].includes(newToken)) {
    user[tokenGroup].splice(user[tokenGroup].indexOf(newToken), 1);
    return user.save();
  } else {
    return Promise.resolve();
  }
}

function updateActivityNotifications({ flags, user, token }) {
  console.log(flags);
  const { ON, PROXIMITY, OFF} = Flags.ActivityNotifications;
  if (flags.activityNotifications == ON ||
      flags.activityNotifications == PROXIMITY ) {
    return ensureTokenIsInGroup({
      user: user,
      newToken: token,
      tokenGroup: ActivityGroup
    });
  } else if (flags.activityNotifications == OFF) {
    return ensureTokenIsNotInGroup({
      user: user,
      newToken: token,
      tokenGroup: ActivityGroup
    });
  } else {
    return Promise.reject({ error: 'Missing ActivityNotifications flag'});
  }
}

module.exports = {
  sendActivityNotification: sendActivityNotification,
  ensureTokenIsInGroup: ensureTokenIsInGroup,
  ensureTokenIsNotInGroup: ensureTokenIsNotInGroup,
  updateActivityNotifications: updateActivityNotifications
}