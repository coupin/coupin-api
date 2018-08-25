var passport = require('../middleware/passport');
// Reward Controller
var rewardCtrl = require('./../controllers/rewards');
// models
var Reward = require('./../models/reward');
var Customer = require('./../models/users');
var auth = require('./../middleware/auth');

module.exports = function(router) {
  //The route to create a reward for a merchant
  router.route('/rewards')
    .get(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.read
    )
    .post(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.create
    );

  router.route('/rewards/requests')
    .get(
      auth.authenticate,
      auth.isAdmin,
      rewardCtrl.readByRequests
    )

  router.route('/rewards/status/:id')
    .put(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.toggleStatus
    ).post(
      auth.authenticate,
      auth.isAdmin,
      rewardCtrl.updateReview
    );

  router.route('/rewards/merchant/:id')
    .get(
      passport.verifyJWT1,
      auth.isCustomer,
      rewardCtrl.readByMerchant
    );
    
  router.route('/rewards/:id')
    .get(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.getOne
    )
    .delete(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.delete
    )
    .put(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.updateReward
    );
};
