var express = require('express');
var expressValidator = require('express-validator');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// models
var Customer = require('../models/customer');

passport.serializeUser(function(customer, done) {
  done(null, customer.id);
});

passport.deserializeUser(function(id, done) {
  Customer.findById(id, function(err, customer) {
    done(err, customer);
  });
});

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'coupinappcustomer'; 

// middleware to use for all requests
router.use(function(req, res, next) {
  // do logging
  next(); // make sure we go to the next routes and don't stop here
});

router.route('/authenticate')
.post(function(req, res) {
  // Validate request
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  // Get errors if any
  var errors = req.validationErrors();

  if(!errors){
    var email = req.body.email;
    var password = req.body.password;

    var customer = Customer.findOne({
      'email': email
    }, function(err, customer) {
      if (err) 
        throw err;

      if(!customer)
        res.json({success: false, message: 'Authentication failed. Customer not found'});

      if(customer) {
      //Check password
      Customer.comparePassword(password, customer.password, function(err, isMatch){
        if(err) 
          return done(err);
        
        if(!isMatch) {
          res.status(401).json({success: false, message:"Invalid Password"});
        } else {
          var payload = {id: customer.id, name: customer.name, email: customer.email, mobileNumber: customer.mobileNumber};
          var token = jwt.sign(payload, jwtOptions.secretOrKey);

          //var token = jwt.sign(customer, secretKey, {
          //  expiresInMinutes: 1440
          //});

          res.json({
            success: true,
            message: 'Here is your token',
            token: token
          });
        }
      });
    }
  });
  }
  else{
    res.status(401).json({success: false, message: errors});
  }
})
// To authenticate token
.get(passport.authenticate('jwt-2',{session: false}), function(req, res){
  res.json({success: true});
});


router.route('/register')
// register new user
.post(function(req, res) {

  // Get information on customer
  var name = req.body.name;  
  var email = req.body.email;
  var network =  req.body.network;
  var password = req.body.password;
  var password2 = req.body.password2;


  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').isEmail();
  req.checkBody('network','Network is required').notEmpty();
  req.checkBody('password','Password field is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
    res.json({success: false, message: errors });
  } else{
    // Create new user
    var customer = new Customer({
      name: name,
      email: email,
      network: network,
      password: password,
      createdDate: Date.now()
    });

    Customer.createCustomer(customer, function(err, newCustomer){
      if(err) 
        throw err;

      res.json({success: true, message: 'Customer created!' });
    });
  };
});

// Get customer by mobile number
router.route('/:mobileNumber')
.get(function(req, res){
  Customer.findOne({'info.mobileNumber': req.params.mobileNumber}, function(err, customer){
    if (err)
      throw err;

    res.json(customer);
  })
})

// Used to edit the customer
.put(function(req, res) {
  // use our customer model to find the bear we want
  Customer.findOne({'info.mobileNumber': req.params.mobileNumber}, function(err, customer) {

    if (err)
     throw err;

    if (req.body.name)
    customer.name = req.body.name; 

    if (req.body.email)
    customer.email = req.body.email;

    if (req.body.address)
    customer.address =  req.body.address;

    if (req.body.state)
    customer.state =  req.body.state;

    if (req.body.city)
    customer.city =  req.body.city;

    customer.modifiedDate = Date.now();

    // save the customer updateCustomer
    customer.save(function(err) {
      if (err)
        throw err;

      res.json({success: true,  message: 'Customer updated!' });
    });

  });
});

module.exports = router;
