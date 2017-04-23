const express = require('express');
const expressValidator = require('express-validator');
const emailer = require('../../config/email');
const messages = require('../../config/messages');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'coupinappmerchant';

// models
var Merchant = require('../models/merchant');


passport.serializeUser(function(merchant, done) {
  done(null, merchant.id);
});

passport.deserializeUser(function(id, done) {
  Merchant.findById(id, function(err, merchant) {
    done(err, merchant);
  });
});

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    next(); // make sure we go to the next routes and don't stop here
});

// Signing in for a merchant
router.route('/authenticate')
.post(function(req, res) {
    // Validate request
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    // Get errors if any
    var errors = req.validationErrors();

    if(errors){
      res.status(401).json({success: false, message: errors});
    } else {
      var email = req.body.email;
      var password = req.body.password;

      // Find merchant with email
      Merchant.findOne({'email': email}, function(err, merchant) {
        if (err)
          throw err;

        // Check if merchant exists
        if(!merchant)
          res.json({success: false, message: 'Authentication failed. Merchant not found'})

        // Check if password exists
        if(merchant.isValid(password)) {
          var payload = {id: merchant.id, name: merchant.companyName, email: merchant.email};
          var token = jwt.sign(payload, jwtOptions.secretOrKey);

          //var token = jwt.sign(customer, secretKey, {
          //  expiresInMinutes: 1440
          //});

          res.json({
            success: true,
            message: 'Here is your Merchant token',
            token: token
          });
        } else {
          res.status(401).json({success: false, message: "Invalid Password"});
        }
      });
    }
  })
  // Used to validate sessions
  .get(passport.authenticate('jwt-1',{session: false}), function(req, res){
    res.json({success: true, message: "Merchant token was validated"});
  });

// For Registration of merchants
router.route('/merchant/register')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {

      // Get merchant details
      var companyName = req.body.companyName;
      var email = req.body.email;
      var mobileNumber = req.body.mobileNumber;
      var companyDetails = req.body.companyDetails;




      // Form Validator
      req.checkBody('companyName','Company Name field is required').notEmpty();
      req.checkBody('email','Email field is required').isEmail();
      req.checkBody('mobileNumber', 'Mobile number cannot be empty').notEmpty();
      req.checkBody('companyDetails', 'Company Details field is required').notEmpty();

      // Check Errors
      var errors = req.validationErrors();

      if(errors) {
        res.send({success: false, message: errors });
      } else {
        var createdDate = Date.now();
        var merchant = new Merchant();      // create a new instance of the Customer model
          merchant.companyName = companyName;
          merchant.email = email;
          merchant.mobileNumber = mobileNumber;
          merchant.companyDetails = companyDetails;
          merchant.createdDate = createdDate;

        merchant.save(function(err) {
          console.log(err);
          if(err)
            throw err;

          res.send({
            success: true,
            message: 'Success! Your request has now been made and we will get back to you within 24hours.'});
        });
    }

  }).get(function(req, res) {
  // load the merchant registration page
  res.sendfile('./public/views/merchantReg.html');
});

// To handle getting merchants
router.route('/merchant')
.get(function(req, res) {
    Merchant.find(function(err, merchant) {
        if (err)
            throw(err);

        res.json(merchant);
    });
});

// To call the completion
router.route('/merchant/confirm/:id').get(function(req, res) {
  // load the merchant registration page
  Merchant.findById(req.params.id, function(err, merchant){
    if(err)
      res.sendfile('./public/views/error.html');

    if(merchant.activated) {
      res.sendfile('./public/views/merchantReg.html');
    } else {
      res.sendfile('./public/views/merchantCon.html');
    }
  });
})
// Completion of merchant registration
.post(function(req, res){
  // get the data from the the
    var address = req.body.address;
    var city = req.body.city;
    var password = req.body.password;
    var state = req.body.state;

    // Form Validator
    req.checkBody('address','Address field is required').notEmpty();
    req.checkBody('password','Password field is required').notEmpty();
    req.checkBody('password2', 'Please confirm password').notEmpty();
    req.checkBody('password2', 'Passwords are not the same').equals(req.body.password);
    req.checkBody('city', 'City field is required').notEmpty();
    req.checkBody('state', 'State field is required').notEmpty();

    var errors = req.validationErrors();

    if(errors) {
      res.send({success: false, message: errors});
    } else {
      Merchant.findById(req.params.id, function(err, merchant){
        if(err)
          throw err;

          merchant.address = address;
          merchant.password = Merchant.schema.methods.encryptPassword(password);
          merchant.city = city;
          merchant.state = state;
          merchant.activated = true;
          merchant.isPending = false;
          merchant.rejected = false;

          merchant.save(function(err) {
            if(err)
              throw err;

            res.send({success: true, message: 'You have been confirmed!'});
          });
      });
    }
})
// For when the admin approves
.put(function(req, res) {
  var decision = req.body;

  Merchant.findById(req.params.id, function(err, merchant){
    if(err)
      throw err;

    if(Object.keys(decision).length === 0) {
      // set isPending to true and save
      if(merchant.isPending) {
        res.send({success: false, message: 'User is already pending.'});
      } else {
        merchant.isPending = true;
        merchant.save(function(err) {
          if(err)
            throw(err);

          emailer.sendEmail(merchant.email, 'Registration Approved', messages.approved(merchant._id), function(response) {
            res.send({success: true, rejected: false, message: 'Merchant Aprroved and email sent to ' + merchant.companyName});
          });
        });
      }

    } else {
      // set rejected to true and save the reason
      merchant.rejected = true;
      merchant.reason = decision.details;
      merchant.save(function(err) {
        if(err)
          throw err;

        res.send({success: true, rejected: true, message: 'Merchant declined and email sent to ' + merchant.companyName});
      });
    }
  });

});

// Querying by Id
router.route('/merchant/:id')
.get(function(req, res) {
  Merchant.findById(req.params.id, function(err, merchant) {
    if (err)
      throw(err);

    res.json(merchant);
  })
})
// .delete(function(req, res) {
//   Merchant.findByIdAndRemove(req.params.id, function(err, merchant) {
//     if(err)
//       throw err;

//     res.send({message: 'Merchant Deleted'});
//   })
// })
// update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
.put(function(req, res) {

    // use our customer model to find the bear we want
    Merchant.findById(req.params.id, function(err, merchant) {

        if (err)
            res.send(err);

        if (req.body.mobileNumber)
          merchant.mobileNumber = req.body.mobileNumber;  // update the customers info
        if (req.body.email)
          merchant.email = req.body.email;
        if (req.body.address)
          merchant.address =  req.body.address;
        if (req.body.city)
          merchant.city = req.body.city;
        if (req.body.state)
          merchant.state =  req.body.state;

        merchant.modifiedDate = Date.now();

        // save the customer updateCustomer
        merchant.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Merchant updated!' });
        });

    });
});

module.exports = router;
