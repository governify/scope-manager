'use strict';

const utils = require('./utils/utils');

module.exports.getMembers = function getMembers (req, res, next) {
  let scope;

  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getMembers(req.courseId.value, req.projectId.value);
  } else {
    scope = utils.getMembersUnauth(req.courseId.value, req.projectId.value);
  }

  utils.sendHelper(res, scope);
};
