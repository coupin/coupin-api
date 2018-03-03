const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');
// Controllers
const MerchantCtrl = require('./../controllers/merchant');

module.exports = function(router) {
  router.route('/merchant')
    // .post(MerchantCtrl.populate)
    .post(MerchantCtrl.markerInfo);

  // Get all merchants
  router.route('/merchant/all')
    .get(MerchantCtrl.getAllMerchants);

  // For Registration of merchants
  router.route('/merchant/register')
    .post(MerchantCtrl.register)
    .get(MerchantCtrl.getRegPage);

  router.route('/merchant/:id')
    .post(MerchantCtrl.deleteOne)
    .put(auth.authenticate, auth.isMerchant, MerchantCtrl.update);

  // To call the completion
  router.route('/merchant/:id/confirm')
    .get(MerchantCtrl.getConfirmationPage)
    // Completion of merchant registration
    .post(MerchantCtrl.confirm)
    // For when the admin approves
    .put(MerchantCtrl.adminReview);

  // Querying by Id
  router.route('/merchant/:id/one')
    .get(MerchantCtrl.getOne)
    .delete(MerchantCtrl.deleteOne);

  router.route('/merchant/:query/search')
    .get(MerchantCtrl.search);

  router.route('/merchant/hot')
    .get(MerchantCtrl.retrieveHotList);

  router.route('/merchant/new')
    .post(passport.verifyJWT1, MerchantCtrl.notificationUpdates);

  router.route('/merchant/recent')
    .post(passport.verifyJWT1, MerchantCtrl.mostRecent);

  router.route('/merchant/search')
    .post(MerchantCtrl.search); 
};
