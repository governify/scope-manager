'use strict';

const varapiv1scopesdevelopmentgenerateController = require('./apiv1scopesdevelopmentgenerateControllerService');

module.exports.generateScope = function generateScope (req, res, next) {
  varapiv1scopesdevelopmentgenerateController.generateScope(req.swagger.params, res, next);
};
