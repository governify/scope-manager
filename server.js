'use strict';

const deploy = (env, commonsMiddleware) => {
  return new Promise((resolve, reject) => {
    try {
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
      app.use('/commons', commonsMiddleware);

      const oasTools = require('oas-tools');
      const jsyaml = require('js-yaml');
      const serverPort = process.env.PORT || 5700;

      const spec = fs.readFileSync(path.join(__dirname, '/api/oas-doc.yaml'), 'utf8');
      const oasDoc = jsyaml.safeLoad(spec);

      const optionsObject = {
        controllers: path.join(__dirname, './controllers'),
        loglevel: env === 'test' ? 'error' : 'info',
        strict: false,
        router: true,
        validator: true
      };

      oasTools.configure(optionsObject);

      oasTools.initialize(oasDoc, app, function () {
        http.createServer(app).listen(serverPort, function () {
          if (env !== 'test') {
            console.log('App running at http://localhost:' + serverPort);
            console.log('________________________________________________________________');
            if (optionsObject.docs !== false) {
              console.log('API docs (Swagger UI) available on http://localhost:' + serverPort + '/docs');
              console.log('________________________________________________________________');
            }
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
    } catch (err) {
      reject(err);
    }
  });
};

const undeploy = () => {
  process.exit();
};

module.exports = {
  deploy: deploy,
  undeploy: undeploy
};
