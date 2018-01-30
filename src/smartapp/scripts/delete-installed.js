// Deletes all installed apps from the mongo database and the smartthings
// server.

const bearer = require('../auth/personal_tokens.json').full_token;
const InstallData = require('../db/installData');
const mongoose = require('mongoose');
const request = require('request');

// The Smart Notifications app.
const APP_ID = '83972ef3-95f9-4f47-9a58-c305a5f3b565';

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  request({
    url: 'https://api.smartthings.com/v1/installedapps',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer
    }
  }, (err, res, body) => {
    if (err) {
      console.error(err);
      return;
    }
    let apps = JSON.parse(body);
    apps.items.forEach((app) => {
      if (app.appId !== APP_ID) {
        return;
      }
      console.log('Attempting to delete ' + app.installedAppId);

      request({
        url: 'https://api.smartthings.com/v1/installedapps/' + app.installedAppId,
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + bearer
        }
      }, (err, res) => {
        if (err) {
          console.error(err);
          return;
        }
        if (res.status !== 200) {
          console.error('Error ' +  res.status);
          return;
        }

        console.log('Deleted from SmartThings.');

        InstallData.findOneAndRemove({
          'installedApp.installedAppId': app.installedAppId
        }, (err) => {
          if (err) {
            console.log(err);
            return;
          }
          console.log('Deleted from Mongo.');
        });
      });
    });
    console.log('Done');
    process.exit();
  });
});

