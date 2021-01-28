'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json({
  strict: false
}));

const oasTools = require('oas-tools');
const jsyaml = require('js-yaml');
const serverPort = process.env.PORT || 8082;

const spec = fs.readFileSync(path.join(__dirname, '/api/oas-doc.yaml'), 'utf8');
const oasDoc = jsyaml.safeLoad(spec);

const optionsObject = {
  controllers: path.join(__dirname, './controllers'),
  loglevel: 'info',
  strict: false,
  router: true,
  validator: true
};

oasTools.configure(optionsObject);

oasTools.initialize(oasDoc, app, function () {
  http.createServer(app).listen(serverPort, function () {
    console.log('App running at http://localhost:' + serverPort);
    console.log('________________________________________________________________');
    if (optionsObject.docs !== false) {
      console.log('API docs (Swagger UI) available on http://localhost:' + serverPort + '/docs');
      console.log('________________________________________________________________');
    }
  });
});

app.get('/info', function (req, res) {
  res.send({
    info: 'This API was generated using oas-generator!',
    name: oasDoc.info.title
  });
});

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', function onSigint () {
  console.log('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
  process.exit();
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm () {
  console.log('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
  process.exit();
});
