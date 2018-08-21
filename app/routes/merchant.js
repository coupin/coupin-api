var passport = require('./../middleware/passport');

// Middleware
var auth = require('./../middleware/auth');
// Controllers
var MerchantCtrl = require('./../controllers/merchant');
var RewardCtrl = require('./../controllers/rewards');

module.exports = function(router) {
  router.route('/merchant')
    .get(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.read
    )
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      MerchantCtrl.markerInfo
    );
  
  router.route('/merchant/names')
    .get(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.getNames
    );

  router.route('/merchant/register')
    .post(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.adminCreate
    );

  router.route('/merchant/status/:status')
    .get(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.getByStatus
    );

  router.route('/merchant/:id/confirm')
    .get(
      MerchantCtrl.readById
    )
    .post(
      MerchantCtrl.confirm
    )
    .put(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.adminReview
    );

  router.route('/merchant/:query/search')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      MerchantCtrl.search
    );

  router.route('/merchant/:id/status')
    .put(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.statusUpdate
    );

  router.route('/merchant/:id/rewards')
    .get(
      auth.authenticate,
      auth.isAdmin,
      RewardCtrl.readByMerchant
    );

  router.route('/merchant/prime')
    .get(
      MerchantCtrl.retrieveHotList
    );

  router.route('/merchant/new')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      MerchantCtrl.notificationUpdates
    );

  router.route('/merchant/recent')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      MerchantCtrl.mostRecent
    );

  router.route('/merchant/:id')
    .delete(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.deleteOne
    )
    .get(
      auth.authenticate,
      auth.isMerchant,
      MerchantCtrl.readById
    )
    .put(
      auth.authenticate,
      auth.isMerchant,
      MerchantCtrl.update
    )
    .post(
      auth.authenticate,
      auth.isMerchant,
      MerchantCtrl.billing
    );
};
