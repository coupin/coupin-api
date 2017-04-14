const express = require('express');
const expressValidator = require('express-validator');
const emailer = require('../../config/email');
const messages = require('../../config/messages');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// models
var Merchant = require('../models/merchant');


passport.serializeUser(function(merchant, done) {
  done(null, merchant.id);
});

passport.deserializeUser(function(id, done) {
  Merchant.getMerchantById(id, function(err, merchant) {
    done(err, merchant);
  });
});

passport.use('merchant-login', new LocalStrategy({
        usernameField : 'email',
        passwordField: 'password',
        passReqToCallback : true
    }, function(req, email, password, done){ 
    // Check to see if user exists
    Merchant.findOne({ 'email' : email }, function(err, user) {
      if(err) 
          return done(err);

      //If no user is found return the signupMessage
      if(!user) 
          return done(null, false, {success : false, message: "No such user exists"});

      if(!user.password)
        return done(null, false, {success : false, message: "You are yet to complete your registration"});

      // id user is found but password is wrong
      if(!user.isValidPassword(password))
          return done(null, false, {success : false, message: 'Wrong Password'});
      
      // if everything is okay
      if(user.activated) {
          return done(null, user);
      }

      return done(null, false, {success : false, message: 'User is currently inactive, please contact info@coupinapp.com'})
      
  });
}));


// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    next(); // make sure we go to the next routes and don't stop here
});


router.route('/merchant/login')
      .post(function(req, res) {
        console.log('inside');
  passport.authenticate('merchant-login',{
    successRedirect: '/admin/login'
  });
  // function(req, res) {
  //   console.log(req.body);
  //   // res.json(message, 'You are now logged in');
  // }
});

router.route('/merchant/register')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {

      var companyName = req.body.companyName;  // set the customer name (comes from the request)
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

          res.send({success: true, message: 'Success! Your request has now been made and we will get back to you within 24hours.'});
        });
    }

  }).get(function(req, res) {
  // load the merchant registration page
  res.sendfile('./public/views/merchantReg.html');
});

router.route('/merchant')
.get(function(req, res) {
    Merchant.find(function(err, merchant) {
        if (err)
            throw(err);

        res.json(merchant);
    });
}).delete(function(req, res) {
  Merchant.remove(function(err, merchant){
    if(err)
      throw err;

    res.send({message: 'Delete Successful'});
  });
});

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
.post(function(req, res){
  // get the data from the the 
    var address = req.body.address;
    var city = req.body.city;
    var password = req.body.password;
    var state = req.body.state;

    console.log(req.body);

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
}).put(function(req, res) {
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

      // on routes that end in /bears/:bear_id
      // ----------------------------------------------------
      router.route('/merchant/:id')

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
      // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
      .put(function(req, res) {

          // use our customer model to find the bear we want
          Merchant.findById(req.params.id, function(err, merchant) {

              if (err)
                  res.send(err);

              if (req.body.name)
                merchant.name = req.body.companyName;  // update the customers info
              if (req.body.email)
                merchant.email = req.body.email;
              if (req.body.address)
                merchant.address =  req.body.address;

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
