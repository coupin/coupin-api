var express = require('express');
var expressValidator = require('express-validator');
var router = express.Router();

// models
var Customer = require('../models/customer');



  // middleware to use for all requests
  router.use(function(req, res, next) {
      // do logging
      console.log('Something is happening.');
      next(); // make sure we go to the next routes and don't stop here
  });




  router.route('/customer')

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

    })

      .get(function(req, res) {
          Customer.find(function(err, customer) {
              if (err)
                  res.send(err);

              res.json(customer);
          });
      });

      // on routes that end in /bears/:bear_id
      // ----------------------------------------------------
      router.route('/customer/:mobileNumber')

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
