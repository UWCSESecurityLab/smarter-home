const log = require('./log');
const Errors = require('../errors');
const Flags = require('../flags');
const logger = require('./logger');
const request = require('request');
const User = require('./db/user');
const {google} = require('googleapis');

const FIREBASE_CONFIG = require('../config/firebase.json');

const ActivityGroup = 'activityFcmTokens';
const PermissionsGroup = 'permissionsFcmTokens';

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
    logger.error({
      message: 'FCM error',
      meta: { error: err }
    });
    log.error('FCM error');
    log.error(err);
    reject(err);
    return;
  }
  let json = JSON.stringify(body);
  if (res.statusCode !== 200) {
    log.error('FCM error');
    log.error(res.statusCode);
    log.error(json);
    logger.error({
      message: 'FCM error',
      meta: { error: err }
    });
    reject(json);
    return;
  }
  log.yellow('FCM response', json);
  resolve(json);
}

function sendFcmNotification(message) {
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

/**
 * Sends a notification to a single client about a device changing in the home.
 * @param {String} data.device The name/label of the device.
 * @param {String} data.capability The capability that had a state change.
 * @param {String} data.value The new value of the capability
 * @param {String} data.trigger The display name of the user who changed it
 * @param {String} token The target client's FCM token.
 */
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
            'content-available': 1
          },
          data: {
            activity: JSON.stringify(data)
          }
        }
      }
    }
  }
  console.log(message);
  return sendFcmNotification(message);
}

/**
 * Sends a permissions request notification to a single client.
 * @param {String} data.requester The name of the user making the request
 * @param {String} data.capability The capability to change
 * @param {String} data.command The command requested
 * @param {String} data.commandId The id identifying the request
 * @param {String} data.device The device to execute on
 * @param {String} data.approvalType The requested approval type
 * @param {String} token The target client's FCM token.
 */
function sendAskNotification(data, token) {
  let actionText;
  if (data.capability === 'switch') {
    actionText = `turn ${data.command}`
  } else if (data.capability === 'lock') {
    actionText = data.command;
  }
  let message = {
    message: {
      token: token,
      android: {
        data: {
          ask: JSON.stringify(data)
        }
      },
      webpush: {
        data: {
          ask: JSON.stringify(data)
        }
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1
          },
          data: {
            ask: JSON.stringify(data)
          }
        }
      }
    }
  };
  console.log(message);
  return sendFcmNotification(message);
}

function sendAskDecisionNotification(data, token) {
  let message = {
    message: {
      token: token,
      android: {
        data: {
          askDecision: JSON.stringify(data)
        }
      },
      webpush: {
        data: {
          askDecision: JSON.stringify(data)
        }
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1
          },
          data: {
            askDecision: JSON.stringify(data)
          }
        }
      }
    }
  }
  return sendFcmNotification(message);
}

function sendStateUpdateNotification(type, installedAppId) {
  console.log('sendStateUpdateNotification');
  User.find({ installedAppId: installedAppId }).then((users) => {
    // console.log(users);
    const tokens = users.reduce((accumulator, user) => {
      return accumulator.concat(user.permissionsFcmTokens);
    }, []);
    console.log(tokens);
    tokens.forEach((token) => {
      const message = {
        message: {
          token: token,
          android: {
            data: {
              update: type
            }
          },
          webpush: {
            data: {
              update: type
            }
          },
          apns: {
            payload: {
              aps: {
                'content-available': 1
              },
              data: {
                update: type
              }
            }
          }
        }
      };
      sendFcmNotification(message);
    });
  }).catch((err) => {
    console.log(err);
    if (err.name === 'MongoError') {
      logger.error({
        message: Errors.DB_ERROR,
        meta: { context: 'sendStateUpdateNotification', error: err }
      });
    }
  });
}


function ensureTokenIsInGroup({ user, newToken, tokenGroup }) {
  if (user[tokenGroup].length == 0) {
      user[tokenGroup].push(newToken);
  } else if (!user[tokenGroup].includes(newToken)){
    user[tokenGroup].push(newToken);
  }
}

function ensureTokenIsNotInGroup({ user, newToken, tokenGroup }) {
  if (user[tokenGroup].includes(newToken)) {
    user[tokenGroup].splice(user[tokenGroup].indexOf(newToken), 1);
  }
}

function updateActivityNotifications({ flags, user, token }) {
  console.log(flags);
  ensureTokenIsInGroup({
    user: user,
    newToken: token,
    tokenGroup: PermissionsGroup
  });
  const { ON, PROXIMITY, OFF} = Flags.ActivityNotifications;
  if (flags.activityNotifications == ON ||
      flags.activityNotifications == PROXIMITY ) {
    ensureTokenIsInGroup({
      user: user,
      newToken: token,
      tokenGroup: ActivityGroup
    });
  } else if (flags.activityNotifications == OFF) {
    ensureTokenIsNotInGroup({
      user: user,
      newToken: token,
      tokenGroup: ActivityGroup
    });
  }
  return user.save();
}

module.exports = {
  sendActivityNotification: sendActivityNotification,
  sendAskNotification: sendAskNotification,
  sendAskDecisionNotification: sendAskDecisionNotification,
  sendStateUpdateNotification: sendStateUpdateNotification,
  ensureTokenIsInGroup: ensureTokenIsInGroup,
  ensureTokenIsNotInGroup: ensureTokenIsNotInGroup,
  updateActivityNotifications: updateActivityNotifications,
}