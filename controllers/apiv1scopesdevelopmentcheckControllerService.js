'use strict';

const utils = require('./utils/utils');
const logger = require('governify-commons').getLogger().tag('check-info');

module.exports.checkInfo = function checkInfo (req, res, next) {
  if (!res.req.body || JSON.stringify(res.req.body) === '{}') {
    utils.sendHelper2(res, 'Request body is empty', 400);
  } else {
    utils.checkInfoYml(req.scope.value).then(response => {
      utils.sendHelper2(res, response, 200, 'projects');
    }).catch(err => {
      logger.error(err);
      utils.sendHelper2(res, 'Internal Server Error', 500);
    });
  }
};
