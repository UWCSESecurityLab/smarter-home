'use strict';
const request = require('request');

class SmartAppClient {
  // TODO: Pass session in constructor, parse session data into fields?
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.listEndpoints().then((endpoints) => {
      this.apiUrl = endpoints[0].uri;
    });
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

  contactStatus() {
    return this.getAPI('contact');
  }

  temperatureStatus() {
    return this.getAPI('temp');
  }

  switchStatus() {
    return this.getAPI('switch');
  }

  lockStatus() {
    return this.getAPI('lock');
  }

  setSwitch(status) {
    switch (status) {
      case 'on':
        return this.postAPI('switch', 'on');
      case 'off':
        return this.postAPI('switch', 'off');
      default:
        return Promise.reject('Cannot set switch to "' + status + '".');
    }
  }

  setLock(status) {
    switch(status) {
      case 'lock':
        return this.postAPI('lock', 'lock');
      case 'unlock':
        return this.postAPI('lock', 'unlock');
      default:
        return Promise.reject('Cannot set lock to "' + status + '".');
    }
  }

  getAPI(endpoint) {
    return new Promise(function(resolve, reject) {
      request({
        method: 'GET',
        url: this.apiUrl + '/' + endpoint,
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

  postAPI(endpoint, params) {
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        url: this.apiUrl + '/' + endpoint + '/' + params,
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

module.exports = SmartAppClient;
