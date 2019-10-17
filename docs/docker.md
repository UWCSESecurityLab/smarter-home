# Docker notes

SmarterHome production instances are run in a Docker container. It connects
to the Mongo docker cluster, using the same Docker network.

```
# Build the container. Copies source files from the smartapp directory, but
# installs its own node modules and builds its own dist bundles.
docker build -t dev --build-arg server_mode=dev --build-arg node_env=development .
docker build -t prod --build-arg server_mode=prod --build-arg node_env=production .

# Also run as an npm command:
npm run docker:build-dev
npm run docker:build-prod

# Run the container
# Caddy maps port 5000 to dev.kadara.cs.washington.edu and port 5001 to
# kadara.cs.washington.edu, specify port values accordingly
docker run --net my-mongo-cluster -p 5000:5000 dev
docker run --net my-mongo-cluster -p 5001:5000 prod

```
