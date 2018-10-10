
const DOCKER_DB_URL = 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019';
const LOCALHOST_DB_URL = 'mongodb://localhost:27017,localhost:27018,localhost:27019';
const TEST_DB_PATH = '/test';
const PILOT_DB_PATH = '/pilot';
const REPLICA_SET = '?replicaSet=my-mongo-set';

let db_url = '';
if (process.env.IS_DOCKER === 'true') {
  db_url += DOCKER_DB_URL;
} else {
  db_url += LOCALHOST_DB_URL;
}
if (process.env.SERVER_MODE === 'dev') {
  db_url += TEST_DB_PATH;
} else if (process.env.SERVER_MODE === 'prod') {
  db_url += PILOT_DB_PATH;
}
db_url += REPLICA_SET;

module.exports = db_url;