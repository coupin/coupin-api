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
var Merchant = require('../models/merchant');


passport.serializeUser(function(merchant, done) {
  done(null, merchant.id);
});

passport.deserializeUser(function(id, done) {
  Merchant.getMerchantById(id, function(err, merchant) {
    done(err, merchant);
  });
});


var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'c0upinAppM3rchAn+';

var merchantStrategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);

Merchant.getMerchantByEmail(jwt_payload.email, function(err, merchant) {
    if (err) throw err;
    if (merchant) {
      next(null, merchant);
    } else {
      next(null, false,{message: 'Unknown Merchant'});
    }
});

});

passport.use(merchantStrategy);

  // middleware to use for all requests
  router.use(function(req, res, next) {
    console.log("Checking request");
      next();
  });


  router.route('/authenticate')
  .post(function(req, res) {

    if(req.body.email && req.body.password){
      var email = req.body.email;
      var password = req.body.password;

      var merchant = Merchant.getMerchantByEmail(email, function(err, merchant) {
        if (err) throw err;

        if(!merchant){
        res.json({success: false, message: 'Authentication failed. Merchant not found'})
      }
        else if (merchant){

        //Check password
        Merchant.comparePassword(password, merchant.password, function(err, isMatch){
          if(err) return done(err);
          if(!isMatch){
            res.status(401).json({message:"Invalid Password"});
          } else {
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
    res.json("Merchant token was validated");
  });

  router.route('/secretDebug')
        .get(function(req, res, next){
   console.log(req.get('Authorization'));
   next();
 }, function(req, res){
   res.json("debugging");
});

  router.route('/register')

      // create a bear (accessed at POST http://localhost:8080/api/bears)
      .post(function(req, res) {


        var companyName = req.body.companyName;  // set the customer name (comes from the request)
        var email = req.body.email;
        var mobileNumber =  req.body.mobileNumber;
        var password = req.body.password;
        var password2 = req.body.password2;
        var address = req.body.address;




        // Form Validator
        req.checkBody('companyName','Company Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        req.checkBody('mobileNumber','mobileNumber is not valid').notEmpty().isInt();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2','Passwords do not match').equals(req.body.password);

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
        	res.json({ message: errors });
        } else{
        	var merchant = new Merchant({      // create a new instance of the Customer model
            companyName: companyName,
            email: email,
            mobileNumber: mobileNumber,
            password: password,
            address: address,
            createdDate: Date.now()
          });

          Merchant.createMerchant(merchant, function(err, newMerchant){
            if(err) throw err;
            res.json({ message: 'Merchant created!' });
          });

      };

    });

router.route('/')
      .get(function(req, res) {
          Merchant.find(function(err, merchant) {
              if (err)
                  res.send(err);

              res.json(merchant);
          });
      });

      // on routes that end in /bears/:bear_id
      // ----------------------------------------------------
      router.route('/:Id')

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
