// Modules
var express = require('express');
var router = express.Router();
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

// Models
var User = require('../models/admin');

// Utilities
var Util = require('../utils');

// User api routes
    router.get('/api/user', function(req, res) {
        User.find(function(req, users) {
            res.json(users);
        });
    });
    
    router.post('/api/user', function(req, res){
        var user = new User();

        user.username = req.body.username;
        if(!Util.isEmpty(req.body.password))
            user.password = Util.encryptPassword(req.body.password);
        user.email = req.body.email;

        user.save(function(err, user){
            if(err) {
                res.send(err);
            } else {
                res.json({message: "User Created"});
            }
        });
    });

module.exports = router;

