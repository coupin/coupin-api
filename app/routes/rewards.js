var express = require('express');
var expressValidator = require('express-validator');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
//var db = require('../../config/db').module;
// models
var Reward = require('../models/reward');
var Customer = require('../models/customer');
var CustomerReward = require('../models/customerRewards');


passport.serializeUser(function(reward, done) {
  done(null, Reward.id);
});

passport.deserializeUser(function(id, done) {
  Reward.getRewardById(id, function(err, reward) {
    done(err, reward);
  });
});



// middleware to use for all requests
router.use(function(req, res, next) {
  // do logging
  next(); // make sure we go to the next routes and don't stop here
});

router.route('/')

.get(passport.authenticate('jwt-2',{session: false}), function(req, res){
  //var customer = req.customer;
  console.log("Customer: " + req.body.customer);
  //res.json(customer);
  res.send(req.body);
});


// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/:mobileNumber')

.get(function(req, res){
  Reward.getRewardById(req.params.mobileNumber, function(err, reward){
    if (err)
    res.send(err);
    res.json(reward);
  })
})

// update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
.put(function(req, res) {

  // use our reward model to find the bear we want
  Reward.getRewardByNumber(req.params.mobileNumber, function(err, reward) {

    if (err)
    res.send(err);

    if (req.body.name)
    reward.name = req.body.name;  // update the rewards info
    if (req.body.email)
    reward.email = req.body.email;
    if (req.body.address)
    reward.address =  req.body.address;
    if (req.body.dateOfBirth)
    reward.dateOfBirth = req.body.dateOfBirth;

    reward.modifiedDate = Date.now();

    // save the reward updateReward
    reward.save(function(err) {
      if (err)
      res.send(err);

      res.json({ message: 'Reward updated!' });
    });

  });
});

//The route to Get all rewards
//The route to Get reward
router.route('/:id')
.get(function(req, res) {
  Reward.getRewardById(req.params.id, function(err, reward) {
    if (err)
      throw(err);

    res.json(reward);
  })
})
//The route to Get rewards for a customer
router.route('/customer/:customerId')
.get(function(req, res) {
  Reward.getRewardByCustomerId(req.params.customerId, function(err, reward) {
    if (err)
      throw(err);

    res.json(reward);
  })
})
//The route to Get rewards under a merchant
router.route('/merchant/:merchantId')
.get(function(req, res) {
  Reward.getRewardByMerchantId(req.params.merchantId, function(err, reward) {
    if (err)
      throw(err);

    res.json(reward);
  })
})
//The route to Get rewards for a category
router.route('/category/:category')
.get(function(req, res) {
  Reward.getRewardByCategoryId(req.params.category, function(err, reward) {
    if (err)
      throw(err);

    res.json(reward);
  })
})

//The route to create a reward for a merchant
router.route('/')
.post(function(req, res) {

  // Get information of reward
  var name = req.body.name;
  var merchantID = req.body.merchantID;
  var location =  req.body.location;
  var categories = req.body.categories;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var multiple =  req.body.multiple;
  var applicableDays = req.body.applicableDays;


  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('merchantID','Merchant ID field is required').notEmpty();
  req.checkBody('location','Location field is required').notEmpty();
  req.checkBody('categories','Categories field is required').notEmpty();
  req.checkBody('multiple','The Multiple field is required').notEmpty();
  req.checkBody('applicableDays','Applicable Days field is required').notEmpty();

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
    res.json({ message: errors });
  } else{
    // Create new reward
    var reward = new Reward({
       name : name,
       merchantID : merchantID,
       location : location,
       categories : categories,
       startDate : startDate,
       endDate : endDate,
       multiple : multiple,
       applicableDays : applicableDays,
      createdDate: Date.now(),
      isActive: true
    });

    Reward.createReward(reward, function(err, newReward){
      if(err)
        throw err;

      res.json({success: true, message: 'Reward created!' });
    });
  };
});


//The route to add reward to a customer
router.route('/customer/')
// register new user
.post(function(req, res) {

  // Get information on customer
  var token = req.body.token;
  var customerId = req.body.customerId;

  // Form Validator
  req.checkBody('token','Token field is required').notEmpty();
  req.checkBody('customerId','Customer ID field is required').notEmpty();
  // Check Errors
  var errors = req.validationErrors();

  if(errors){
    res.json({ message: errors });
  } else{
    // Create new user
    var reward = new CustomerReward({
       token : token,
       customerId : customerId
    });

    CustomerReward.createCustomerRewards(reward, function(err, newCustomerReward){
      if(err)
        throw err;

      res.json({success: true, message: 'Customer reward has been successfuly added!' });
    });
  };
});


module.exports = router;
