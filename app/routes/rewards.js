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


//router.route('/register')

// create a bear (accessed at POST http://localhost:8080/api/bears)
// .post(function(req, res) {
//
//
//   var name = req.body.name;  // set the reward name (comes from the request)
//   var email = req.body.email;
//   var mobileNumber =  req.body.mobileNumber;
//   var password = req.body.password;
//   var password2 = req.body.password2;
//   var address = req.body.address;
//   var dateOfBirth = req.body.dateOfBirth;
//
//
//   // Form Validator
//   req.checkBody('name','Name field is required').notEmpty();
//   req.checkBody('email','Email field is required').isEmail();
//   req.checkBody('mobileNumber','mobileNumber is not valid').notEmpty().isInt();
//   req.checkBody('password','Password field is required').notEmpty();
//   req.checkBody('password2','Passwords do not match').equals(req.body.password);
//
//   // Check Errors
//   var errors = req.validationErrors();
//
//   if(errors){
//     res.json({ message: errors });
//   } else{
//     var reward = new Reward({      // create a new instance of the Reward model
//       name: name,
//       email: email,
//       mobileNumber: mobileNumber,
//       password: password,
//       address: address,
//       dateOfBirth: dateOfBirth,
//       createdDate: Date.now
//     });
//
//     Reward.createReward(reward, function(err, newReward){
//       if(err) throw err;
//       res.json({ message: 'Reward created!' });
//     });
//
//   };
//
// });
//
// router.route('/')
// .get(passport.authenticate('bearer', { session: false }),function(req, res) {
//   Reward.find(function(err, reward) {
//     if (err)
//     res.send(err);
//
//     res.json(reward);
//   });
// });

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/:mobileNumber')

.get(function(req, res){
  Reward.getRewardByNumber(req.params.mobileNumber, function(err, reward){
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

module.exports = router;
