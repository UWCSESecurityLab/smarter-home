const mongoose = require('mongoose');

let sessionSchema = mongoose.Schema({
  _id: String,
  session: String,
  expires: Date
});

let Session = mongoose.model('Session', sessionSchema);
module.exports = Session;