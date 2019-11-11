'use strict';
var passport = require('./../middleware/passport');

// Middleware
var auth = require('./../middleware/auth');
//Controller
var configCtrl = require('./../controllers/config');

module.exports = function(router) {
  router.route('/config')
    .get(configCtrl.getConfigData);

  router.route('/config/trial-status')
    .put(
      auth.authenticate,
      auth.isAdmin,
      configCtrl.toggleTrialPeriod
    );
};
