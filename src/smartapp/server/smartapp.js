console.log(`NODE_ENV=${process.env.NODE_ENV}`);
console.log(`SERVER_MODE=${process.env.SERVER_MODE}`);
console.log(`IS_DOCKER=${process.env.IS_DOCKER}`);

if (!process.env.SERVER_MODE && process.argv.length !== 3) {
  console.log('Usage: node server/smartapp.js [ dev | prod ]');
  console.log('Or, set the SERVER_MODE environmental variable to dev or prod.');
  process.exit(1);
}

if (!process.env.SERVER_MODE) {
  switch (process.argv[2]) {
    case 'prod':
      process.env.SERVER_MODE = 'prod';
      break;
    case 'dev':
      process.env.SERVER_MODE = 'dev';
      break;
    default:
      console.log('Usage: node server/smartapp.js [ dev | prod ]');
      process.exit(1);
  }
}

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

const ask = require('./ask');
const { ApprovalState } = require('../permissions');
const auth = require('./auth');
const Beacon = require('./db/beacon');
const Command = require('./db/command');
const db_url = require('./db/dbUrl');
const Errors = require('../errors');
const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const lifecycle = require('./lifecycle');
const log = require('./log');
const logger = require('./logger');
const Permission = require('./db/permissions');
const Roles = require('../roles');
const Room = require('./db/room');
const RoomTransaction = require('./db/room-transaction');
const SmartThingsClient = require('./SmartThingsClient');
const StateUpdate = require('../state-update');
const User = require('./db/user');
const UserReport = require('./db/user-report');
const SmartappConfig = require('../config/smartapp-config.js');

let ec = new EC('p384');

let APP_CONFIG, PUBLIC_KEY;
if (process.env.SERVER_MODE === 'prod') {
  log.log('Starting prod server instance');
  APP_CONFIG = SmartappConfig.pilotApp;
  PUBLIC_KEY = SmartappConfig.pilotKey;
} else if (process.env.SERVER_MODE === 'dev') {
  log.log('Starting development server instance');
  APP_CONFIG = SmartappConfig.devApp;
  PUBLIC_KEY = SmartappConfig.devKey;
}

mongoose.connect(db_url);

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  logger.verbose('Database connection established');
});

let app = express();
app.use(compression());
app.set('views', __dirname + '/../web/views');
app.use(express.static('dist'));
app.use(express.static('web/sw'));
app.use('/favicon.ico', express.static('web/favicon.ico'));
app.use('/css', express.static('web/css'));
app.use(bodyParser.json());

// Middleware to convert client-side sessions into cookies so that passport
// can authenticate Cordova clients.
app.use(function(req, res, next) {
  let sessionId = req.get('Client-Session');
  // if there was a session id passed add it to the cookies
  if (sessionId) {
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

app.use((req, res, next) => {
  let meta = {
    session: req.get('Client-Session'),
    method: req.method,
    url: req.originalUrl,
    // headers: req.headers,
  };
  if (!req.originalUrl.startsWith('/login') || !req.originalUrl.startsWith('/register')) {
    meta.body = req.body
  }
  req.logMeta = meta;
  next();
});

// Middleware that attaches a user's SmartThings InstallData to the request.
function getInstallData(req, res, next) {
  let fnLogMeta = { ...req.logMeta, context: 'getInstallData' };
  InstallData.findOne({
    'installedApp.installedAppId': req.session.installedAppId
  }, (err, installData) => {
    if (err) {
      logger.error({
        message: Errors.DB_ERROR,
        meta: { ...fnLogMeta, error: err }
      });

      res.status(500).json({ error: Errors.DB_ERROR });
      return;
    }
    if (!installData) {
      logger.error({
        message: Errors.APP_NOT_FOUND,
        meta: { ...req.fnLogMeta, installedAppId: req.session.installedAppId }
      });
      res.status(404).json({ error: Errors.APP_NOT_FOUND });
      return;
    }

    req.installData = installData;
    next();
  });
}

// Middleware that checks if request is authenticated, attaches user to req.
function checkAuth(req, res, next) {
  let fnLogMeta = { ...req.logMeta, context: 'checkAuth' };
  User.findOne({ id: req.session.user }, function(err, user) {
    if (err) {
      logger.error({
        message: Errors.DB_ERROR,
        meta: { ...fnLogMeta, error: err }
      });
      res.status(500).json({ error: Errors.DB_ERROR });
      return;
    }
    if (!user) {
      logger.error({
        message: Errors.NOT_LOGGED_IN,
        meta: { ...fnLogMeta, user: req.session.user }
      });
      res.status(401).json({ error: Errors.NOT_LOGGED_IN });
      return;
    }
    req.user = user;
    if (!req.session.installedAppId && user.installedAppId) {
      req.session.installedAppId = user.installedAppId;
    } else if (!req.session.installedAppId && !user.installedAppId) {
      logger.error({
        message: Errors.USER_NOT_LINKED,
        meta: { ...fnLogMeta, user: req.session.user }
      });
      res.status(403).json({ error: Errors.USER_NOT_LINKED });
      return;
    }
    req.logMeta.installedAppId = req.session.installedAppId;
    req.logMeta.user = req.session.user;
    next();
  });
}

// Middleware that logs when a request is received.
function logRequest(req, res, next) {
  logger.verbose({ message: 'Client Request', meta: req.logMeta });
  // log.magenta('Incoming request', req.method + ' ' + req.originalUrl);
  next();
}

function signatureIsVerified(req) {
  try {
    let parsed = httpSignature.parseRequest(req);
    if (!httpSignature.verifySignature(parsed, PUBLIC_KEY)) {
      logger.error({
        message: 'Failed to verify SmartThings signature',
        meta: { ...req.logMeta, context: 'signatureIsVerified', signature: parsed }
      });
      return false;
    }
  } catch (error) {
    logger.error({
      message: 'Failed to verify SmartThings signature',
      meta: { ...req.logMeta, context: 'signatureIsVerified', error: error }
    });
  }
  return true;
}

app.post('/', logRequest, (req, res) => {
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

  log.log('SmartThings Event');
  console.log(req.body);

  logger.verbose('SmartThings Event', { eventData: req.body });
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

app.post('/login', logRequest, (req, res) => {
  auth.verifyUser(req.body.username, req.body.password).then((user) => {
    logger.info({
      message: 'Login Success',
      meta: { ...req.logMeta, user: user.id }
    });
    if (req.body.oauth == 'true') {
      logger.info({
        message: 'OAuth Redirect Success',
        meta: { ...req.logMeta, user: user.id }
      });
      res.status(200).json({ redirect: `https://api.smartthings.com/oauth/callback?state=${req.body.oauthState}&token=${user.id}`});
      return;
    }

    req.session.regenerate((err) => {
      if (err) {
        logger.error({
          message: Errors.SESSION_ERROR,
          meta: { ...req.logMeta, error: err }
        });
        res.status(500).json({ error: Errors.SESSION_ERROR });
        return;
      }
      req.session.user = user.id;
      req.session.installedAppId = user.installedAppId;
      req.session.save((err) => {
        if (err) {
          logger.error({
            message: Errors.SESSION_ERROR,
            meta: { ...req.logMeta, error: err }
          });
          res.status(500).json({ error: Errors.SESSION_ERROR });
          return;
        }
        res.status(200).json({});
      });
    });
  }).catch((err) => {
    if (err.error === Errors.LOGIN_BAD_USER_PW) {
      logger.error({
        message: Errors.LOGIN_BAD_USER_PW,
        meta: { ...req.logMeta, user: req.body.username }
      });
      res.status(401).json({ error: Errors.LOGIN_BAD_USER_PW });
    } else {
      logger.error({
        message: Errors.UNKNOWN,
        meta: { ...req.logMeta, error: err }
      });
      res.status(500).json({ error: Errors.DB_ERROR });
    }
  });
});

app.post('/register', logRequest, (req, res) => {
  if (!req.body.username || !req.body.displayName || !req.body.password || !req.body.confirm) {
    logger.error({ message: Errors.REGISTER_MISSING_FIELD, meta: req.logMeta });
    res.status(400).json({ error: Errors.REGISTER_MISSING_FIELD });
    return;
  }

  if (req.body.password !== req.body.confirm) {
    logger.error({ message: Errors.REGISTER_PW_MISMATCH, meta: req.logMeta });
    res.status(400).json({ error: Errors.REGISTER_PW_MISMATCH });
    return;
  }

  auth.createUser(req.body.username, req.body.displayName, req.body.password).then(() => {
    logger.info({
      message: 'Created User', meta: { ...req.logMeta, user: req.body.username }
    });
    res.status(200).json({});
  }).catch((err) => {
    if (err.error == Errors.REGISTER_USERNAME_TAKEN) {
      logger.error({
        message: Errors.REGISTER_USERNAME_TAKEN,
        meta: { ...req.logMeta, username: req.body.username }
      });
      res.status(400).json(err);
    } else {
      logger.error({
        message: Errors.UNKNOWN,
        meta: { ...req.logMeta, username: err }
      });
      res.status(500).json(err);
    }
  });
});

// Step 1 in challenge-response login protocol.
// Client sends public key (so server can verify user exists)
// Server responds with string challenge
app.post('/authChallenge', logRequest, (req, res) => {
  // Find matching public key in User database.
  User.findOne({ publicKeys: { $elemMatch: {
    x: req.body.publicKey.x, y: req.body.publicKey.y
  }}}).then((user) => {
    if (!user) {
      logger.error({
        message: Errors.CR_UNRECOGNIZED_KEY,
        meta: { ...req.logMeta, key: req.body.publicKey }
      });
      res.status(403).json({ error: Errors.CR_UNRECOGNIZED_KEY });
      return;
    }
    // Generate challenge, save user and challenge in session
    const challenge = uuid();
    req.session.challenge = challenge;
    req.session.challengeUser = user.id;
    logger.verbose({
      message: 'Sending Challenge',
      meta: { ...req.logMeta, challenge: challenge }
    });
    res.status(200).json({ challenge: challenge });
  }).catch((err) => {
    logger.error({
      message: Errors.UNKNOWN,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json(err);
  });
});

// Step 2 in challenge-response login protocol.
// Client sends ECDSA signed challenge (JSON object containing r, s in arrays)
// Server verifies that it was signed by the holder of the private key, who
// sent their key in the challenge.
app.post('/authResponse', logRequest, (req, res) => {
  if (!req.session.challenge || !req.session.challengeUser) {
    logger.error({ message: Errors.CR_MISSING_CHALLENGE, meta: req.logMeta });
    res.status(401).json({ error: Errors.CR_MISSING_CHALLENGE });
    return;
  }

  User.findOne({ id: req.session.challengeUser }).then((challengeUser) => {
    // Turn JSON arrays into ArrayBuffer
    let r = Buffer.from(new Uint8Array(req.body.signature.r).buffer);
    let s = Buffer.from(new Uint8Array(req.body.signature.s).buffer);
    let signature = { r: r, s: s };

    let challengeBuf = Buffer.from(req.session.challenge, 'utf-8');

    // Compute hash of challenge
    const hash = crypto.createHash('sha512');
    hash.update(challengeBuf);
    const msgHash = hash.digest();

    // Try each of user's public keys
    for (let jwk of challengeUser.publicKeys) {
      let hex_x = Buffer.from(jwk.x, 'base64').toString('hex');
      let hex_y = Buffer.from(jwk.y, 'base64').toString('hex');
      let publicKey = ec.keyFromPublic({x: hex_x, y: hex_y }, 'hex');
      if (publicKey.verify(msgHash, signature)) {
        logger.info({
          message: 'Verified signed challenge',
          meta: { ...req.logMeta, user: challengeUser.id }
        });
        // Success
        req.session.regenerate((err) => {
          if (err) {
            logger.error({
              message: Errors.SESSION_ERROR,
              meta: { ...req.logMeta, error: err }
            });
            res.status(500).json({ error: Errors.SESSION_ERROR });
            return;
          }
          req.session.user = challengeUser.id;
          req.session.installedAppId = challengeUser.installedAppId;
          req.session.save((err) => {
            if (err) {
              logger.error({
                message: Errors.SESSION_ERROR,
                meta: { ...req.logMeta, error: err }
              });
              res.status(500).json({ error: Errors.SESSION_ERROR });
              return;
            }
            res.status(200).json({});
          });
        });
        return;
      }
    }
    // Fail
    logger.error({
      message: Errors.CR_FAIL,
      meta: { ...req.logMeta, user: challengeUser.id }
    });
    res.status(401).json({ error: Errors.CR_FAIL });
  }).catch((err) => {
    logger.error({ message: Errors.UNKNOWN, meta: { ...req.logMeta, error: err }});
    res.status(500).json(err);
  });
});

app.post('/logout', logRequest, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error({
        message: Errors.SESSION_ERROR,
        meta: { ...req.logMeta, error: err }
      });
      res.status(500).json({ error: Errors.SESSION_ERROR });
    }
    res.status(200).json({});
  })
});

// Registers the FCM notification token with the current user.
app.post('/notificationToken', checkAuth, logRequest, async (req, res) => {
  fcmClient.updateActivityNotifications({
    flags: req.body.flags,
    user: req.user,
    token: req.body.token
  }).then(() => {
    res.status(200).json({});
  }).catch((err) => {
    if (err.error === Errors.MISSING_FLAGS) {
      logger.error({
        message: Errors.MISSING_FLAGS,
        meta: { ...req.logMeta, error: err }
      });
      res.status(400).json(err);
    } else {
      logger.error({ message: Errors.UNKNOWN, meta: { ...req.logMeta, error: err }});
      res.status(500).json(err);
    }
  });
});

// Lists all devices in the home.
app.get('/listDevices', checkAuth, getInstallData, logRequest, (req, res) => {
  SmartThingsClient.listDevices({
    authToken: req.installData.authToken
  }).then((results) => {
    res.json(results);
  }).catch((err) => {
    logger.error({
      message: Errors.SMARTTHINGS_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json(err);
  });
});

app.get('/homeConfig', checkAuth, getInstallData, logRequest, (req, res) => {
  const deviceTypes = ['doorLocks', 'switches', 'contactSensors', 'motionSensors'];

  let stConfig = req.installData.installedApp.config;
  let ourConfig = {};

  // Remove extraneous information from device entries, just preserve the
  // device ids.
  for (let deviceType of deviceTypes) {
    if (stConfig[deviceType]) {
      ourConfig[deviceType] = stConfig[deviceType].map((entry) => {
        return entry.deviceConfig.deviceId;
      });
    }
  }
  res.json(ourConfig);
});

// Get the status of a device
app.get('/devices/:deviceId/status', checkAuth, getInstallData, logRequest, (req, res) => {
  Beacon.findOne({ name: req.params.deviceId }).then((beacon) => {
    if (!beacon) {
      SmartThingsClient.getDeviceStatus({
        deviceId: req.params.deviceId,
        authToken: req.installData.authToken
      }).then((status) => {
        res.json(status);
      }).catch((err) => {
        logger.error({
          message: Errors.SMARTTHINGS_ERROR,
          meta: { ...req.logMeta, error: err }
        });
        res.status(500).json(err);
      });
    } else {
      res.status(200).json({
        deviceId: beacon.name,
        status: {
          components: {
            main: {
              beacon: {}
            }
          }
        }
      });
    }
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.get('/devices/:deviceId/description', checkAuth, getInstallData, logRequest,
    (req, res) => {
  Beacon.findOne({ name: req.params.deviceId }).then((beacon) => {
    if (!beacon) {
      SmartThingsClient.getDeviceDescription({
        deviceId: req.params.deviceId,
        authToken: req.installData.authToken
      }).then((description) => {
        res.json(description);
      }).catch((err) => {
        logger.error({
          message: Errors.SMARTTHINGS_ERROR,
          meta: { ...req.logMeta, error: err }
        });
        res.status(500).json(err);
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
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

function executeDevice(req, res) {
  ask.execute({
    installedAppId: req.installData.installedApp.installedAppId,
    authToken: req.installData.authToken,
    userId: req.user.id,
    deviceId: req.params.deviceId,
    component: req.body.component,
    capability: req.body.capability,
    command: req.body.command
  }).then(() => {
    res.status(200).json({});
  }).catch((err) => {
    let msg;
    if (err.name === 'MongoError') {
      msg = Errors.DB_ERROR;
    } else {
      msg = Errors.SMARTTHINGS_ERROR;
    }
    logger.error({ message: msg, meta: { ...req.logMeta, error: err } });
    res.status(500).json({ error: err });
  });
}

app.post('/devices/:deviceId/commands', checkAuth, getInstallData, logRequest, (req, res) => {
  executeDevice(req, res);
});

app.post('/devices/:deviceId/requestCommand', checkAuth, logRequest, (req, res) => {
  ask.request({
    requester: req.user,
    deviceId: req.params.deviceId,
    command: req.body.command,
    capability: req.body.capability,
    isNearby: req.body.isNearby,
    isHome: req.body.isHome,
  }).then((status) => {
    logger.info({
      message: 'Ask-Request Decision',
      meta: {
        ...req.logMeta,
        ask: status
      }
    });
    if (status.decision === ApprovalState.ALLOW) {
      InstallData.findOne({ 'installedApp.installedAppId': req.session.installedAppId })
        .then((installData) => {
          req.installData = installData;
          executeDevice(req, res);
        });
    } else if (status.decision === ApprovalState.DENY) {
      res.status(200).json(status);
    } else if (status.decision === ApprovalState.PENDING) {
      res.status(200).json(status);
    }
  });
});

app.get('/pendingCommands', checkAuth, logRequest, (req, res) => {
  ask.getPendingCommands(req.user).then((pending) => {
    res.status(200).json(pending);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: err });
  });
});

app.post('/pendingCommands/:commandId', checkAuth, logRequest, (req, res) => {
  ask.response({
    commandId: req.params.commandId,
    approvalType: req.body.approvalType,
    approvalState: req.body.approvalState
  }).catch((err) => {
    logger.error({
      message: 'Ask-Response error',
      meta: { ...req.logMeta, error: err }
    });
  });
  res.status(200).json({});
});

app.get('/devices/:deviceId/permissions', checkAuth, logRequest, (req, res) => {
  Permission.findOne({
    deviceId: req.params.deviceId,
    installedAppId: req.session.installedAppId
  }).then((permission) => {
    if (!permission) {
      Promise.all([User.find({
        installedAppId: req.session.installedAppId,
      }), Room.find({
        installedAppId: req.session.installedAppId,
        devices: req.params.deviceId
      })]).then(([users, room]) => {
        if (room && users.length > 0) {
          let newPermission = new Permission({
            deviceId: req.params.deviceId,
            installedAppId: req.session.installedAppId,
            owners: users.map((u) => u.id)
          });
          newPermission.save().then(() => {
            res.status(200).json(newPermission);
          }).catch((err) => {
            logger.error({
              message: Errors.DB_ERROR,
              meta: { ...req.logMeta, error: err }
            });
            res.status(500).json(Errors.DB_ERROR);
          });
        } else {
          res.status(404).json({ error: Errors.DEVICE_NOT_FOUND });
        }
      });
    } else {
      res.status(200).json(permission);
    }
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json(Errors.DB_ERROR);
  });
});

app.post('/devices/:deviceId/permissions', checkAuth, logRequest, (req, res) => {
  let update = {};
  if (req.body.hasOwnProperty('locationRestrictions')) {
    update.locationRestrictions = req.body.locationRestrictions
  }
  if (req.body.hasOwnProperty('parentalRestrictions')) {
    update.parentalRestrictions = req.body.parentalRestrictions;
  }
  if (req.body.hasOwnProperty('removeOwner')) {
    update.$pull = { owners: req.body.removeOwner };
  }
  if (req.body.hasOwnProperty('addOwner')) {
    update.$push = { owners: req.body.addOwner };
  }

  Permission.findOneAndUpdate({
    deviceId: req.params.deviceId,
    installedAppId: req.session.installedAppId
  }, update).then(() => {
    res.status(200).json({});
    fcmClient.sendStateUpdateNotification(StateUpdate.PERMISSIONS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json(Errors.DB_ERROR);
  });
});

app.get('/beacon/configure', logRequest, (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/beacons.html'));
});

app.get('/beacon/list', (req, res) => {
  Beacon.find().then((beacons) => {
    res.status(200).json(beacons);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/beacon/new', logRequest, (req, res) => {
  let beacon = new Beacon({
    namespace: req.body.namespace,
    id: req.body.id,
    name: req.body.name
  });
  beacon.save().then(() => {
    res.status(200).json({});
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json(err);
  });
});

app.post('/beacon/add', checkAuth, getInstallData, logRequest, (req, res) => {
  Beacon.findOne({ name: req.body.name }).then((beacon) => {
    if (!beacon) {
      res.status(404).json({ error: Errors.BEACON_NOT_FOUND });
    } else {
      Room.findOneAndUpdate({
        installedAppId: req.installData.installedApp.installedAppId,
        default: true
      }, { $push: { devices: beacon.name }}).then(() => {
        res.status(200).json(beacon);
        fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
      }).catch((err) => {
        log.error(err);
        res.status(500).json({ error: Errors.DB_ERROR });
      });
    }
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/beacon/remove', checkAuth, getInstallData, logRequest, (req, res) => {
  Beacon.findOne({ name: req.body.name }).then((beacon) => {
    if (!beacon) {
      res.status(404).json({ error: Errors.BEACON_NOT_FOUND });
    } else {
      Room.findOneAndUpdate({
        installedAppId: req.installData.installedApp.installedAppId,
        devices: beacon.name
      }, { $pull: { devices: beacon.name }}).then(() => {
        res.status(200).json({});
        fcmClient.sendStateUpdateNotification(StateUpdate.DEVICES, req.session.installedAppId);
      }).catch((err) => {
        logger.error({
          message: Errors.DB_ERROR,
          meta: { ...req.logMeta, error: err }
        });
        res.status(500).json({ error: Errors.DB_ERROR });
      });
    }
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

// Retrieve all of the rooms
app.get('/rooms', checkAuth, getInstallData, logRequest, (req, res) => {
  Room.find({ installedAppId: req.session.installedAppId })
    .then((rooms) => {
      res.status(200).json(rooms);
    }).catch((err) => {
      logger.error({
        message: Errors.DB_ERROR,
        meta: { ...req.logMeta, error: err }
      });
      res.status(500).json({ error: Errors.DB_ERROR });
    });
});

// Create a new room
app.post('/rooms/create', checkAuth, getInstallData, logRequest, (req, res) => {
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
    fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/rooms/:roomId/delete', checkAuth, getInstallData, logRequest, (req, res) => {
  RoomTransaction.deleteRoom(req.params.roomId).then(() => {
    log.log('Successfully deleted room ' + req.params.roomId);
    res.status(200).json({});
    fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/rooms/:roomId/updateName', checkAuth, getInstallData, logRequest, (req, res) => {
  Room.findOneAndUpdate({
      installedAppId: req.session.installedAppId,
      roomId: req.params.roomId
    }, { '$set': { 'name': req.body.name }
  }).then(() => {
    log.log('Successfully updated name');
    res.status(200).json({});
    fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/rooms/:roomId/reorderDeviceInRoom', checkAuth, getInstallData, logRequest,
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
    res.status(200).json(room);
    fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/rooms/moveDeviceBetweenRooms', checkAuth, getInstallData, logRequest,
    (req, res) => {
  RoomTransaction.moveDeviceBetweenRooms(
    req.body.srcRoom,
    req.body.destRoom,
    req.body.srcIdx,
    req.body.destIdx
  ).then(() => {
    log.log('Successfully moved device between rooms');
    res.status(200).json({});
    fcmClient.sendStateUpdateNotification(StateUpdate.ROOMS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
   res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.get('/users', checkAuth, logRequest, (req, res) => {
  User.find({ installedAppId: req.session.installedAppId }, {
    id: 1,
    username: 1,
    displayName: 1,
    installedAppId: 1,
    role: 1,
  }).then((users) => {
    const meIdx = users.findIndex((user) => user.id === req.user.id);
    users[meIdx].notificationPrefs = req.user.notificationPrefs;
    res.status(200).json(users);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/users/updateNotificationPrefs', checkAuth, logRequest, (req, res) => {
  console.log(req.body.newPrefs);
  let prefs = {};
  Object.keys(req.body.newPrefs).forEach((deviceId) => {
    prefs[`notificationPrefs.${deviceId}`] = req.body.newPrefs[deviceId];
  });

  User.findOneAndUpdate(
    { id: req.user.id },
    { $set: prefs }
  ).then((user) => {
    console.log('Updated user');
    console.log(user);
    res.status(200).json({});
  }).catch((err) => {
    log.error(err.stack);
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

// Create a new user, via public key (scanned with QR code).
app.post('/users/new', checkAuth, logRequest, (req, res) => {
  if (!req.body.publicKey || !req.body.displayName || !Object.values(Roles).includes(req.body.role)) {
    logger.error({ message: Errors.MISSING_FIELDS, meta: req.logMeta });
    res.status(400).json({ error: Errors.MISSING_FIELDS });
    return;
  }

  let key = req.body.publicKey;
  User.findOne({ publicKeys: { $elemMatch: { x: key.x, y: key.y }}}).then((keyExists) => {
    if (keyExists) {
      logger.error({ message: Errors.CR_CODE_USED, meta: req.logMeta });
      res.status(400).json({ error: Errors.CR_CODE_USED });
      return;
    }
    let newUser = new User({
      id: uuid(),
      installedAppId: req.session.installedAppId,
      displayName: req.body.displayName,
      publicKeys: [req.body.publicKey],
      role: req.body.role
    });
    newUser.save().then(() => {
      return Permission.updateMany({
        installedAppId: req.session.installedAppId
      }, { $push: { owners: newUser.id }});
    }).then(() => {
      res.status(200).json({});
      fcmClient.sendStateUpdateNotification(StateUpdate.USERS, req.session.installedAppId);
    }).catch((err) => {
      logger.error({
        message: Errors.DB_ERROR,
        meta: { ...req.logMeta, error: err }
      });
      res.status(500).json({ error: Errors.DB_ERROR });
    });
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/users/addKey', checkAuth, logRequest, (req, res) => {
  if (Object.keys(req.body.publicKey).length === 0 || !req.body.userId) {
    logger.error({ message: Errors.MISSING_FIELDS, meta: req.logMeta });
    res.status(400).json({ error: Errors.MISSING_FIELDS });
    return;
  }
  let key = req.body.publicKey;
  User.findOne({ publicKeys: { $elemMatch: { x: key.x, y: key.y }}})
    .then((keyExists) => {
      if (keyExists) {
        logger.error({ message: Errors.CR_CODE_USED, meta: req.logMeta });
        res.status(400).json({ error: Errors.CR_CODE_USED });
        return;
      }
      User.findOneAndUpdate({ id: req.body.userId}, {
        $push: { publicKeys: req.body.publicKey }
      }).then(() => {
        res.status(200).json({});
      }).catch((err) => {
        logger.error({
          message: Errors.DB_ERROR,
          meta: { ...req.logMeta, error: err }
        });
        res.status(500).json({ error: Errors.DB_ERROR });
      });
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.get('/users/:userId', checkAuth, logRequest, (req, res) => {
  if (req.params.userId === 'me') {
    res.status(200).json(req.user);
    return;
  }
  User.findOne({
    installedAppId: req.session.installedAppId, id: req.params.userId
  }, {
    id: 1,
    username: 1,
    displayName: 1,
    installedAppId: 1,
    role: 1,
    notificationPrefs: req.params.userId === req.session.user.id ? 1 : 0
  }).then((user) => {
    if (!user) {
      logger.error({ message: Errors.USER_NOT_FOUND, meta: req.logMeta });
      res.status(404).json({ error: Errors.USER_NOT_FOUND });
    } else {
      res.status(200).json(user);
    }
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/users/:userId/updateRole', checkAuth, logRequest, (req, res) => {
  if (req.user.role !== Roles.ADMIN && req.user.role !== Roles.USER) {
    logger.error({ message: Errors.MISSING_PERMISSIONS, meta: req.logMeta });
    res.status(403).json({ error: Errors.MISSING_PERMISSIONS });
    return;
  }
  if (!Object.values(Roles).includes(req.body.role)) {
    logger.error({ message: Errors.UNKNOWN, meta: req.logMeta });
    res.status(400).json({ error: Errors.UNKNOWN });
    return;
  }
  User.findOneAndUpdate(
    { id: req.params.userId }, { $set: { role: req.body.role }}
  ).then(() => {
    res.status(200).json({});
    fcmClient.sendStateUpdateNotification(StateUpdate.USERS, req.session.installedAppId);
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { error: err, ...req.logMeta }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.get('/refresh', checkAuth, logRequest, (req, res) => {
  SmartThingsClient.renewTokens(req.session.installedAppId, APP_CONFIG)
    .then((tokens) => {
      res.status(200).json(tokens);
    }).catch((err) => {
      logger.error({
        message: Errors.SMARTTHINGS_AUTH_ERROR,
        meta: { ...req.logMeta, installedAppId: req.session.installedAppId }
      });
      res.status(500).json(err);
    });
});

app.post('/userReport/:type', checkAuth, logRequest, (req, res) => {
  let report = new UserReport({
    timestamp: new Date(),
    userId: req.user.id,
    installedAppId: req.session.installedAppId,
    type: req.params.type,
    report: req.body.report
  });
  report.save().then(() => {
    res.status(200).json({});
  }).catch((err) => {
    logger.error({
      message: Errors.DB_ERROR,
      meta: { ...req.logMeta, error: err }
    });
    res.status(500).json({ error: Errors.DB_ERROR });
  });
});

app.post('/clientLog', checkAuth, logRequest, (req, res) => {
  console.log(req.body);
  delete req.logMeta.body;
  logger.log({
    level: req.body.level,
    message: req.body.message,
    meta: Object.assign({}, req.body.meta, req.logMeta)
  });
  res.status(200).json({});
});

app.get('/oauth', logRequest, (req, res) => {
  if (process.env.SERVER_MODE === 'prod') {
    res.sendFile(path.join(__dirname, '../web/html/oauth-prod.html'));
  } else if (process.env.SERVER_MODE === 'dev') {
    res.sendFile(path.join(__dirname, '../web/html/oauth-dev.html'));
  }
});

app.get('/privacy', logRequest, (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/privacy.html'));
});

app.get('*', logRequest, (req, res) => {
  if (process.env.SERVER_MODE === 'prod') {
    res.sendFile(path.join(__dirname, '../web/html/index-prod.html'));
  } else if (process.env.SERVER_MODE === 'dev') {
    res.sendFile(path.join(__dirname, '../web/html/index-dev.html'));
  }
});

function renewAllAccessTokens() {
  InstallData.find({}).then((installDatas) => {
    installDatas.forEach((installData) => {
      let installedAppId = installData.installedApp.installedAppId;
      log.log('Automatically renewing tokens for ' + installedAppId);
      SmartThingsClient.renewTokens(installedAppId, APP_CONFIG).then(() => {
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
log.log('Listening on local port 5000');
