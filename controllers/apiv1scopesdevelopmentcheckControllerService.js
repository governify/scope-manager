'use strict';

const utils = require('./utils/utils');

module.exports.checkInfo = function checkInfo (req, res, next) {
  utils.checkInfoYml(req.scope.value).then(response => {
    utils.sendHelper(res, response);
  }).catch(err => {
    console.log(err);
    utils.sendHelper(err.message, 'error');
  });
};
