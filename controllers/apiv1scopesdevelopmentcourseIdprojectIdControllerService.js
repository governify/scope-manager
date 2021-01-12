'use strict';

const utils = require('./utils/utils');

module.exports.getProject = function getProject (req, res, next) {
  let scope;

  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getProject(req.courseId.value, req.projectId.value);
  } else {
    scope = utils.getProjectUnauth(req.courseId.value, req.projectId.value);
  }

  utils.sendHelper(res, scope);
};
