const Beacon = require('../server/db/beacon');
const fs = require('fs');
const mongoose = require('mongoose');
const parse = require('csv-parse/lib/sync');

if (process.argv.length !== 3) {
  console.log('Usage: node import-beacons.js beacon_csv_file');
  process.exit(1);
}

mongoose.connect('mongodb://mongo1:27017,mongo2:27018,mongo3:27019/pilot?replicaSet=my-mongo-set', { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', () => {
  let raw = fs.readFileSync(process.argv[2]).toString();
  let parsed = parse(raw, {columns: true});

  let beacons = parsed.map((b) => {
    return {
      uuid: b.proximity,
      major: parseInt(b.major),
      minor: parseInt(b.minor),
      namespace: b.namespace,
      instanceId: b.instanceId,
      name: b.uniqueId
    }
  });

  Beacon.insertMany(beacons, {ordered: false}, (err, docs) => {
    if (err) {
      console.log(err);
    } else {

      console.log(`Inserted ${docs.length} beacons`);
      console.log(docs);

      console.log('Inserted:');
      console.log(beacons.filter((b) => {
        return docs.find(d => d.major === parseInt(b.major) && d.minor === parseInt(b.minor));
      }));
      console.log('Not inserted:');
      console.log(beacons.filter((b) => {
        return !docs.find(d => d.major === parseInt(b.major) && d.minor === parseInt(b.minor));
      }));
    }
    db.close();
  });
});


