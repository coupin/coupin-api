var express = require('express');
var expressValidator = require('express-validator');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

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

passport.use(new LocalStrategy(function(email, password, done){
  Merchant.getMerchantByEmail(email, function(err, merchant){
    if(err) throw err;
    if(!merchant){
      return done(null, false, {message: 'Unknown Merchant'});
    }

    Merchant.comparePassword(password, merchant.password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, merchant);
      } else {
        return done(null, false, {message:'Invalid Password'});
      }
    });
  });
}));

  // middleware to use for all requests
  router.use(function(req, res, next) {
      // do logging
      console.log('Something is happening.');
      next(); // make sure we go to the next routes and don't stop here
  });


  router.route('/merchant/login')
        .post(function(req, res) {
    passport.authenticate('local',{}),
    function(req, res) {
     res.json(message, 'You are now logged in');
    }
  });

  router.route('/merchant/register')

      // create a bear (accessed at POST http://localhost:8080/api/bears)
      .post(function(req, res) {
        console.log('Inside the merch post');


        var companyName = req.body.companyName;  // set the customer name (comes from the request)
        var email = req.body.email;
        var companyDetails = req.body.companyDetails;
        // var mobileNumber =  req.body.mobileNumber;
        // var password = req.body.password;
        // var password2 = req.body.password2;
        // var address = req.body.address;




        // Form Validator
        req.checkBody('companyName','Company Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        req.checkBody('companyDetails', 'Company Details field is required').notEmpty();
        // req.checkBody('mobileNumber','mobileNumber is not valid').notEmpty().isInt();
        // req.checkBody('password','Password field is required').notEmpty();
        // req.checkBody('password2','Passwords do not match').equals(req.body.password);

        console.log('Inside 1');
        // Check Errors
        var errors = req.validationErrors();

        // console.log('Inside 2');
        if(errors) {
          // console.log('Inside 3');
        	res.json({success: false, message: errors });
        } else {
          console.log('Inside 4');
          var createdDate = Date.now();
          console.log(createdDate);
        	var merchant = new Merchant();      // create a new instance of the Customer model
            merchant.companyName = companyName;
            merchant.email = email;
            merchant.companyDetails = companyDetails;
            merchant.createdDate = createdDate;
          // console.log(merchant);

          Merchant.find({}, function(err, merchant){
            console.log(err);
            console.log(merchant);
          });
          // merchant.save(function(err) {
          //   console.log("inside save");
          //   console.log(err);
          //   if(err)
          //     throw err;

          //   res.send({success: true, message: 'Merchant Created!'});
          // });
          // Merchant.createMerchant(merchant, function(err, newMerchant){
          //   if(err) throw err;
          //   res.json({ success: true, message: 'Merchant created!' });
          // });

      }

    }).get(function(req, res) {
      // load the merchant registration page
      res.sendfile('./public/views/merchantReg.html');
    });

router.route('/merchant')
      .get(function(req, res) {
          Merchant.find(function(err, merchant) {
              if (err)
                  res.send(err);

              res.json(merchant);
          });
      });

      // on routes that end in /bears/:bear_id
      // ----------------------------------------------------
      router.route('/merchant/:Id')

      .get(function(req, res){
        Merchant.getMerchantById(req.params.Id, function(err, merchant){
          if (err)
            res.send(err);
          res.json(merchant);
        })
      })

      // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
      .put(function(req, res) {

          // use our customer model to find the bear we want
          Merchant.getMerchantById(req.params.Id, function(err, merchant) {

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
