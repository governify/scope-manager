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
module.exports.putCourse = function putCourse (req, res, next) {
  let response;
  if (utils.isAuthorized(res.req.headers.authorization)) {
    response = utils.putCourse(req.courseId.value, req.course_body.value);
    if (response === 200) {
      res.send({
        code: 200,
        message: 'Course updated successfully'
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
    if (response === 404) {
      res.send({
        code: 404,
        message: 'Course not found'
      });
    }
  } else {
    res.send({
      code: 401,
      message: 'Unauthorized'
    });
  }
};
