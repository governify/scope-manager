'use strict';

const utils = require('./utils/utils');

module.exports.getCourses = function getCourses (req, res, next) {
  let scope;

  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getCourses();
  } else {
    scope = utils.getCoursesUnauth();
  }

  utils.sendHelper(res, scope);
};
