const mongoose = require('mongoose');

let userReportSchema = mongoose.Schema({
  timestamp: Date,
  userId: String,
  installedAppId: String,
  type: String,
  report: String
});

let UserReport = mongoose.model('UserReport', userReportSchema);
module.exports = UserReport;