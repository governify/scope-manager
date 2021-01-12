'use strict';

const utils = require('./utils/utils');

module.exports.searchScope = function searchScope (req, res, next) {
  if (utils.isAuthorized(res.req.headers.authorization)) {
    const scope = utils.searchScope(req.scope.value);
    utils.sendHelper(res, scope);
  } else {
    utils.sendHelper(res, 'error');
  }
};
