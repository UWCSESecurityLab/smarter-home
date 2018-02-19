const InstallData = require('./db/installData');
const request = require('request');

const CONFIG = require('../config/config.json');

// Helper function for handling errors from the API.
function rejectErrors(err, resp, body, reject) {
  if (err) {
    console.log(err);
    reject(err);
    return true;
  } else if (resp.statusCode !== 200) {
    console.log(resp.statusCode);
    console.log(body);
    if (body) {
      reject(body);
    } else {
      reject(resp.statusCode);
    }
    return true;
  } else {
    return false;
  }
}

class SmartThingsClient {
  /**
   * Get device component status.
   * @param {string} params.deviceId
   * @param {string} params.componentId
   * @param {string} params.authToken
   */
  static getDeviceComponentStatus(params) {
    console.log(`https://api.smartthings.com/v1/devices/${params.deviceId}/components/${params.componentId}/status`);
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        url: `https://api.smartthings.com/v1/devices/${params.deviceId}/components/${params.componentId}/status`,
        headers: {
          'Authorization': 'Bearer ' + params.authToken
        }
      }, (err, resp, body) => {
        if (!rejectErrors(err, resp, body, reject)) {
          resolve({
            deviceId: params.deviceId,
            componentId: params.componentId,
            status: JSON.parse(body)
          });
        }
      });
    });
  }

  /**
   * Subscribe to events from a device.
   * @param {string} params.installedAppId
   * @param {object} params.subscriptionBody
   * @param {string} params.authToken
   */
  static subscribe(params) {
    console.log(`https://api.smartthings.com/v1/installedapps/${params.installedAppId}/subscriptions`);
    return new Promise((resolve, reject) => {
      request({
        url: `https://api.smartthings.com/v1/installedapps/${params.installedAppId}/subscriptions`,
        method: 'POST',
        json: true,
        headers: {
          'Authorization': `Bearer ${params.authToken}`
        },
        body: params.subscriptionBody
      }, (err, res, body) => {
        if (!rejectErrors(err, res, body, reject)) {
          resolve(body);
        }
      });
    });
  }

  static renewTokens(installedAppId) {
    return new Promise((resolve, reject) => {
      InstallData.findOne({}, (err, installData) => {
        if (err) {
          reject(err);
          return;
        }
        let credentials = new Buffer(
          CONFIG.oauthClientId + ':' + CONFIG.oauthClientSecret)
          .toString('base64');
        request({
          method: 'POST',
          url: 'https://auth-global.api.smartthings.com/oauth/token',
          headers: {
            'Authorization': 'Basic ' + credentials,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: {
            'grant_type': 'refresh_token',
            'client_id': CONFIG.oauthClientId,
            'client_secret': CONFIG.oauthClientSecret,
            'refresh_token': installData.refreshToken
          }
        }, (err, res, body) => {
          if (rejectErrors(err, res, body, reject)) {
            return;
          }
          installData.authToken = body.access_token;
          installData.refreshToken = body.refresh_token;
          installData.save((err) => {
            if (err) {
              reject(err);
            } else {
              resolve(body.access_token);
            }
          });
        });
      });
    });
  }
}

module.exports = SmartThingsClient;