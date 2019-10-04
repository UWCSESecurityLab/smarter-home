const {google} = require('googleapis');

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

getAccessToken().then(console.log);