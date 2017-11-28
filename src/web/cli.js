#!/usr/bin/env node
'use strict';
const appdirs = require('appdirs');
const authServer = require('./authServer');
const co = require('co');
const fs = require('fs');
const opn = require('opn');
const prompt = require('co-prompt');
const SmartAppClient = require('./SmartAppClient');

const tokenDir = appdirs.userDataDir() + '/security-manager';
const tokenFile = tokenDir + '/token.json';

co(function* () {
  try {
    // Get the access token for the SmartThings API
    let tokenPromise;
    if (hasCachedAccessToken()) {
      // Grab the cached copy from disk
      tokenPromise = Promise.resolve(readAccessToken());
    } else {
      // Get the access token through OAuth in the browser
      tokenPromise = authServer.getAccessToken();
      console.log('Please log in to SmartThings in your browser.');
      opn('http://localhost:5000/login');
    }

    let accessToken = yield tokenPromise;
    console.log('Access token retrieved:');
    console.log(accessToken);
    if (!hasCachedAccessToken()) {
      writeAccessToken(accessToken);
      console.log('Wrote access token to file (' + tokenFile + ')');
    }

    let client = new SmartAppClient(accessToken.access_token);

    // This is the main command prompt loop
    while (true) {
      var rawInput = yield prompt('$ ');
      var command = rawInput.trim().toLowerCase().split(' ');
      switch (command[0]) {
        case 'list': {
          let endpoints = yield client.listEndpoints();
          console.log(endpoints);
          break;
        }
        case 'door': {
          let door = yield client.doorStatus();
          console.log(door);
          break;
        }
        case 'temp': {
          let temp = yield client.temperatureStatus();
          console.log(temp);
          break;
        }
        case 'switch': {
          let status = command[1];
          if (status) {
            let res = yield client.setSwitch(status);
            console.log(res);
          } else {
            let status = yield client.switchStatus();
            console.log(status);
          }
          break;
        }
        case 'delete': {
          if (command[1] === 'token') {
            deleteAccessToken();
            console.log('Access token file deleted. Please restart the app.');
            process.exit();
          }
          break;
        }
        default: {
          console.log('"' + command.join(' ') + '" is not a supported command.');
        }
      }
    }
  } catch(e) {
    console.error(e.stack);
    process.exit();
  }
});

function hasCachedAccessToken() {
  // TODO: handle expiry
  return fs.existsSync(tokenFile);
}

function readAccessToken() {
  if (!fs.existsSync(tokenFile)) {
    throw 'Cannot read access token - file does not exist.';
  }
  var filedata = fs.readFileSync(tokenFile);
  return JSON.parse(filedata);
}

function writeAccessToken(token) {
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir);
  }
  fs.writeFileSync(tokenFile, JSON.stringify(token));
}

function deleteAccessToken() {
  if (fs.existsSync(tokenFile)) {
    fs.unlinkSync(tokenFile);
  }
}
