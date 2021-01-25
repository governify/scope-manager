'use strict';

const utils = require('./utils/utils');

module.exports.generateScope = function generateScope (req, res, next) {
  utils.generateScope(req.scope.value).then(scope => {
    utils.sendHelper(res, scope);
  }).catch(err => {
    utils.sendHelper(err.message, 'error');
  });
};
