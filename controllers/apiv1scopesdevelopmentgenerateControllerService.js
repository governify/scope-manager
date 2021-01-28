'use strict';

const utils = require('./utils/utils');

module.exports.generateScope = function generateScope (req, res, next) {
  if (!res.req.body || JSON.stringify(res.req.body) === '{}') {
    utils.sendHelper2(res, 'Request body is empty', 400);
  } else {
    utils.generateScope(req.scope.value).then(response => {
      utils.sendHelper2(res, response, 200);
    }).catch(err => {
      console.log(err);
      utils.sendHelper2(res, 'Internal Server Error', 500);
    });
  }
};
