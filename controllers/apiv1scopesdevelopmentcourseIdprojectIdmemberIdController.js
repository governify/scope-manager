'use strict';

const varapiv1scopesdevelopmentcourseIdprojectIdmemberIdController = require('./apiv1scopesdevelopmentcourseIdprojectIdmemberIdControllerService');

module.exports.getMember = function getMember (req, res, next) {
  varapiv1scopesdevelopmentcourseIdprojectIdmemberIdController.getMember(req.swagger.params, res, next);
};
