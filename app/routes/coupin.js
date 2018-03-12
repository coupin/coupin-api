const auth = require('./../middleware/auth');
const coupinCtrl = require('./../controllers/coupin');
const passport = require('../middleware/passport');

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
  
  router.route('/coupin/:pin/activate')
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
}