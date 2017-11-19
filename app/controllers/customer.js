const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');

const Customer = require('../models/users');
const emailer = require('../../config/email');

// Coupin App Messages
const messages = require('../../config/messages');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey : 'coupinappcustomer'
}

module.exports = {
    login : function (req, res) {
        var customer = req.user;
        var payload = {id: customer.id, name: customer.name, email: customer.email, mobileNumber: customer.mobileNumber};
        var token = jwt.sign(payload, jwtOptions.secretOrKey);

        //var token = jwt.sign(customer, secretKey, {
        //  expiresInMinutes: 1440
        //});

        res.json({
        success: true,
        token: 'JWT ' + token,
        user: req.user
        });
    },
    register : function(req, res) {
        // Get information on customer
        var name = req.body.name;
        var email = req.body.email;
        // var network =  req.body.network;
        var password = req.body.password;
        var password2 = req.body.password2;


        // Form Validator
        req.checkBody('name','Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        // req.checkBody('network','Network is required').notEmpty();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2','Passwords do not match').equals(req.body.password);

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
            res.status(400).send({success: false, message: errors[0].msg });
        } else{
            // Create new user
            var customer = new Customer({
            name: name,
            email: email,
            // network: network,
            password: password,
            createdDate: Date.now()
            });

            Customer.createCustomer(customer, function(err, customer) {
                if(err)
                {
                    res.status(409).send({message: 'User already exists.'});
                } else {
                    var payload = {id: customer.id, name: customer.name, email: customer.email};
                    var token = jwt.sign(payload, jwtOptions.secretOrKey);

                    res.json({
                        success: true,
                        message: 'Customer created!',
                        token: 'JWT ' + token,
                        user: customer
                    });
                }
            });
        }
    },
    retrieveByNo : function(req, res){
        Customer.findOne({'info.mobileNumber': req.params.mobileNumber}, function(err, customer){
            if (err)
            throw err;

            res.json(customer);
        });
    },
    update : function(req, res) {
        // use our customer model to find the bear we want
        Customer.findOne({'info.mobileNumber': req.params.mobileNumber}, function(err, customer) {

            if (err)
            throw err;

            if (req.body.name)
            customer.name = req.body.name;

            if (req.body.email)
            customer.email = req.body.email;

            if (req.body.address)
            customer.address =  req.body.address;

            if (req.body.state)
            customer.state =  req.body.state;

            if (req.body.city)
            customer.city =  req.body.city;

            customer.modifiedDate = Date.now();

            // save the customer updateCustomer
            customer.save(function(err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json({success: true,  message: 'Customer updated!' });
            }
            });

        });
    }
}
