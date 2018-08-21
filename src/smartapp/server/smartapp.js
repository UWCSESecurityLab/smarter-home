const bodyParser = require('body-parser');
const compression = require('compression');
const cookie = require('cookie');
const cookieSignature = require('cookie-signature');
const crypto = require('crypto');
const express = require('express');
const EC = require('elliptic').ec;
const httpSignature = require('http-signature');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const uuid = require('uuid/v4');

const MongoStore = require('connect-mongo')(session);

const auth = require('./auth');
const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const lifecycle = require('./lifecycle');
const log = require('./log');
const Beacon = require('./db/beacon');
const Command = require('./db/command');
const Room = require('./db/room');
const RoomTransaction = require('./db/room-transaction');
const SmartThingsClient = require('./SmartThingsClient');
const User = require('./db/user');

const PUBLIC_KEY = require('../config/smartapp-config.js').key;

let ec = new EC('p384');

mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/test?replicaSet=rs');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  log.log('Database connection established');
});

let app = express();
app.use(compression());
app.set('views', __dirname + '/../web/views');
app.use(express.static('dist'));
app.use(express.static('web/sw'));
app.use('/css', express.static('web/css'));
app.use(bodyParser.json());

// Middleware that logs when a request is received.
app.use(function(req, res, next) {
  log.magenta('Incoming Request', req.method + ' ' + req.originalUrl);
  next();
});

// Middleware to convert client-side sessions into cookies so that passport
// can authenticate Cordova clients.
app.use(function(req, res, next) {
  let sessionId = req.get('Client-Session');
  // if there was a session id passed add it to the cookies
  if (sessionId) {
    // log.log(req.originalUrl + ': Parsed client-side session ' + sessionId);
    // sign the cookie so Express Session unsigns it correctly
    let signedCookie = 's:' + cookieSignature.sign(sessionId, 'cat keyboard');
    req.headers.cookie = cookie.serialize('connect.sid', signedCookie);
  }
  next();
});

app.use(session({
  resave: true,
  saveUninitialized: false,
  secret: 'cat keyboard',
  store: new MongoStore({ mongooseConnection: db }),
  genid: function(req) {
    // If request contained a client-side session, use it instead of making
    // one in the server.
    let sessionId = req.get('Client-Session');
    if (sessionId) {
      return req.get('Client-Session');
    }
    // Otherwise generate a session server-side.
    return uuid();
  }
}));

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
      res.status(404).json({ message: 'APP_NOT_FOUND' });
      return;
    }

    req.installData = installData;
    next();
  });
}

// Middleware that checks if request is authenticated, attaches user to req.
function checkAuth(req, res, next) {
  User.findOne({ id: req.session.user }, function(err, user) {
    if (err) {
      res.status(500).json({ message: 'DB_ERROR'});
      return;
    }
    if (!user) {
      log.error('Unauthorized user');
      console.log(req.session);
      res.status(401).json({ message: 'NOT_LOGGED_IN'});
      return;
    }
    req.user = user;

    if (!req.session.installedAppId && user.installedAppId) {
      req.session.installedAppId = user.installedAppId;
    } else if (!req.session.installedAppId && !user.installedAppId) {
      res.status(403).json({
        error: 'USER_NOT_LINKED',
        message: 'User is not associated with an installedApp'
      });
      return;
    }

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
    lifecycle.handleUpdate(req, res);
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

app.post('/login', (req, res) => {
  auth.verifyUser(req.body.username, req.body.password).then((user) => {
    if (req.body.oauth == 'true') {
      res.status(200).send(`https://api.smartthings.com/oauth/callback?state=${req.body.oauthState}&token=${user.id}`);
      return;
    }

    req.session.regenerate((err) => {
      if (err) {
        console.log(err);
        res.status(500).json(err);
        return;
      }
      req.session.user = user.id;
      req.session.installedAppId = user.installedAppId;
      req.session.save((err) => {
        if (err) {
          res.status(500).json(err);
          return;
        }
        console.log('Saved session');
        console.log(req.session);
        res.status(200).send();
      });
    });
  }).catch((err) => {
    if (err.message === 'BAD_USERNAME' || err.message === 'BAD_PASSWORD') {
      res.status(401).send({ error: 'BAD_USER_PW' });
    } else {
      console.log(err);
      res.status(500).send({ error: 'DB_ERROR'});
    }
  });
});

app.post('/register', (req, res) => {
  if (!req.body.username || !req.body.displayName || !req.body.password || !req.body.confirm) {
    res.status(400).json({ message: 'MISSING_FIELD' });
    return;
  }

  if (req.body.password !== req.body.confirm) {
    res.status(400).json({ message: 'PW_MISMATCH' });
    return;
  }

  auth.createUser(req.body.username, req.body.displayName, req.body.password).then(() => {
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

// Step 1 in challenge-response login protocol.
// Client sends public key (so server can verify user exists)
// Server responds with string challenge
app.post('/authChallenge', (req, res) => {
  // Find matching public key in User database.
  User.findOne({ publicKeys: { $elemMatch: {
    x: req.body.publicKey.x, y: req.body.publicKey.y
  }}}).then((user) => {
    if (!user) {
      res.status(401).send({ error: 'UNRECOGNIZED_KEY' });
      return;
    }
    // Generate challenge, save user and challenge in session
    const challenge = uuid();
    req.session.challenge = challenge;
    req.session.challengeUser = user.id;
    log.log('Challenge: ' + challenge);
    res.status(200).json({ challenge: challenge });
  }).catch((err) => {
    res.status(500).json(err);
  });
});

// Step 2 in challenge-response login protocol.
// Client sends ECDSA signed challenge (JSON object containing r, s in arrays)
// Server verifies that it was signed by the holder of the private key, who
// sent their key in the challenge.
app.post('/authResponse', (req, res) => {
  if (!req.session.challenge || !req.session.challengeUser) {
    res.status(401).send({ error: 'MISSING_CHALLENGE' });
    return;
  }

  User.findOne({ id: req.session.challengeUser }).then((challengeUser) => {
    log.log('Verifying signature from ' + challengeUser.id + ' for challenge ' + req.session.challenge);

    // Turn JSON arrays into ArrayBuffer
    let r = Buffer.from(new Uint8Array(req.body.signature.r).buffer);
    let s = Buffer.from(new Uint8Array(req.body.signature.s).buffer);
    let signature = { r: r, s: s };

    let challengeBuf = Buffer.from(req.session.challenge, 'utf-8');

    // Compute hash of challenge
    const hash = crypto.createHash('sha512');
    hash.update(challengeBuf);
    const msgHash = hash.digest();
    console.log('SHA-512 hash of challenge:');
    console.log(msgHash);

    // Try each of user's public keys
    for (let jwk of challengeUser.publicKeys) {
      let hex_x = Buffer.from(jwk.x, 'base64').toString('hex');
      let hex_y = Buffer.from(jwk.y, 'base64').toString('hex');
      let publicKey = ec.keyFromPublic({x: hex_x, y: hex_y }, 'hex');
      if ( publicKey.verify(msgHash, signature)) {
        log.log('Signature verified');
        // Success
        req.session.regenerate((err) => {
          if (err) {
            console.log(err);
            res.status(500).json(err);
            return;
          }
          req.session.user = challengeUser.id;
          req.session.installedAppId = challengeUser.installedAppId;
          req.session.save((err) => {
            if (err) {
              res.status(500).json(err);
              return;
            }
            log.log('Challenge-Response Login Success');
            res.status(200).json({});
          });
        });
        return;
      }
    }
    // Fail
    log.error('Failed to verify signature');
    res.status(401).json({ error: 'Failed challenge-response' });
  }).catch((err) => {
    log.error(err);
    res.status(500).json({ error: 'DB_ERROR' });
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      log.error(err);
      res.status(500).send(err);
    }
    res.status(200).json({message: 'ok'});
  })
});

// Registers the FCM notification token with the current user.
app.post('/notificationToken', checkAuth, async (req, res) => {
  log.log('Received token ' + req.body.token);
  fcmClient.updateActivityNotifications({
    flags: req.body.flags,
    user: req.user,
    token: req.body.token
  }).then(() => {
    res.status(200).json({});
  }).catch((err) => {
    if (err.error === 'Missing ActivityNotifications flag') {
      log.error(err.error);
      res.status(400).json(err);
    } else {
      log.error(JSON.stringify(err));
      res.status(500).json(err);
    }
  });
});

// Lists all devices in the home.
app.get('/listDevices', checkAuth, getInstallData, (req, res) => {
  SmartThingsClient.listDevices({
    authToken: req.installData.authToken
  }).then((results) => {
    res.json(results);
  }).catch((err) => {
    log.error(err);
    res.status(500).json({ message: 'SMARTTHINGS_ERROR' });
  });
});

app.get('/homeConfig', checkAuth, getInstallData, (req, res) => {
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
app.get('/devices/:deviceId/status', checkAuth, getInstallData, (req, res) => {
  Beacon.findOne({ name: req.params.deviceId }).then((beacon) => {
    if (!beacon) {
      SmartThingsClient.getDeviceStatus({
        deviceId: req.params.deviceId,
        authToken: req.installData.authToken
      }).then((status) => {
        res.json(status);
      }).catch((err) => {
        log.error(err);
        res.status(500).json(err);
      });
    } else {
      res.status(200).json({
        deviceId: beacon.name,
        components: {
          main: {
            beacon: {}
          }
        }
      });
    }
  }).catch((err) => {
    log.error(err);
    res.status(500).json(err);
  });
});

app.get('/devices/:deviceId/description', checkAuth, getInstallData,
    (req, res) => {
  Beacon.findOne({ name: req.params.deviceId }).then((beacon) => {
    if (!beacon) {
      SmartThingsClient.getDeviceDescription({
        deviceId: req.params.deviceId,
        authToken: req.installData.authToken
      }).then((description) => {
        res.json(description);
      }).catch((err) => {
        res.status(500).send(err);
      });
    } else {
      res.status(200).json({
        deviceId: beacon.name,
        label: beacon.name,
        deviceTypeName: 'beacon',
        name: beacon.name,
        uuid: beacon.uuid,
        major: beacon.major,
        minor: beacon.minor,
        instanceId: beacon.instanceId,
        namespace: beacon.namespace,
        url: beacon.url
      });
    }
  }).catch((err) => {
    res.status(500).json(err);
  });
});

app.post('/devices/:deviceId/commands', checkAuth, getInstallData,
    (req, res) => {
  let command = new Command({
    // Round milliseconds to zero because SmartThings doesn't store milliseconds
    // in eventDate, so commands happening in the same second as the event
    // would appear to happen after the event.
    date: new Date().setMilliseconds(0),
    installedAppId: req.installData.installedApp.installedAppId,
    userId: req.user.id,
    deviceId: req.params.deviceId,
    component: req.body.component,
    capability: req.body.capability,
    command: req.body.command
  });

  SmartThingsClient.executeDeviceCommand({
    deviceId: req.params.deviceId,
    command: req.body,
    authToken: req.installData.authToken
  }).then(() => command.save())
    .then(() => {
      res.status(200).send();
  }).catch((err) => {
    log.error(err);
    res.status(500).json(err);
  });
});

app.get('/beacon/configure', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/beacons.html'));
});

app.get('/beacon/list', (req, res) => {
  Beacon.find().then((beacons) => {
    res.status(200).json(beacons);
  }).catch((err) => {
    res.status(500).json(err);
  });
});

app.post('/beacon/new', (req, res) => {
  let beacon = new Beacon({
    namespace: req.body.namespace,
    id: req.body.id,
    name: req.body.name
  });
  beacon.save().then(() => {
    res.status(200).send();
  }).catch((err) => {
    res.status(500).json(err);
  });
});

app.post('/beacon/add', checkAuth, getInstallData, (req, res) => {
  Beacon.findOne({ name: req.body.name }).then((beacon) => {
    if (!beacon) {
      res.status(404).json({ error: 'BEACON_NOT_FOUND' });
    } else {
      Room.findOneAndUpdate({
        installedAppId: req.installData.installedApp.installedAppId,
        default: true
      }, { $push: { devices: beacon.name }}).then(() => {
        res.status(200).json(beacon);
      }).catch((err) => {
        log.error(err);
        res.status(500).json({ error: 'DB_ERROR' });
      });
    }
  });
});

// Retrieve all of the rooms
app.get('/rooms', checkAuth, getInstallData, (req, res) => {
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
app.post('/rooms/create', checkAuth, getInstallData, (req, res) => {
  console.log(req.body);
  const room = new Room({
    installedAppId: req.session.installedAppId,
    roomId: req.body.roomId,
    name: req.body.name,
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

app.post('/rooms/:roomId/delete', checkAuth, getInstallData, (req, res) => {
  RoomTransaction.deleteRoom(req.params.roomId).then(() => {
    log.log('Successfully deleted room ' + req.params.roomId);
    res.status(200).send({});
  }).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.post('/rooms/:roomId/updateName', checkAuth, getInstallData, (req, res) => {
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

app.post('/rooms/:roomId/reorderDeviceInRoom', checkAuth, getInstallData,
    (req, res) => {
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

app.post('/rooms/moveDeviceBetweenRooms', checkAuth, getInstallData,
    (req, res) => {
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

app.get('/users', checkAuth, (req, res) => {
  User.find({ installedAppId: req.session.installedAppId }).then((users) => {
    res.status(200).json(users);
  });
});

// Create a new user, via public key (scanned with QR code).
app.post('/users/new', checkAuth, (req, res) => {
  let key = req.body.publicKey;
  User.findOne({ publicKeys: { $elemMatch: { x: key.x, y: key.y }}}).then((keyExists) => {
    if (keyExists) {
      res.status(400).json({
        error: 'Couldn\'t add user: this code has already been used.'
      });
      return;
    }
    let newUser = new User({
      id: uuid(),
      installedAppId: req.session.installedAppId,
      displayName: req.body.displayName,
      publicKeys: [req.body.publicKey]
    });
    newUser.save().then(() => {
      res.status(200).json({});
    }).catch((err) => {
      log.error(JSON.stringify(err));
      res.status(500).json({
        error: 'Couldn\'t add user: SmarterHome database error.'
      });
    });
  });
});

app.post('/users/addKey', checkAuth, (req, res) => {
  let key = req.body.publicKey;
  User.findOne({ publicKeys: { $elemMatch: { x: key.x, y: key.y }}})
    .then((keyExists) => {
      if (keyExists) {
        res.status(400).json({
          error: 'Couldn\'t add device: this code has already been used.'
        });
        return;
      }
      User.findOneAndUpdate({ id: req.body.userId}, {
        $push: { publicKeys: req.body.publicKey }
      }).then(() => {
        res.status(200).json({});
      }).catch((err) => {
        console.log(err);
        res.status(500).json({
          error: 'Couldn\'t add device: SmarterHome database error.'
        });
      });
  }).catch((err) => {
    console.log(err);
    res.status(500).json({
      error: 'Couldn\'t add device: SmarterHome database error.'
    });
  });
});

app.get('/users/:userId', checkAuth, (req, res) => {
  if (req.params.userId === 'me') {
    res.status(200).json(req.user);
    return;
  }
  User.findOne({
    installedAppId: req.session.installedAppId, id: req.params.userId
  }).then((user) => {
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND' });
    } else {
      res.status(200).json(user);
    }
  }).catch((err) => {
    log.error(JSON.stringify(err));
    res.status(500).json({ error: 'DB_ERROR' });
  });
});


app.get('/refresh', checkAuth, (req, res) => {
  SmartThingsClient.renewTokens(req.session.installedAppId).then((tokens) => {
    res.status(200).json(tokens);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.get('/oauth', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/oauth.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/index.html'));
});

function renewAllAccessTokens() {
  InstallData.find({}).then((installDatas) => {
    installDatas.forEach((installData) => {
      let installedAppId = installData.installedApp.installedAppId;
      log.log('Automatically renewing tokens for ' + installedAppId);
      SmartThingsClient.renewTokens(installedAppId).then(() => {
        log.log('Renewed tokens for ' + installedAppId);
      }).catch((err) => {
        log.error('Failed to renew tokens for ' + installedAppId);
        log.error(JSON.stringify(err));
      });
    });
  });
}

// Refresh access tokens regularly to ensure all commands are authenticated
setInterval(renewAllAccessTokens, 1000 * 60 * 4.5);
// Renew 15 seconds after the server starts
setTimeout(renewAllAccessTokens, 1000 * 15);

app.listen(5000);
log.log('Listening on port 5000');
