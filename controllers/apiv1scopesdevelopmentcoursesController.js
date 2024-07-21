'use strict';

const varapiv1scopesdevelopmentcoursesController = require('./apiv1scopesdevelopmentcoursesControllerService');

module.exports.getCourses = function getCourses (req, res, next) {
  varapiv1scopesdevelopmentcoursesController.getCourses(req.swagger.params, res, next);
};

module.exports.createCourse = function createCourse (req, res, next) {
  varapiv1scopesdevelopmentcoursesController.createCourse(req.body, res, next);
};
