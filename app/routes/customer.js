var express = require('express');
var router = express.Router();

// models
var Customer = require('../models/customer');



  // middleware to use for all requests
  router.use(function(req, res, next) {
      // do logging
      console.log('Something is happening.');
      next(); // make sure we go to the next routes and don't stop here
  });


  router.get('/', function(req, res){
    res.json({message: 'We got here'});
  });

  router.route('/customer')

      // create a bear (accessed at POST http://localhost:8080/api/bears)
      .post(function(req, res) {


        var name = req.body.name;  // set the customer name (comes from the request)
        var email = req.body.email;
        var mobileNumber =  req.body.mobileNumber;
        var password = req.body.password;
        var password2 = req.body.password2;


        // Form Validator
        req.checkBody('name','Name field is required').notEmpty();
        req.checkBody('email','Email field is required').notEmpty();
        req.checkBody('email','Email is not valid').isEmail();
        req.checkBody('username','Username field is required').notEmpty();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2','Passwords do not match').equals(req.body.password);

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
        	res.render('register', {
        		errors: errors
        	});
        } else{
        	var customer = new Customer({      // create a new instance of the Customer model
            name: name,
            email: email,
            username: username,
            password: password,
            profileimage: profileimage
          });

          User.createUser(newUser, function(err, user){
            if(err) throw err;
            console.log(user);
          });


          // save the bear and check for errors
          customer.save(function(err) {
              if (err)
                  res.send(err);

              res.json({ message: 'Customer created!' });
          });

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
      router.route('/customer/:cusotmer_name')

      .get(function(req, res){
        Customer.findById(req.params.customer_name, function(err, customer){
          if (err)
            res.send(err);
          res.json(customer);
        })
      })

      // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
      .put(function(req, res) {

          // use our customer model to find the bear we want
          Customer.findById(req.params.customer_name, function(err, customer) {

              if (err)
                  res.send(err);

              customer.name = req.body.name;  // update the customers info

              // save the customer
              customer.save(function(err) {
                  if (err)
                      res.send(err);

                  res.json({ message: 'Customer updated!' });
              });

          });
      });

  module.exports = router;
