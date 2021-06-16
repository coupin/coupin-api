var auth = require('./../middleware/auth');
var coupinCtrl = require('./../controllers/coupin');
var paymentCtrl = require('./../controllers/payment');
var passport = require('../middleware/passport');

module.exports = function(router) {
  router.route('/coupin')
    .get(
      passport.verifyJWT1,
      coupinCtrl.read
    )
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      coupinCtrl.create
    );
  
  router.route('/coupin/:id/activate')
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      coupinCtrl.activate
    );
  
  router.route('/coupin/:id/redeem')
    .post(
      auth.authenticate,
      auth.isMerchant,
      coupinCtrl.redeem
    );

  router.route('/coupin/:pin/verify')
    .get(
      auth.authenticate,
      auth.isMerchant,
      coupinCtrl.verify
    );

  router.route('/coupin/payment/initiate')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      paymentCtrl.initializeCoupinPayment
    );
}