const auth = require('./auth');
const bodyParser = require('body-parser');
const configuration = require('./configuration');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;
const express = require('express');
const eddystone = require('eddystone-beacon');
const fcmClient = require('./fcmClient');
const httpSignature = require('http-signature');
const InstallData = require('./db/installData');
const log = require('./log');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const request = require('request');
const session = require('express-session');
const SmartThingsClient = require('./SmartThingsClient');
const User = require('./db/user');

const APP_CONFIG = require('../config/config.json');
const PUBLIC_KEY = APP_CONFIG.app.webhookSmartApp.publicKey;

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connection established');
});

let app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/../web/views');
app.use(express.static('dist'));
app.use(express.static('web/sw'));
app.use('/css', express.static('web/css'));
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
  log.magenta('User Request', req.method + ' ' + req.originalUrl);
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

  log.log('subscription data:');
  console.log(subscriptions);

  // return SmartThingsClient.subscribe({
  //   installedAppId: installData.installedApp.installedAppId,
  //   subscriptionBody: subscriptions,
  //   authToken: installData.authToken
  // });
  let requests = [];
  subscriptions.forEach((subscription) => {
   requests.push(SmartThingsClient.subscribe({
      installedAppId: installData.installedApp.installedAppId,
      subscriptionBody: subscription,
      authToken: installData.authToken
    }));
  });

  return Promise.all(requests);
}

// Executed when a SmartApp is installed onto a new hub.
function handleInstall(req, res) {
  let data = new InstallData(req.body.installData);
  data.save()
    .then(subscribeToAuthorizedDevices)
    // .then(() => {
    //   log.log('Done subscribing, creating schedule');
    //   return SmartThingsClient.createTokenUpdateSchedule({
    //     installedAppId: data.installedApp.installedAppId,
    //     authToken: data.authToken
    //   });
    // })
    .then(() => {
      log.log('Install successful');
      res.json({
        installData: {}
      });
      res.status(200).send();
    })
    .catch((err) => {
      log.error('Install error:');
      console.log(JSON.stringify(err, null, 2));
      res.status(500).send('Problem installing app.');
    });
}

function handleEvent(req, res) {
  // if (req.body.eventData.events.find((event) => {
  //   if (!event || !event.timerEvent || !event.timerEvent.name ) {
  //     return false;
  //   }
  //   return event.timerEvent.name === 'update-tokens-schedule'
  // })) {
  //   handleUpdateTokensEvent(req, res);
  // }

  let deviceEvent = req.body.eventData.events.find((event) => {
    return event.eventType === 'DEVICE_EVENT';
  });
  if (!deviceEvent) {
    return;
  }

  if (deviceEvent.deviceEvent.capability === 'switch') {
    User.findOne({}, (err, user) => {
      if (err) {
        log.error(err);
        return;
      }

      if (!user.notificationToken) {
        log.error('No notification token found');
        return;
      }

      fcmClient.sendNotification({
        device: deviceEvent.deviceEvent.deviceId,
        capability: deviceEvent.deviceEvent.capability,
        value: deviceEvent.deviceEvent.value
      }, user.notificationToken);
    });
  }
}

function handleUpdateTokens(req, res) {
  SmartThingsClient.renewTokens(req.body.eventData.installedApp.installedAppId);
}

app.post('/', (req, res) => {
  log.blue('SmartThings Event', req.method + ' ' + req.originalUrl);

  if (!req.body) {
    res.status(400).send('Invalid request');
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
      res.status(200).json({ updateData: {} });
      break;
    case 'EVENT':
      handleEvent(req, res);
      res.status(200).json({ eventData: {} });
      break;
    case 'OAUTH_CALLBACK':
      res.status(200).json({ oAuthCallbackData: {} });
    case 'UNINSTALL':
      res.status(200).json({ uninstallData: {} });
      break;
    default:
      res.status(400).send();
  }
});

app.get('/login', logEndpoint, (req, res) => {
  res.render('login');
});

app.post('/login', logEndpoint, passport.authenticate('local'), (req, res) => {
  if (req.query.oauth == 'true') {
    res.send('https://api.smartthings.com/oauth/callback?token=' + req.user.id);
  } else {
    res.send('/home');
  }
});

app.post('/register', logEndpoint, (req, res) => {
  if (!req.query.username || !req.query.password || !req.query.confirm) {
    res.status(400).json({ message: 'MISSING_FIELD' });
    return;
  }

  if (req.query.password !== req.query.confirm) {
    res.status(400).json({ message: 'PW_MISMATCH' });
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
  res.render('home');
});

app.post('/notificationToken', logEndpoint, ensureLogin('/login'), (req, res) => {
  // if (!req.user.notificationTokens.includes(req.query.token)) {
  //   res.status(200).send();
  //   return;
  // }

  req.user.notificationToken = req.query.token;
  req.user.save((err, user) => {
    if (err) {
      res.status(500).send('Database error: ' + err);
    } else {
      res.status(200).send();
    }
  });
});

app.get('/listDevices', logEndpoint, ensureLogin('/login'), (req, res) => {
  InstallData.findOne({}, (err, installData) => {
    if (err) {
      res.status(500).json({ message: 'DB_ERROR' });
      return;
    }

    SmartThingsClient.listDevices({
      authToken: installData.authToken
    }).then((results) => {
      res.json(results);
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ message: 'SMARTTHINGS_ERROR' });
    });
  });
});


app.get('/beacon', logEndpoint, (req, res) => {
  res.render('beacon');
});

app.get('/beacon/on', logEndpoint, (req, res) => {
  try {
    eddystone.advertiseUid('00010203040506070809','aabbccddeeff');
  } catch (e) {
    res.status(400).send(e);
  }
  res.status(200).send();

});

app.get('/beacon/off', logEndpoint, (req, res) => {
  try {
    eddystone.stop();
  } catch (e) {
    res.status(400).send(e);
  }
  res.status(200).send();
});


app.listen(5000);
console.log('Listening on port 5000');