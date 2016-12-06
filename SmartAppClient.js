'use strict';
const request = require('request');

class SmartAppClient {
  // TODO: Pass session in constructor, parse session data into fields?
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  listEndpoints() {
    return new Promise(function(resolve, reject) {
      request({
        method: 'GET',
        url: 'https://graph.api.smartthings.com/api/smartapps/endpoints',
        headers: {
          'Authorization': 'Bearer ' + this.accessToken
        }
      }, function(err, res, body) {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      });
    }.bind(this));
  }
}

let client = new SmartAppClient();
// client.authorize('localhost:3000/auth/return');

module.exports = SmartAppClient;
