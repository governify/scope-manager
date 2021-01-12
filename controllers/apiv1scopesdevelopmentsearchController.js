'use strict';

const varapiv1scopesdevelopmentsearchController = require('./apiv1scopesdevelopmentsearchControllerService');

module.exports.searchScope = function searchScope (req, res, next) {
  varapiv1scopesdevelopmentsearchController.searchScope(req.swagger.params, res, next);
};
