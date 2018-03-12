const passport = require('../middleware/passport');
// Reward Controller
const rewardCtrl = require('./../controllers/rewards');
// models
const Reward = require('./../models/reward');
const Customer = require('./../models/users');
const auth = require('./../middleware/auth');

module.exports = function(router) {
  //The route to create a reward for a merchant
  router.route('/reward')
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

  router.route('/reward/status/:id')
    .put(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.toggleStatus
    );
    
  router.route('/reward/:id')
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
