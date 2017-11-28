'use strict';
const enableDestroy = require('server-destroy');
const express = require('express');
const bodyParser = require('body-parser');
const queryString = require('query-string');
const request = require('request');

const client_id = 'e466bc7d-acbd-4489-8970-72d5987e1f30';
const client_secret = '7b549488-c4a0-4012-8bd8-963d4ea055f3';

exports.getAccessToken = function() {
  return new Promise((resolve, reject) => {
    var app = express();
    app.use(bodyParser.json());
    app.use('/static', express.static(__dirname + '/node_modules/bootstrap/dist'));

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
          reject(err);
        }
        let accessToken = JSON.parse(body);
        res.send(successpage);
        server.destroy();
        resolve(accessToken);
      });
    });

    function logEndpoint(req, res, next) {
      console.log(req.method + ' ' + req.url);
      next();
    }

    let server = app.listen(5000);
    enableDestroy(server);
    console.log('Auth Server listening on port 5000');
  });
};


const successpage =
  `<html>
  <head>
    <style type='text/css'>
      body {
        font-family: Arial, Helvetica, sans-serif;
        margin: 24px;
      }
      h2 {
        font-size: 36;
      }
      p {
        font-size: 18;
      }
    </style>
  </head>
  <body>
    <h2>Authorization Successful!</h2>
    <p>You may now close this window.</p>
  </body>
  </html>`;
