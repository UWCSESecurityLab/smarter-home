// Deletes all installed apps from the mongo database and the smartthings
// server.

const bearer = require('../config/personal_tokens.json').full_token;
const InstallData = require('../db/installData');
const mongoose = require('mongoose');
const request = require('request');

// The Smart Notifications app.
const APP_ID = '83972ef3-95f9-4f47-9a58-c305a5f3b565';

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', function() {
  request({
    url: 'https://api.smartthings.com/v1/installedapps',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer
    }
  }, (err, res, body) => {
    if (err) {
      console.log(err);
      return;
    }
    let apps = JSON.parse(body);
    Promise.all(apps.items.map((app) => {
      return new Promise((resolve, reject) => {
        if (app.appId !== APP_ID) {
          resolve();
          return;
        }

        request({
          url: 'https://api.smartthings.com/v1/installedapps/' + app.installedAppId,
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + bearer
          }
        }, (err, res) => {
          if (err) {
            console.log(err);
            reject();
            return;
          }
          if (res.statusCode !== 200) {
            console.log('Error ' +  res.status);
            reject();
            return;
          }

          console.log(app.installedAppId + ' was deleted from SmartThings.');

          InstallData.findOneAndRemove({
            'installedApp.installedAppId': app.installedAppId
          }, (err) => {
            if (err) {
              console.log(err);
              reject();
              return;
            }
            console.log(app.installedAppId + ' was deleted from Mongo.');
            resolve();
          });
        });
      });
    })).then(() => {
      console.log('Done.');
      process.exit();
    }).catch(() => {
      console.log('Done, some errors occurred.');
      process.exit();
    });
  });
});

