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
var Customer = require('../models/customer');

passport.serializeUser(function(customer, done) {
  done(null, customer.id);
});

passport.deserializeUser(function(id, done) {
  Customer.getCustomerById(id, function(err, customer) {
    done(err, customer);
  });
});

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'coupinappcustomer';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
Customer.getCustomerByEmail(jwt_payload.email, function(err, customer) {
    if (err) throw err;
    if (customer) {
      next(null, customer);
    } else {
      next(null, false,{message: 'Unknown Customer'});
    }
});

});

passport.use(strategy);


// middleware to use for all requests
router.use(function(req, res, next) {
  // do logging
  next(); // make sure we go to the next routes and don't stop here
});

router.route('/authenticate')
.post(function(req, res) {

  if(req.body.email && req.body.password){
    var email = req.body.email;
    var password = req.body.password;

    var customer = Customer.getCustomerByEmail(email, function(err, customer) {
      if (err) throw err;

      if(!customer){
      res.json({success: false, message: 'Authentication failed. Customer not found'})
    }
      else if (customer){

      //Check password
      Customer.comparePassword(password, customer.password, function(err, isMatch){
        if(err) return done(err);
        if(!isMatch){
          res.status(401).json({message:"Invalid Password"});
        } else {
          var payload = {id: customer.id, name: customer.name, email: customer.email};
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
  res.status(401).json({message: 'Please enter your username and password'});
}
})

.get(passport.authenticate('jwt',{session: false}), function(req, res){
  res.json("Success! You have used a token for this");
});


router.route('/register')

// create a bear (accessed at POST http://localhost:8080/api/bears)
.post(function(req, res) {


  var name = req.body.name;  // set the customer name (comes from the request)
  var email = req.body.email;
  var mobileNumber =  req.body.mobileNumber;
  var password = req.body.password;
  var password2 = req.body.password2;
  var address = req.body.address;
  var dateOfBirth = req.body.dateOfBirth;


  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').isEmail();
  req.checkBody('mobileNumber','mobileNumber is not valid').notEmpty().isInt();
  req.checkBody('password','Password field is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
    res.json({ message: errors });
  } else{
    var customer = new Customer({      // create a new instance of the Customer model
      name: name,
      email: email,
      mobileNumber: mobileNumber,
      password: password,
      address: address,
      dateOfBirth: dateOfBirth,
      createdDate: Date.now
    });

    Customer.createCustomer(customer, function(err, newCustomer){
      if(err) throw err;
      res.json({ message: 'Customer created!' });
    });

  };

});

router.route('/')
.get(passport.authenticate('bearer', { session: false }),function(req, res) {
  Customer.find(function(err, customer) {
    if (err)
    res.send(err);

    res.json(customer);
  });
});

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/:mobileNumber')

.get(function(req, res){
  Customer.getCustomerByNumber(req.params.mobileNumber, function(err, customer){
    if (err)
    res.send(err);
    res.json(customer);
  })
})

// update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
.put(function(req, res) {

  // use our customer model to find the bear we want
  Customer.getCustomerByNumber(req.params.mobileNumber, function(err, customer) {

    if (err)
    res.send(err);

    if (req.body.name)
    customer.name = req.body.name;  // update the customers info
    if (req.body.email)
    customer.email = req.body.email;
    if (req.body.address)
    customer.address =  req.body.address;
    if (req.body.dateOfBirth)
    customer.dateOfBirth = req.body.dateOfBirth;

    customer.modifiedDate = Date.now();

    // save the customer updateCustomer
    customer.save(function(err) {
      if (err)
      res.send(err);

      res.json({ message: 'Customer updated!' });
    });

  });
});

module.exports = router;
