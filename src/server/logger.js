const winston = require('winston');
require('winston-mongodb');
const db_url = require('./db/dbUrl');

const logger = winston.createLogger({
  level: 'verbose',
  format: winston.format.json(),
  transports: [
    new winston.transports.MongoDB({ level: 'verbose', db: db_url, collection: 'log'}),
    new winston.transports.Console({
      format: winston.format.simple(),
      level: 'verbose'
    })
  ]
});

module.exports = logger;
