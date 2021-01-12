'use strict';

const utils = require('./utils/utils');

module.exports.getCourse = function getCourse (req, res, next) {
  let scope;
  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getCourse(req.courseId.value);
  } else {
    scope = utils.getCourseUnauth(req.courseId.value);
  }

  utils.sendHelper(res, scope);
};
