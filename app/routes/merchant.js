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

router.route('/').get(MerchantCtrl.authRedirect);

// Signing in for a merchant
router.route('/authenticate')
.get(auth.authenticate, MerchantCtrl.currentUser)
.post(passport.verify, MerchantCtrl.authenticate);

router.route('/all')
  .get(MerchantCtrl.getAllMerchants);

// For Registration of merchants
router.route('/register')
  .post(MerchantCtrl.register)
  .get(function(req, res) {
  // load the merchant registration page
  res.sendfile('./public/views/merchantReg.html');
});

// To handle getting merchants
router.route('/all')
.get(function(req, res) {
    Merchant.find({role : 2},function(err, merchant) {
        if (err)
            throw(err);

        res.json(merchant);
    });
});

router.route('/:id')
  .put(auth.isMerchant, MerchantCtrl.update);

// To call the completion
router.route('/:id/confirm').get(function(req, res) {
  // load the merchant registration page
  Merchant.findById(req.params.id, function(err, merchant){
    if(err)
      res.sendfile('./public/views/error.html');

    if('activated' in merchant && merchant.activated) {
      res.sendfile('./public/views/merchantReg.html');
    } else {
      res.sendfile('./public/views/merchantCon.html');
    }
  });
})
// Completion of merchant registration
.post(MerchantCtrl.confirm)
// For when the admin approves
.put(MerchantCtrl.adminReview);

// Querying by Id
router.route('/:id/one')
.get(function(req, res) {
  Merchant.findById(req.params.id, function(err, merchant) {
    if (err)
      throw(err);

    res.json(merchant);
  })
})
.delete(function(req, res) {
  Merchant.findByIdAndRemove(req.params.id, function(err, merchant) {
    if(err)
      throw err;

    res.send({message: 'Merchant Deleted'});
  })
});

module.exports = router;
