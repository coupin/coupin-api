// Modules
var express = require('express');
var router = express.Router();
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

// Models
var User = require('../models/admin');

// Admin api routes
    router.get('/', function(req, res) {
        User.find(function(req, users) {
            res.json(users);
        });
    }).post('/', function(req, res){
        // Set the values
        var email = req.body.email;
        var password = req.body.password;

        // Form Validator
        req.checkBody('email', 'Email cannot be empty').notEmpty();
        req.checkBody('email', 'Email is required to login').isEmail();
        req.checkBody('password', 'Password cannot be empty').notEmpty();

        // Check for Errors
        var errors = req.validationErrors();

        if(errors) {
            // res.render('/admin/login', {
            //     errors: errors
            // });
            res.json({ errors: errors});
        } else {
            var user = new User({
                username : username,
                password : password
            });
            
            user.save(function(err, user){
                if(err) {
                    res.send(err);
                } else {
                    res.json({message: "User Created"});
                }
            });
        }
        
    });

    // frontend routers
    // routes to handle all angular requests
    router.route('/login').get(function(req, res) {
        // load the index page
        res.sendfile('./public/views/index.html');
    })
    // Log a user in from the form
    .post(passport.authenticate('local-login', {
        successRedirect : '/homepage' 
    }));

    // Add new admin
    // router.post('/addAdmin', passport.authenticate('local-signup', {
    //     successRedirect : '/homepage',
    //     failureRedirect : '/admin/login',
    //     failureFlash: true 
    // }));


module.exports = router;

