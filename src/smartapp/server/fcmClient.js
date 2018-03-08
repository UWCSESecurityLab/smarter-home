const {google} = require('googleapis');
const log = require('./log');
const request = require('request');

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

function sendNotification(data, token) {
  let notification = {
    "message": {
      "token": token,
      "data": {
        smartapp: JSON.stringify(data)
      }
    }
  }

  return new Promise((resolve, reject) => {
    getAccessToken().then((token) => {
      request.post({
        url: 'https://fcm.googleapis.com/v1/projects/iot-stuff-8e265/messages:send',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        json: true,
        body: notification
      }, (err, res, body) => {
        if (err) {
          log.error(err);
        }
        if (res.statusCode !== 200) {
          log.error(res.statusCode);
          log.error(JSON.stringify(body));
        }
        log.yellow('FCM response', JSON.stringify(body));
      });
    });
  });
}

module.exports = {
  sendNotification: sendNotification
}