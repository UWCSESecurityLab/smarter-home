// Deletes all installed apps from the mongo database and the smartthings
// server.

const bearer = require('../config/personal_tokens.json').full_token;
const config = require('../config/smartapp-config.js').devApp;
const InstallData = require('../server/db/installData');
const Room = require('../server/db/room');
const log = require('../server/log');
const mongoose = require('mongoose');
const request = require('request');

// The Smart Notifications app.
const APP_ID = config.app.appId;

const SECLAB_LOC = '1f7b9dce-985b-47a7-9814-ed10f3b71f2f';
const SHRI_LOC = 'b709e26c-a379-4bc4-8000-53b014a7e7fe';

mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/test?replicaSet=my-mongo-set');
let db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', () => {
  deleteApps(SECLAB_LOC);
  // deleteApps(SHRI_LOC);
});


function deleteApps(locationId) {
  log.blue('SmartThings Request', `GET https://api.smartthings.com/v1/installedapps?locationId=${locationId}`);
  request({
    url: `https://api.smartthings.com/v1/installedapps?locationId=${locationId}`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer
    }
  }, (err, res, body) => {
    if (err) {
      log.error(err);
      return;
    }
    log.log(body);
    let apps = JSON.parse(body);
    Promise.all(apps.items.map((app) => {
      return new Promise((resolve, reject) => {
        if (app.appId !== APP_ID) {
          resolve();
          return;
        }
        log.blue('SmartThings Request', 'DELETE https://api.smartthings.com/v1/installedapps/' + app.installedAppId);
        request({
          url: 'https://api.smartthings.com/v1/installedapps/' + app.installedAppId,
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + bearer
          }
        }, (err, res, body) => {
          if (err) {
            log.error(err);
            reject();
            return;
          }
          if (res.statusCode !== 200) {
            log.error(res.status);
            reject();
            return;
          }

          log.log(app.installedAppId + ' was deleted from SmartThings.');

          InstallData.findOneAndRemove({
            'installedApp.installedAppId': app.installedAppId
          }, (err) => {
            if (err) {
              log.error(err);
              reject();
              return;
            }
            log.log(app.installedAppId + ' was deleted from Mongo.');

            Room.deleteMany({ installedAppId: app.installedAppId }, function(err) {
              if (err) {
                log.error(err);
                reject();
                return;
              }
              log.log('Deleted rooms associated with ' + app.installedAppId);
              resolve();
            });
          });
        });
      });
    })).then(() => {
      log.log('Done.');
      process.exit();
    }).catch(() => {
      log.error('Done, some errors occurred.');
      process.exit();
    });
  });
}

