const request = require('request');

class SmartThingsClient {
  /**
   * @param {string} params.deviceId
   * @param {string} params.componentId
   * @param {string} params.authToken
   */
  static getDeviceComponentStatus(params) {
    console.log(`https://api.smartthings.com/v1/devices/${params.deviceId}/components/${params.componentId}/status`);
    return new Promise((resolve, reject) => {
      request.get({
        url: `https://api.smartthings.com/v1/devices/${params.deviceId}/components/${params.componentId}/status`,
        headers: {
          'Authorization': 'Bearer ' + params.authToken
        }
      }, (err, resp, body) => {
        if (err) {
          console.log(err);
          reject(err);
        } else if (resp.statusCode !== 200) {
          console.log(resp.statusCode);
          console.log(body);
          reject(body);
        } else {
          resolve({
            deviceId: params.deviceId,
            componentId: params.componentId,
            status: JSON.parse(body)
          });
        }
      });
    });
  }
}

module.exports = SmartThingsClient;