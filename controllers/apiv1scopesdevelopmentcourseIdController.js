'use strict';

const varapiv1scopesdevelopmentcourseIdController = require('./apiv1scopesdevelopmentcourseIdControllerService');

module.exports.getCourse = function getCourse (req, res, next) {
  varapiv1scopesdevelopmentcourseIdController.getCourse(req.swagger.params, res, next);
};
