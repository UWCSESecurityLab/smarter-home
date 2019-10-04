FROM node:10

WORKDIR /app
ADD . /app

RUN npm install
RUN npm run build:web

EXPOSE 5000

ARG server_mode=dev
ARG node_env=development
ENV IS_DOCKER=true
ENV SERVER_MODE=${server_mode}
ENV NODE_ENV=${node_env}
CMD node server/smartapp.js