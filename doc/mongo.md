# Mongo deployment notes

SmarterHome runs MongoDB 4.0.0, with a three node replica set. The replica set
is run locally in three docker containers (to enable transactions).

This is a copy of the gist used to start the server:

---
https://gist.github.com/rubenmromero/a0636d68bd019e341c59f46a7105d4f0
```
# pull the official mongo docker container
docker pull mongo

# create network
docker network create my-mongo-cluster

# create mongos
docker run -d --net my-mongo-cluster -p 27017:27017 --name mongo1 mongo mongod --replSet my-mongo-set --port 27017
docker run -d --net my-mongo-cluster -p 27018:27018 --name mongo2 mongo mongod --replSet my-mongo-set --port 27018
docker run -d --net my-mongo-cluster -p 27019:27019 --name mongo3 mongo mongod --replSet my-mongo-set --port 27019

# add hosts
# 127.0.0.1       mongo1 mongo2 mongo3

# setup replica set
docker exec -it mongo1 mongo
db = (new Mongo('localhost:27017')).getDB('test')
config={"_id":"my-mongo-set","members":[{"_id":0,"host":"mongo1:27017"},{"_id":1,"host":"mongo2:27018"},{"_id":2,"host":"mongo3:27019"}]}
rs.initiate(config)

# connection URI
mongodb://localhost:27017,localhost:27018,localhost:27019/{db}?replicaSet=my-mongo-set
```
---

This exposes Mongo at the usual ports - 27017, 27018, and 27019. The replica set
is named "my-mongo-set".

Some useful commands:
* `rs.status()` - see status of replica set, including which is primary
* `mongobackup --db={dbname}` - dump database into json/bson
* `mongorestore --db={dbname} --drop {backups}` - restore database from backup, drop existing database

