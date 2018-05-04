const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');
// Controllers
const MerchantCtrl = require('./../controllers/merchant');

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

  router.route('/merchant/:id')
    .delete(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.deleteOne
    )
    .get(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.readById
    )
    .put(
      auth.authenticate,
      auth.isMerchant,
      MerchantCtrl.update
    );

  router.route('/merchant/:id/confirm')
    .post(
      MerchantCtrl.confirm
    )
    .put(
      auth.authenticate,
      auth.isAdmin,
      MerchantCtrl.adminReview
    );

  router.route('/merchant/:query/search')
    .get(
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

  router.route('/merchant/hot')
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
};
