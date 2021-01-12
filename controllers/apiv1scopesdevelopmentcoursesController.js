'use strict';

const varapiv1scopesdevelopmentcoursesController = require('./apiv1scopesdevelopmentcoursesControllerService');

module.exports.getCourses = function getCourses (req, res, next) {
  varapiv1scopesdevelopmentcoursesController.getCourses(req.swagger.params, res, next);
};
