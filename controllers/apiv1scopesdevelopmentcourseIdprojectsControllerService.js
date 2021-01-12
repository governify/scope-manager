'use strict';

const utils = require('./utils/utils');

module.exports.getProjects = function getProjects (req, res, next) {
  let scope;

  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getProjects(req.courseId.value);
  } else {
    scope = utils.getProjectsUnauth(req.courseId.value);
  }

  utils.sendHelper(res, scope);
};
