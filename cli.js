#!/usr/bin/env node
'use strict';
const authServer = require('./authServer');
const co = require('co');
const opn = require('opn');
const prompt = require('co-prompt');
const SmartAppClient = require('./SmartAppClient');

// Start the server, wait for access token in Promise.
let tokenPromise = authServer.getAccessToken();

// Prompt user to log in
console.log('Please log in to SmartThings in your browser.');
opn('http://localhost:5000/login');

// Once token is retrieved, launch the prompt
tokenPromise.then(function(accessToken) {
  console.log('Access token retrieved:');
  console.log(accessToken);

  let client = new SmartAppClient(accessToken.access_token);

  co(function* () {
    while(true) {
      var text = yield prompt('$ ');
      if (text.trim() === 'list') {
        let endpoints = yield client.listEndpoints();
        console.log(endpoints);
      } else {
        console.log('\'' + text + '\' is not a supported command.');
      }
    }
  });
});
