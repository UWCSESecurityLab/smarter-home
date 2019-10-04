const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const Log = require('../server/db/log');
const Session = require('../server/db/session');
const User = require('../server/db/user');

let app = express();
app.use(express.static('dist'));

mongoose.connect('mongodb://mongo1:27017,mongo2:27018,mongo3:27019/pilot?replicaSet=my-mongo-set', { useNewUrlParser: true });

let db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to mongo')
});

app.use((req, res, next) => {
  console.log(req.method + ' ' + req.originalUrl);
  next();
});

async function getUsers() {
  let users = await User.find();
  return users.map((user) => {
    return {
      displayName: user.displayName,
      installedAppId: user.installedAppId
    }
  });
}

const lifecycleDataTypes = [
  'configurationData', 'uninstallData', 'oauthCallbackData', 'updateData', 'executeData', 'installData', 'pingData'
];

async function getLogsByInstalledAppId(installedAppId, limit = 25, page = 0) {
  console.log(limit);
  let lifecycleDataQueries = lifecycleDataTypes.map((data) => {
    let fieldName = `meta.body.${data}.installedApp.installedAppId`;
    return { [fieldName]: installedAppId };
  });
  lifecycleDataQueries.push({ 'meta.installedAppId':  installedAppId });

  return await Log.find({
    $or: lifecycleDataQueries
  }).limit(limit).exec();
}

app.get('/logs/:installedAppId', async (req, res) => {
  const limit = req.query.limit ? req.query.limit : 25;
  const page = req.query.page ? req.query.page: 0;
  try {
    let logs = await getLogsByInstalledAppId(req.params.installedAppId, limit, page);
    console.log(logs.length);
    res.status(200).json(logs);
  } catch(e) {
    console.log(e);
    res.status(500).json(e);
  }
});

app.get('/users', async (req, res) => {
  try {
    let users = await getUsers();
    res.status(200).json(users);
  } catch(e) {
    console.log(e);
    res.status(500).json(e);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/logviewer.html'));
});

app.listen(6000);
console.log('Log viewer listening on port 6000');