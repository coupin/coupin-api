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
      rewardCtrl.readM
    )
    .post(
      auth.authenticate,
      auth.isMerchant,
      rewardCtrl.create
    );

  // Route to activate a reward
  router.route('/reward/activate/:id')
  .post (auth.isMerchant, rewardCtrl.activate);

  // Route to deactivate a reward
  router.route('/reward/deactivate/:id')
    .post(auth.isMerchant, rewardCtrl.deactivate);

  router.route('/reward/all')
    .get(auth.isAdmin, rewardCtrl.getAll);

  //The route to Get rewards for a customer
  router.route('/reward/customer/:customerId')
    .get(function(req, res) {
    Reward.getRewardByCustomerId(req.params.customerId, function(err, reward) {
      if (err)
        throw(err);

      res.json(reward);
    });
  });

  //The route to Get rewards under a merchant
  router.route('/reward/merchant')
    .get(auth.isMerchant, function(req, res) {
      const id = req.params.id || req.user._id;

      Reward.getRewardByMerchantId(id, function(err, rewards) {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).json(reward);
        }
      })
    })

  //The route to Get rewards for a category
  router.route('/reward/category/:category')
  .get(function(req, res) {
    Reward.getRewardByCategoryId(req.params.category, function(err, reward) {
      if (err)
        throw(err);

      res.json(reward);
    });
  })

  // Being Used on Mobile

  //The route to Get reward
  router.route('/reward/:id')
    .get(rewardCtrl.getOne)
    .post(rewardCtrl.delete)
    .put(rewardCtrl.updateReward);

  router.route('/reward/coupin')
      .get(passport.verifyJWT1, rewardCtrl.getBookings);

  router.route('/reward/me/later')
      .post(passport.verifyJWT1, rewardCtrl.save);

  router.route('/reward/temp')
      .get(rewardCtrl.testdelete);
};
