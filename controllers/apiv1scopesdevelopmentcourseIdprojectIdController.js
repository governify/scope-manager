'use strict';

const varapiv1scopesdevelopmentcourseIdprojectIdController = require('./apiv1scopesdevelopmentcourseIdprojectIdControllerService');

module.exports.getProject = function getProject (req, res, next) {
  varapiv1scopesdevelopmentcourseIdprojectIdController.getProject(req.swagger.params, res, next);
};
