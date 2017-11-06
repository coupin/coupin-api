const express = require('express');
const expressValidator = require('express-validator');
const emailer = require('../../config/email');
const router = express.Router();
const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');

// models and controllers
const Merchant = require('../models/users');
const MerchantCtrl = require('./../controllers/merchant');

router.route('/').get(MerchantCtrl.authRedirect)
.post(MerchantCtrl.populate);

// Get all merchants
router.route('/all')
  .get(MerchantCtrl.getAllMerchants);

// Signing in for a merchant
router.route('/authenticate')
  .get(auth.authenticate, MerchantCtrl.currentUser)
  .post(passport.verify, MerchantCtrl.authenticate, MerchantCtrl.authRedirect);

router.route('/:id')
  .put(auth.isMerchant, MerchantCtrl.update);

// To call the completion
router.route('/:id/confirm')
  .get(MerchantCtrl.getConfirmationPage)
  // Completion of merchant registration
  .post(MerchantCtrl.confirm)
  // For when the admin approves
  .put(MerchantCtrl.adminReview);

// Querying by Id
router.route('/:id/one')
  .get(MerchantCtrl.getOne)
  .delete(MerchantCtrl.deleteOne);

router.route('merchant/:query/search')
  .get(MerchantCtrl.search); 

// For Registration of merchants
router.route('/register')
  .post(MerchantCtrl.register)
  .get(MerchantCtrl.getRegPage);

module.exports = router;
