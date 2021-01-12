'use strict';

const utils = require('./utils/utils');

module.exports.getMember = function getMember (req, res, next) {
  let scope;

  if (utils.isAuthorized(res.req.headers.authorization)) {
    scope = utils.getMember(req.courseId.value, req.projectId.value, req.memberId.value);
  } else {
    scope = utils.getMemberUnauth(req.courseId.value, req.projectId.value, req.memberId.value);
  }

  utils.sendHelper(res, scope);
};
