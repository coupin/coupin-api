const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();
const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');

//Controller
const authCtrl = require('./../controllers/auth');

router.route('/')
    .get(authCtrl.authRedirect);

router.route('/password')
    .post(auth.authenticate, authCtrl.changePassword);


// Signing in for a merchant
router.route('/signin/m')
  .post(passport.verify, authCtrl.signinMerchant);

module.exports = router;