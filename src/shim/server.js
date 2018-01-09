'use strict';
const authServer = require('./authServer');
const express = require('express');
const bodyParser = require('body-parser');
const opn = require('opn');
const SmartAppClient = require('./SmartAppClient');

const PORT = 4000;

let tokenPromise = authServer.getAccessToken();
console.log('Please log in to SmartThings in your browser.');
opn('http://localhost:5000/login');

tokenPromise.then((accessToken) => {
  let app = express();

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(bodyParser.json());

  let client = new SmartAppClient(accessToken.access_token, PORT);
  client.initialize().catch(console.log);

  app.get('/switch', function(req, res) {
    client.switchStatus().then((response) => {
      console.log(response);
      res.status(200).send(response);
    }).catch((err) => {
      res.status(500).send(err);
    });
  });

  app.post('/switch/:cmd', function(req, res) {
    console.log(req.params);
    if (req.params.cmd === 'on' || req.params.cmd === 'off') {
      client.setSwitch(req.params.cmd).then(function() {
        console.log('It should have worked');
        res.status(200).send();
      }).catch(function() {
        res.status(500).send();
      });
    }
  });

  // SmartThings server calls this endpoint whenever an event is generated.
  app.post('/event', function(req, res) {
    console.log(req.body);
    res.status(200).send('OK');
  });

  app.get('/', function(req, res) {
    client.getAPI('home').then((homeState) => {
      console.log(homeState);
      // res.render('dashboard', {
      //   outletStatus: JSON.stringify(promises[0]),
      //   lockStatus: JSON.stringify(promises[1]),
      //   contactStatus: JSON.stringify(promises[2])
      // });
      res.send(homeState);
    }).catch((err) => {
      res.status(500).send(err);
    });
  });

  app.get('/testGateway', function(req, res) {
    console.log('testGateway');
    res.status(200).send();
  });

  app.listen(PORT);
  console.log('Control server listening on port ' + PORT);
});
