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

module.exports.createClass = function createClass (req, res, next) {
  let response;
  if (utils.isAuthorized(res.req.headers.authorization)) {
    response = utils.createClass(req);
    if (response === 201) {
      res.send({
        code: 201,
        message: 'Class added successfully'
      });
    }
    if (response === 400) {
      res.send({
        code: 400,
        message: 'Bad request'
      });
    }
    if (response === 500) {
      res.send({
        code: 500,
        message: 'Internal error'
      });
    }
    if (response === 409) {
      res.send({
        code: 409,
        message: 'Class id already exists'
      });
    }
  } else {
    res.send({
      code: 401,
      message: 'Unauthorized'
    });
  }
};
