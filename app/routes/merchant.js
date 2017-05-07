const express = require('express');
const expressValidator = require('express-validator');
const emailer = require('../../config/email');
const router = express.Router();
const passport = require('./../middleware/passport');

// models and controllers
const Merchant = require('../models/users');
const MerchantCtrl = require('./../controllers/merchant');

// Signing in for a merchant
router.route('/authenticate')
.post(passport.verify, MerchantCtrl.authenticate);
  // Used to validate sessions
  // .get(passport.verifyJWT, function(req, res){
  //   res.json({success: true, message: "Merchant token was validated"});
  // });

router.route('/home').get(function (req, res) {
  if (req.user) {
    if (req.user.role == 2) {
      res.sendfile('./public/views/MerchantIndex.html');
    } else {
      res.sendfile('./public/views/merchantReg.html');
    }
  } else {
    res.sendfile('./public/views/merchantReg.html');
  }
});

// For Registration of merchants
router.route('/register')
  .post(MerchantCtrl.register)
  .get(function(req, res) {
  // load the merchant registration page
  res.sendfile('./public/views/merchantReg.html');
});

// To handle getting merchants
router.route('/')
.get(function(req, res) {
    Merchant.find({role : 2},function(err, merchant) {
        if (err)
            throw(err);

        res.json(merchant);
    });
});

// To call the completion
router.route('/confirm/:id').get(function(req, res) {
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
router.route('/:id')
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
})
.put(MerchantCtrl.update);

module.exports = router;
