const auth = require('./auth');
const bodyParser = require('body-parser');
const configuration = require('./configuration');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;
const express = require('express');
const httpSignature = require('http-signature');
const InstallData = require('./db/installData');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const request = require('request');
const session = require('express-session');
const User = require('./db/user');

const APP_CONFIG = require('./config/config.json');
const PUBLIC_KEY = APP_CONFIG.app.webhookSmartApp.publicKey;

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connection established');
});

let app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/web/views');
app.use(express.static('dist'));
app.use(bodyParser.json());
app.use(session({
  resave: true,
  saveUninitialized: false,
  secret: 'cat keyboard'
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username, password, done) {
  auth.verifyUser(username, password).then((user) => {
    done(null, user);
  }).catch((err) => {
    if (err.message) {
      console.log(err.message);
      done(null, false, err);
    } else {
      done(err);
    }
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({id: id}, function(err, user) {
    if (err) {
      console.log(err);
    }
    done(err, user);
  });
});

function logEndpoint(req, res, next) {
  console.log(req.method + ' ' + req.originalUrl);
  next();
}

function handlePing(req, res) {
  res.status(200);
  res.json({
    pingData: {
      challenge: req.body.pingData.challenge
    }
  });
  res.send();
}

function signatureIsVerified(req) {
  try {
    let parsed = httpSignature.parseRequest(req);
    if (!httpSignature.verifySignature(parsed, PUBLIC_KEY)) {
      console.log('forbidden - failed verifySignature');
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

function handleConfiguration(req, res) {
  if (req.body.configurationData.phase == 'INITIALIZE') {
    res.json(configuration.init);
  } else if (req.body.configurationData.phase == 'PAGE') {
    res.json(configuration.pages[req.body.configurationData.pageId]);
  }
}

// Given an InstallData object, subscribe to all of the attributes of all of the
// authorized devices.
function subscribeToAuthorizedDevices(installData) {
  console.log(installData);
  // return new Promise((resolve, reject) => {
  let devices = [];
  // Flatten devices into a list
  for (let category in installData.installedApp.config) {
    for (let item of installData.installedApp.config[category]) {
      if (item.valueType === 'DEVICE') {
        devices.push(item);
      }
    }
  }
  // Form request body
  let subscriptions = devices.map((d) => {
    return {
      sourceType: 'DEVICE',
      device: {
        deviceId: d.deviceConfig.deviceId,
        stateChangeOnly: true
      }
    };
  });

  return Promise.all(subscriptions.map((subscription) => {
    return new Promise((resolve, reject) => {
      request({
        url: `https://api.smartthings.com/v1/installedapps/${installData.installedApp.installedAppId}/subscriptions`,
        method: 'POST',
        json: true,
        headers: {
          'Authorization': `Bearer ${installData.authToken}`
        },
        body: subscription
      }, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (res.statusCode !== 200) {
          reject(body);
          return;
        }
        resolve(body);
      });
    });
  }));
}

// Executed when a SmartApp is installed onto a new hub.
function handleInstall(req, res) {
  let data = new InstallData(req.body.installData);
  data.save()
    .then(subscribeToAuthorizedDevices)
    .then(() => {
      res.json({
        installData: {}
      });
      res.status(200);
      res.send();
    })
    .catch((err) => {
      console.log(JSON.stringify(err, null, 2));
      res.status(500);
      res.send('Problem installing app.');
    });
}

app.post('/', logEndpoint, (req, res) => {
  if (!req.body) {
    res.status(400);
    res.send('Invalid request');
    return;
  }

  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.lifecycle === 'PING') {
    handlePing(req, res);
    return;
  }

  // if (!signatureIsVerified(req)) {
  //   res.status(403);
  //   res.send('Unauthorized');
  //   return;
  // }

  switch (req.body.lifecycle) {
    case 'CONFIGURATION':
      handleConfiguration(req, res);
      break;
    case 'INSTALL':
      handleInstall(req, res);
      break;
    case 'UPDATE':
      res.status(200);
      res.json({
        updateData: {}
      });
      res.send();
      break;
    case 'EVENT':
      res.status(200);
      res.json({
        eventData: {}
      });
      res.send();
      break;
    case 'OAUTH_CALLBACK':
      res.status(200);
      res.json({
        oAuthCallbackData: {}
      });
      res.send();
      break;
    case 'UNINSTALL':
      res.status(200);
      res.json({
        uninstallData: {}
      });
      res.send();
      break;
    default:
      res.status(400);
      res.send();
  }
});

app.get('/login', logEndpoint, (req, res) => {
  res.render('login');
});

app.post('/login', logEndpoint, passport.authenticate('local'), (req, res) => {
  if (req.query.oauth == 'true') {
    auth.createToken.then((token) => {
      res.status(200);
      res.json({ token: token });
    }).catch(() => {
      res.status(500);
      res.json({ message: 'OAUTH_ERROR' });
    });
  } else {
    res.status(200);
    res.send('Authenticated');
  }
});

app.post('/register', logEndpoint, (req, res) => {
  if (!req.query.username || !req.query.password || !req.query.confirm) {
    res.status(400);
    res.json({ message: 'MISSING_FIELD' });
    res.send();
    return;
  }

  if (req.query.password !== req.query.confirm) {
    res.status(400);
    res.json({ message: 'PW_MISMATCH' });
    res.send();
    return;
  }

  auth.createUser(req.query.username, req.query.password).then(() => {
    res.status(200);
    res.send();
  }).catch((err) => {
    if (err.message == 'USERNAME_TAKEN') {
      res.status(400);
    } else {
      res.status(500);
    }
    res.json(err);
  });
});

app.get('/home', logEndpoint, ensureLogin('/login'), (req, res) => {
  res.status(200);
  res.send('/home (authenticated)');
});


app.listen(5000);
console.log('Listening on port 5000');