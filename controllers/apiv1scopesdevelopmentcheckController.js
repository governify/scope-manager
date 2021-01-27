'use strict';

const varapiv1scopesdevelopmentcheckController = require('./apiv1scopesdevelopmentcheckControllerService');

module.exports.checkInfo = function checkInfo (req, res, next) {
  varapiv1scopesdevelopmentcheckController.checkInfo(req.swagger.params, res, next);
};
