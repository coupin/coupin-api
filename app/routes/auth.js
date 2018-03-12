const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');
//Controller
const authCtrl = require('./../controllers/auth');

module.exports = function(router) {
  router.route('/auth/password')
    .post(auth.authenticate, authCtrl.changePassword);

  router.route('/auth/register/c')
    // register new user
    .post(authCtrl.registerCustomer);

  router.route('/auth/signin/c')
    .post(passport.verify, authCtrl.signinCustomer);

  // Social Authentication
  router.route('/auth/signin/c/social')
    .post(passport.verifySocial, authCtrl.signinCustomer);

  // Signing in for a merchant
  router.route('/auth/signin/m')
    .post(passport.verify, authCtrl.signinMerchant);
};