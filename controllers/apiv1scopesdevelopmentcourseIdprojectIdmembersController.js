'use strict';

const varapiv1scopesdevelopmentcourseIdprojectIdmembersController = require('./apiv1scopesdevelopmentcourseIdprojectIdmembersControllerService');

module.exports.getMembers = function getMembers (req, res, next) {
  varapiv1scopesdevelopmentcourseIdprojectIdmembersController.getMembers(req.swagger.params, res, next);
};
