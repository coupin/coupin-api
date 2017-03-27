// Modules
var express = require('express');
var router = express.Router();
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

// Models
var User = require('../models/admin');

// Admin api routes
router.get('/', function(req, res) {
    User.find({
        'local.superAdmin' : false 
    }, function(req, users) {
        res.json(users);
    });
});

router.route('/:id').delete(function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err)
            throw err;

        if(user) {
            User.remove({
                _id : req.params.id
            }, function(err, user) {
                if(err) {
                    throw err;
                } else {
                    res.send({success : true, message: 'Admin has been deleted'});
                }
                
            });
        }
    });
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
router.post('/addAdmin', function(req, res, next) {

    // Form Validator
    req.checkBody('email', 'Email cannot be empty').notEmpty();
    req.checkBody('email', 'Email is required to login').isEmail();
    req.checkBody('password', 'Password cannot be empty').notEmpty();
    req.checkBody('confirm', 'Please Confirm Password').notEmpty();
    req.checkBody('confirm','Passwords do not match').equals(req.body.password);

    // Check for Errors
    var errors = req.validationErrors();

    if(errors) {
        res.json({ errors: errors});
    } else {
        passport.authenticate('local-signup', function(err, user, info){

            if(err)
                throw err;

            if(info) 
                return res.send({success: false, message: info});

            if(user)
                return res.send({success: true, message: 'User Created.'});
        })(req, res, next);
    }
});

router.route('/activate/:id').post(function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err) 
            throw err;

        if(!user) {
            res.send({success: false, message: 'No Such User Exists'});
        } else {
            user.local.isActive = true;
            user.save( function(err) {
                if(err)
                    throw err;

                res.send({success: true, message: ' was Activated.'});
            });
        }
    });
});

router.route('/deactivate/:id').post(function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err) 
            throw err;

        if(!user) {
            res.send({success: false, message: 'No Such User Exists'});
        } else {
            user.local.isActive = false;
            user.save( function(err) {
                if(err)
                    throw err;

                res.send({success: true, message: ' was Deactivated.'});
            });
        }
    });
});

// Get currently logged in user
router.route('/getCurrentUser').get(function(req, res){
    res.send(req.user);
});


module.exports = router;

