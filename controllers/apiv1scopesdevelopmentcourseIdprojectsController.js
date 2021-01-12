'use strict';

const varapiv1scopesdevelopmentcourseIdprojectsController = require('./apiv1scopesdevelopmentcourseIdprojectsControllerService');

module.exports.getProjects = function getProjects (req, res, next) {
  varapiv1scopesdevelopmentcourseIdprojectsController.getProjects(req.swagger.params, res, next);
};
