const bodyParser = require('body-parser');
const compression = require('compression');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;
const express = require('express');
const fs = require('fs');
const httpSignature = require('http-signature');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const uuid = require('uuid/v4');

const MongoStore = require('connect-mongo')(session);

const auth = require('./auth');
const InstallData = require('./db/installData');
const lifecycle = require('./lifecycle');
const log = require('./log');
const Room = require('./db/room');
const SmartThingsClient = require('./SmartThingsClient');
const User = require('./db/user');

const PUBLIC_KEY = fs.readFileSync('./config/key.pub', 'utf8');

mongoose.connect('mongodb://localhost/test');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  log.log('Database connection established');
});

let app = express();
app.use(compression());
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


  if (req.body.lifecycle === 'PING') {
    lifecycle.handlePing(req, res);
    return;
  }

  if (!signatureIsVerified(req)) {
    res.status(403);
    res.send('Unauthorized');
    return;
  }

  console.log(JSON.stringify(req.body, null, 2));
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
      lifecycle.handleOAuthCallback(req, res);
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
  if (req.body.oauth == 'true') {
    res.send(`https://api.smartthings.com/oauth/callback?state=${req.body.oauthState}&token=${req.user.id}`);
  } else {
    res.send('/home');
  }
});

app.post('/register', logEndpoint, (req, res) => {
  console.log(req.body);
  console.log(req.headers);
  if (!req.body.username || !req.body.password || !req.body.confirm) {
    res.status(400).json({ message: 'MISSING_FIELD' });
    return;
  }

  if (req.body.password !== req.body.confirm) {
    res.status(400).json({ message: 'PW_MISMATCH' });
    return;
  }

  auth.createUser(req.body.username, req.body.password).then(() => {
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

// Registers the FCM notification token with the current user.
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

// Lists all devices in the home.
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

app.get('/homeConfig',
        logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
  const deviceTypes = ['doorLocks', 'switches', 'contactSensors'];

  let stConfig = req.installData.installedApp.config;
  let ourConfig = {};

  // Remove extraneous information from device entries, just preserve the
  // device ids.
  for (let deviceType of deviceTypes) {
    ourConfig[deviceType] = stConfig[deviceType].map((entry) => {
      return entry.deviceConfig.deviceId;
    });
  }
  res.json(ourConfig);
});

// Get the status of a device
app.get('/devices/:deviceId/status',
        logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
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

app.get('/devices/:deviceId/description',
        logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
  SmartThingsClient.getDeviceDescription({
    deviceId: req.params.deviceId,
    authToken: req.installData.authToken
  }).then((description) => {
    res.json(description);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.post('/devices/:deviceId/commands',
         logEndpoint, ensureLogin('/login'), getInstallData, (req, res) => {
  SmartThingsClient.executeDeviceCommand({
    deviceId: req.params.deviceId,
    command: req.body,
    authToken: req.installData.authToken
  }).then(() => {
    res.status(200).send();
  }).catch((err) => {
    log.error(err);
    res.status(500).send(String(err));
  });
});

// Retrieve all of the rooms
app.get('/rooms',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.find({ installedAppId: req.installData.installedApp.installedAppId })
    .then((rooms) => {
      res.status(200).json(rooms);
    }).catch((err) => {
      log.error(err);
      res.status(500).send(err);
    });
});

// Generates an eddystone-compatible namespace from uuid-v4.
function generateEddystoneNamespace(uuidv4) {
  return uuidv4.slice(0, 8) + uuidv4.slice(24);
}

// Create a new room
app.post('/rooms/create',
         logEndpoint,
         ensureLogin('/login'),
        getInstallData, (req, res) => {
  const roomId = uuid();
  const beaconNamespace = generateEddystoneNamespace(roomId);
  const room = new Room({
    installedAppId: req.installData.installedApp.installedAppId,
    roomId: roomId,
    name: req.body.name,
    beaconNamespace: beaconNamespace,
    devices: []
  });

  room.save().then(() => {
    res.status(200).json({
      roomId: roomId,
      beaconNamespace: beaconNamespace
    });
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.post('/rooms/:roomId/delete',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.findOneAndRemove({
    installedAppId: req.installData.installedApp.installedAppId,
    roomId: req.params.roomId
  }).then((room) => {
    res.status(200).send(room);
  }).catch((err) => {
    console.log(err);
    res.status(500).send();
  })
});

app.post('/rooms/:roomId/updateName',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.findOneAndUpdate({
      installedAppId: req.installData.installedApp.installedAppId,
      roomId: req.params.roomId
    }, { '$set': { 'name': req.body.name }
  }).then(() => {
    res.status(200).send();
  }).catch((err) => {
    console.log(err);
    res.status(500).send();
  });
});

// Add a device to a room
app.post('/rooms/:roomId/addDevice',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  if (!req.installData.installedApp.permissions
        .includes('r:devices:' + req.body.deviceId)) {
    res.status(400).send('Can\'t find device with id ' + req.body.deviceId);
    return;
  }

  Room.findOne({
    installedAppId: req.installData.installedApp.installedAppId,
    roomId: req.params.roomId
  }).then((room) => {
    console.log(room);
    room.devices.push(req.body.deviceId);
    return room.save();
  }).then(() => {
    res.status(200).send();
  }).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

// Remove a device from a room
app.post('/rooms/:roomId/removeDevice',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.findOneAndUpdate({
    installedAppId: req.installData.installedApp.installedAppId,
    roomId: req.params.roomId
  }, {
    '$pull': { 'devices': req.body.deviceId }
  }).exec().then((result) => {
    console.log(result);
    res.status(200).send();
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

app.listen(5000);
log.log('Listening on port 5000');