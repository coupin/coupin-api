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
const Reward = require('./../models/reward');
const Customer = require('./../models/users');
const CustomerReward = require('./../models/customerRewards');
const auth = require('./../middleware/auth');


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


//

//The route to Get reward
router.route('/get/:id')
.get(function(req, res) {
  Reward.getRewardById(req.params.id, function(err, reward) {
    if (err)
      throw(err);

    res.json(reward);
  })
})

.put(function(req, res) {

  // use our reward model to find the bear we want
  Reward.getRewardById(req.params.Id, function(err, reward) {

    if (err)
    res.send(err);

    if (req.body.description)
    reward.description = req.body.description;  // update the rewards info
    if (req.body.merchantID)
    reward.merchantID = req.body.merchantID;
    if (req.body.location)
    reward.location =  req.body.location;
    if (req.body.categories)
    reward.categories = req.body.categories;
    if (req.body.startDate)
    reward.startDate = req.body.startDate;
    if (req.body.endDate)
    reward.endDate = req.body.endDate;
    if (req.body.multiple)
    reward.multiple = req.body.multiple;
    if (req.body.applicableDays)
    reward.applicableDays = req.body.applicableDays;
    if (req.body.address)
    reward.address = req.body.address;

    reward.modifiedDate = Date.now();

    // save the reward updateReward
    reward.save(function(err) {
      if (err)
      res.send(err);

      res.json({ message: 'Reward updated!' });
    });

  });
});

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
router.route('/merchant')
.get(auth.isMerchant, function(req, res) {
  const id = req.params.id || req.user._id;
  Reward.getRewardByMerchantId(id, function(err, reward) {
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
.post(auth.isMerchant, function(req, res) {


  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('description','Description field is required').notEmpty();
  req.checkBody('categories','Categories field is required').notEmpty();
  req.checkBody('multiple','The Multiple field is required').notEmpty();
  req.checkBody('startDate','Start Date field is required').notEmpty();
  req.checkBody('endDate','End Date field is required').notEmpty();
  req.checkBody('applicableDays','Applicable Days field is required').notEmpty();

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
    res.status(400).json({ message: errors });
  } else{
    // Get information of reward
    var newReward = {
      name : req.body.name,
      merchantID : req.user._id || req.body.merchantID,
      description :  req.body.description,
      categories : req.body.categories,
      startDate : req.body.startDate,
      endDate : req.body.endDate,
      picture : req.body.picture || 'default.png',
      multiple :  req.body.multiple,
      applicableDays : req.body.applicableDays,
      createdDate: Date.now(),
      isActive: true
    };

    // Create new reward
    var reward = new Reward(newReward);

    reward.save(function (err) {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(200).json({success: true, message: 'Reward created!' });
      }
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
