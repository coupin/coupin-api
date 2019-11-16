var passport = require('./../middleware/passport');

// Models
var User = require('../models/users');
// Middles ware
var auth = require('./../middleware/auth');

// Controllers
var AnalyticsCtrl = require('./../controllers/analytics');

module.exports = function(router) {
    router.route('/analytics/rewards')
      .get(
        auth.authenticate,
        auth.isMerchant,
        AnalyticsCtrl.getRewards
      );

    router.route('/analytics/get-stats')
      .get(
        auth.authenticate,
        auth.isMerchant,
        AnalyticsCtrl.getStats
      );

    router.route('/analytics/get-coupin-stats')
      .get(
        auth.authenticate,
        auth.isMerchant,
        AnalyticsCtrl.getOverallCoupinStat
      );

    router.route('/analytics/reward/:id/gender-distribution')
        .get(
          auth.authenticate,
          auth.isMerchant,
          AnalyticsCtrl.getRewardBookingGenderDistribution
        );

    router.route('/analytics/reward/:id/age-distribution')
        .get(
          auth.authenticate,
          auth.isMerchant,
          AnalyticsCtrl.getRewardBookingAgeDistribution
        )
};