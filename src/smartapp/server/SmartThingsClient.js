const InstallData = require('./db/installData');
const log = require('./log');
const request = require('request');

const CONFIG = require('../config/config.json');

// Helper function for handling errors from the API.
function rejectErrors(err, resp, body, reject) {
  if (err) {
    log.red('SmartThings Request Error', err);
    reject(err);
    return true;
  } else if (resp.statusCode !== 200) {
    log.red('SmartThings Request Error', resp.statusCode);
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
  static listDevices(params) {
    return new Promise((resolve, reject) => {
      log.green('SmartThings Request', 'https://api.smartthings.com/v1/devices');
      request({
        method: 'GET',
        url: 'https://api.smartthings.com/v1/devices',
        headers: {
          'Authorization': `Bearer ${params.authToken}`
        }
      }, (err, resp, body) => {
        if (!rejectErrors(err, resp, body, reject)) {
          resolve(JSON.parse(body));
        }
      });
    });
  }

  /**
   *
   * @param {string} params.deviceId
   * @param {string} params.authToken
   */
  static getDeviceDescription(params) {
    return new Promise((resolve, reject) => {
      log.green('SmartThings Request', `https://api.smartthings.com/v1/devices/${params.deviceId}`);
      request({
        method: 'GET',
        url: `https://api.smartthings.com/v1/devices/${params.deviceId}`,
        headers: {
          'Authorization': 'Bearer ' + params.authToken
        }
      }, (err, resp, body) => {
        if (!rejectErrors(err, resp, body, reject)) {
          resolve(JSON.parse(body));
        }
      });
    })
  }

  /**
   * Get device component status.
   * @param {string} params.deviceId
   * @param {string} params.componentId
   * @param {string} params.authToken
   */
  static getDeviceComponentStatus(params) {
    return new Promise((resolve, reject) => {
      log.green('SmartThings Request', `https://api.smartthings.com/v1/devices/${params.deviceId}/components/${params.componentId}/status`);
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
    return new Promise((resolve, reject) => {
      log.green('SmartThings Request', `https://api.smartthings.com/v1/installedapps/${params.installedAppId}/subscriptions`);
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
          log.green('SmartThings Request', 'Subscribe Success');
          resolve(body);
        }
      });
    });
  }

  static renewTokens(installedAppId) {
    return new Promise((resolve, reject) => {
      InstallData.findOne({}, (err, installData) => {
        if (err) {
          log.red('DB Error', 'installed app not found');
          reject(err);
          return;
        }
        let credentials = new Buffer(
          CONFIG.oauthClientId + ':' + CONFIG.oauthClientSecret)
          .toString('base64');
        log.green('SmartThings Request', 'https://auth-global.api.smartthings.com/oauth/token');
        request({
          method: 'POST',
          url: 'https://auth-global.api.smartthings.com/oauth/token',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: {
            'grant_type': 'refresh_token',
            'client_id': CONFIG.oauthClientId,
            'client_secret': CONFIG.oauthClientSecret,
            'refresh_token': installData.refreshToken
          }
        }, (err, res, body) => {
          if (rejectErrors(err, res, body, reject)) {
            return;
          }
          let tokens = JSON.parse(body);
          installData.authToken = tokens.access_token;
          installData.refreshToken = tokens.refresh_token;
          installData.save((err) => {
            if (err) {
              reject(err);
            } else {
              resolve(tokens);
            }
          });
        });
      });
    });
  }
  /**
   * Create a schedule for this app to remind the server to update the refresh
   * token.
   * @param {string} params.installedAppId
   * @param {string} params.authToken
   */
  static createTokenUpdateSchedule(params) {
    return new Promise((resolve, reject) => {
      log.green('SmartThings Request', `https://api.smartthings.com/v1/installedapps/${params.installedAppId}/schedules`);
      console.log(params);
      request({
        method: 'POST',
        url: `https://api.smartthings.com/v1/installedapps/${params.installedAppId}/schedules`,
        json: true,
        headers: {
          'Authorization': `Bearer ${params.authToken}`
        },
        body: {
          name: 'update-tokens-schedule',
          cron: {
            expression: '0 12 ? * 3 *',
            timezone: 'PST'
          }
        }
      }, (err, res, body) => {
        if (!rejectErrors(err, res, body, reject)) {
          resolve();
        }
      });
    });
  }
}

module.exports = SmartThingsClient;