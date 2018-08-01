const Beacon = require('../server/db/beacon');
const fs = require('fs');
const mongoose = require('mongoose');
const parse = require('csv-parse/lib/sync');

if (process.argv.length !== 3) {
  console.log('Usage: node import-beacons.js beacon_csv_file');
  process.exit(1);
}

mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/test?replicaSet=rs', { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', () => {
  let raw = fs.readFileSync(process.argv[2]).toString();
  let parsed = parse(raw, {columns: true});

  let beacons = parsed.map((b) => {
    return {
      namespace: b.namespace,
      id: b.instanceId,
      name: b.uniqueId
    }
  });

  Beacon.insertMany(beacons, {ordered: false}, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Inserted ${docs.length} beacons`);
      console.log('Inserted:');
      console.log(beacons.filter((b) => {
        return docs.find(d => d.id === b.id);
      }));
      console.log('Not inserted:');
      console.log(beacons.filter((b) => {
        return !docs.find(d => d.id === b.id);
      }));
    }
    db.close();
  });
});


