'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const queryString = require('query-string');
const request = require('request');
const SmartAppClient = require('./SmartAppClient');

const client_id = 'e466bc7d-acbd-4489-8970-72d5987e1f30';
const client_secret = '7b549488-c4a0-4012-8bd8-963d4ea055f3';

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/node_modules/bootstrap/dist'));

app.get('/', logEndpoint, function(req, res) {
  res.render('index');
});

app.get('/login', logEndpoint, function(req, res) {
  let qs = {
    'response_type': 'code',
    'client_id': client_id,
    'scope': 'app',
    'redirect_uri': 'http://localhost:5000/return/authorize'
  };
  res.redirect('https://graph.api.smartthings.com/oauth/authorize?' + queryString.stringify(qs));
});

app.get('/return/authorize', logEndpoint, function(req, res) {
  request({
    method: 'POST',
    url: 'https://graph.api.smartthings.com/oauth/token',
    headers: {
      'Host': 'graph.api.smartthings.com',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: queryString.stringify({
      'grant_type': 'authorization_code',
      'code': req.query.code,
      'client_id': client_id,
      'client_secret': client_secret,
      'redirect_uri': 'http://localhost:5000/return/authorize'
    })
  }, function(err, resp, body) {
    if (err) {
      console.log(err);
    }

    let accessToken = JSON.parse(body);
    console.log(accessToken);
    let client = new SmartAppClient(accessToken.access_token);

    client.listEndpoints().then(function(endpoints) {
      console.log(endpoints);
      res.send(endpoints);
    }).catch(function(err) {
      console.error(JSON.parse(err));
      res.send(JSON.parse(err));
    });

    // res.redirect('/home');
  });
});

app.get('/home', logEndpoint, function(req, res) {
  res.send('Logged in');
});


function logEndpoint(req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
}

app.listen(5000);
console.log('Listening on port 5000');
