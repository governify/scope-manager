'use strict';

const utils = require('./utils/utils');
const logger = require('governify-commons').getLogger().tag('generate-scope');

module.exports.generateScope = function generateScope (req, res, next) {
  if (!res.req.body || JSON.stringify(res.req.body) === '{}') {
    utils.sendHelper2(res, 'Request body is empty', 400);
  } else {
    utils.generateScope(req.scope.value).then(response => {
      utils.sendHelper2(res, response, 200, 'projects');
    }).catch(err => {
      if (err.message === 'Course does not exist.') {
        utils.sendHelper2(res, 'Course does not exist', 403);
      } else {
        logger.error(err);
        utils.sendHelper2(res, 'Internal Server Error', 500);
      }
    });
  }
};
