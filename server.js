'use strict';
const authServer = require('./authServer');
const express = require('express');
const bodyParser = require('body-parser');
const opn = require('opn');
const queryString = require('query-string');
const request = require('request');
const SmartAppClient = require('./SmartAppClient');

let tokenPromise = authServer.getAccessToken();
console.log('Please log in to SmartThings in your browser.');
opn('http://localhost:5000/login');

tokenPromise.then(function(accessToken) {
  let app = express();
  app.use(bodyParser.json());

  let client = new SmartAppClient(accessToken.access_token);

  app.get('/switch/:cmd', function(req, res) {
    console.log(req.params);
    if (req.params.cmd == 'on' || req.params.cmd == 'off') {
      client.setSwitch(req.params.cmd).then(function() {
        console.log('It should have worked');
        res.status(200).send();
      }).catch(function() {
        res.status(500).send();
      });
    }
  });

  app.listen(4000);
  console.log('Control server listening on port 4000');
});
