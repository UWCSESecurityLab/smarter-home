const bodyParser = require('body-parser');
const compression = require('compression');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;
const express = require('express');
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
const RoomTransaction = require('./db/room-transaction');
const SmartThingsClient = require('./SmartThingsClient');
const User = require('./db/user');

const PUBLIC_KEY = require('../config/smartapp-config.js').key;

mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/test?replicaSet=rs');
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
  InstallData.findOne({
    'installedApp.installedAppId': req.session.installedAppId
  }, (err, installData) => {
    if (err) {
      res.status(500).json({ message: 'DB_ERROR' });
      return;
    }
    if (!installData) {
      res.status(404).json({ message: 'NOT_FOUND' });
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
    req.session.installedAppId = req.user.installedAppId;
    res.send('/home');
  }
});

app.post('/register', logEndpoint, (req, res) => {
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
  Room.find({ installedAppId: req.session.installedAppId })
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
  console.log(req.body);
  const beaconNamespace = generateEddystoneNamespace(req.body.roomId);
  const room = new Room({
    installedAppId: req.session.installedAppId,
    roomId: req.body.roomId,
    name: req.body.name,
    beaconNamespace: beaconNamespace,
    devices: [],
    default: false
  });

  room.save().then(() => {
    log.log('Successfully created room');
    res.status(200).json(room);
  }).catch((err) => {
    res.status(500).json(err);
  });
});

app.post('/rooms/:roomId/delete',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  RoomTransaction.deleteRoom(req.params.roomId).then(() => {
    log.log('Successfully deleted room ' + req.params.roomId);
    res.status(200).send({});
  }).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.post('/rooms/:roomId/updateName',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.findOneAndUpdate({
      installedAppId: req.session.installedAppId,
      roomId: req.params.roomId
    }, { '$set': { 'name': req.body.name }
  }).then(() => {
    log.log('Successfully updated name');
    res.status(200).json({});
  }).catch((err) => {
    console.log(err);
    res.status(500).json(err);
  });
});

app.post('/rooms/:roomId/reorderDeviceInRoom',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  Room.findOne({
    installedAppId: req.session.installedAppId,
    roomId: req.params.roomId
  }).then((room) => {
    const devicesClone = Array.from(room.devices);
    const [removed] = devicesClone.splice(req.body.srcIdx, 1);
    devicesClone.splice(req.body.destIdx, 0, removed);
    room.devices = devicesClone;
    return room.save();
  }).then((room) => {
    log.log('Successfully reordered devices');
    res.status(200).send(room);
  }).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.post('/rooms/moveDeviceBetweenRooms',
         logEndpoint,
         ensureLogin('/login'),
         getInstallData, (req, res) => {
  RoomTransaction.moveDeviceBetweenRooms(
    req.body.srcRoom,
    req.body.destRoom,
    req.body.srcIdx,
    req.body.destIdx
  ).then(() => {
    log.log('Successfully moved device between rooms');
    res.status(200).send({});
  }).catch((err) => {
   console.log(err);
   res.status(500).send(err);
  });
});

app.get('/refresh', logEndpoint, ensureLogin('/login'),
        (req, res) => {
  if (!req.session.installedAppId) {
    res.status(403).json({
      error: 'USER_NOT_LINKED',
      message: 'User is not associated with an installedApp'
    });
    return;
  }
  SmartThingsClient.renewTokens(req.session.installedAppId).then((tokens) => {
    res.status(200).json(tokens);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.listen(5000);
log.log('Listening on port 5000');