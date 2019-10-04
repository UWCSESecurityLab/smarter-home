const mongoose = require('mongoose');

let logSchema = mongoose.Schema({
  timestamp: Date,
  level: String,
  message: String,
  meta: {
    session: Object,
    method: String,
    url: String,
    body: Object,
    user: String,
    installedAppId: String,
    ask: Object,
  }
});

let Log = mongoose.model('Log', logSchema, 'log');
module.exports = Log;