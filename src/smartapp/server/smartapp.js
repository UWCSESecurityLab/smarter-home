const bodyParser = require('body-parser');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;
const express = require('express');
const eddystone = require('eddystone-beacon');
const httpSignature = require('http-signature');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const SmartThingsClient = require('./SmartThingsClient');

const auth = require('./auth');
const InstallData = require('./db/installData');
const lifecycle = require('./lifecycle');
const log = require('./log');
const User = require('./db/user');

const APP_CONFIG = require('../config/config.json');
const PUBLIC_KEY = APP_CONFIG.app.webhookSmartApp.publicKey;

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  log.log('Database connection established');
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
  secret: 'cat keyboard',
  store: new MongoStore({ mongooseConnection: db })
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
      log.error(err);
    }
    done(err, user);
  });
});

// Middleware that logs when a request is received.
function logEndpoint(req, res, next) {
  log.magenta('User Request', req.method + ' ' + req.originalUrl);
  next();
}

// Middleware that attaches a user's SmartThings InstallData to the request.
function getInstallData(req, res, next) {
  // TODO: look up actual user's installData once SmartThings OAuth works.
  InstallData.findOne({}, (err, installData) => {
    if (err) {
      res.status(500).json({ message: 'DB_ERROR' });
      return;
    }
    req.installData = installData;
    next();
  });
}

function signatureIsVerified(req) {
  try {
    let parsed = httpSignature.parseRequest(req);
    if (!httpSignature.verifySignature(parsed, PUBLIC_KEY)) {
      log.error('forbidden - failed verifySignature');
      return false;
    }
  } catch (error) {
    log.error(error);
    return false;
  }
  return true;
}

app.post('/', (req, res) => {
  log.blue('SmartThings Event', req.method + ' ' + req.originalUrl);

  if (!req.body) {
    res.status(400).send('Invalid request');
    return;
  }

  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.lifecycle === 'PING') {
    lifecycle.handlePing(req, res);
    return;
  }

  // if (!signatureIsVerified(req)) {
  //   res.status(403);
  //   res.send('Unauthorized');
  //   return;
  // }

  switch (req.body.lifecycle) {
    case 'CONFIGURATION':
      lifecycle.handleConfiguration(req, res);
      break;
    case 'INSTALL':
      lifecycle.handleInstall(req, res);
      break;
    case 'UPDATE':
      res.status(200).json({ updateData: {} });
      break;
    case 'EVENT':
      lifecycle.handleEvent(req, res);
      res.status(200).json({ eventData: {} });
      break;
    case 'OAUTH_CALLBACK':
      res.status(200).json({ oAuthCallbackData: {} });
      break;
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

app.post('/notificationToken',
         logEndpoint, ensureLogin('/login'), (req, res) => {
  // if (!req.user.notificationTokens.includes(req.query.token)) {
  //   res.status(200).send();
  //   return;
  // }

  req.user.notificationToken = req.query.token;
  req.user.save((err) => {
    if (err) {
      res.status(500).send('Database error: ' + err);
    } else {
      res.status(200).send();
    }
  });
});

app.get('/listDevices',
        logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
  SmartThingsClient.listDevices({
    authToken: req.installData.authToken
  }).then((results) => {
    res.json(results);
  }).catch((err) => {
    log.error(err);
    res.status(500).json({ message: 'SMARTTHINGS_ERROR' });
  });
});

function getDeviceIds(installData, deviceTypes) {
  let installedDevices = installData.installedApp.config;
  let ids = [];
  for (let deviceType of deviceTypes) {
    for (let device of installedDevices[deviceType]) {
      ids.push(device.deviceConfig.deviceId);
    }
  }
  return ids;
}

app.get('/deviceDescriptions',
        logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
  const deviceTypes = ['doorLock', 'switches'];

  // Fetch device descriptions
  let deviceIds = getDeviceIds(req.installData, deviceTypes);
  let descriptionRequests = deviceIds.map((deviceId) => {
    return SmartThingsClient.getDeviceDescription({
      deviceId: deviceId,
      authToken: req.installData.authToken
    });
  });

  Promise.all(descriptionRequests).then((descriptions) => {
    // Store device descriptions in same structure as installData
    let dashboard = {};
    let installedDevices = req.installData.installedApp.config;
    for (let deviceType of deviceTypes) {
      dashboard[deviceType] = installedDevices[deviceType].map((device) => {
        return descriptions.find((description) => {
          return description.deviceId === device.deviceConfig.deviceId;
        });
      });
    }
    res.json(dashboard);
  }).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.get('/devices/:deviceId/status',
        logEndpoint,ensureLogin('/login'), getInstallData, (req, res) => {
  SmartThingsClient.getDeviceStatus({
    deviceId: req.params.deviceId,
    authToken: req.installData.authToken
  }).then((status) => {
    res.json(status);
  }).catch((err) => {
    log.error(err);
    res.status(500).send(err);
  });
});

app.get('/refresh', logEndpoint, ensureLogin('/login'),
        (req, res) => {
  SmartThingsClient.renewTokens().then((tokens) => {
    res.status(200).json(tokens);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.get('/beacon', logEndpoint, (req, res) => {
  res.render('beacon');
});

app.get('/beacon/on', logEndpoint, (req, res) => {
  try {
    eddystone.advertiseUid('00010203040506070809','aabbccddeeff');
  } catch (e) {
    log.error(e);
    res.status(400).send(e);
  }
  res.status(200).send();

});

app.get('/beacon/off', logEndpoint, (req, res) => {
  try {
    eddystone.stop();
  } catch (e) {
    log.error(e);
    res.status(400).send(e);
  }
  res.status(200).send();
});


app.listen(5000);
log.log('Listening on port 5000');