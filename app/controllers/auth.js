const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');

const Emailer = require('../../config/email');
const Messages = require('../../config/messages');
const User = require('../models/users');

const ExtractJwt = passportJWT.ExtractJwt;
const jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey : 'coupinappcustomer'
}

module.exports = {
    changePassword: function (req, res) {
        if (req.user) {
            User.findById(req.user._id, function (err, user) {
                if (err) {
                    res.status(500).send(err);
                    throw new Error(err);
                } else if (!user) {
                    res.status(404).send({message: 'There is no such user'});
                } else {
                    User.updatePassword(user, req.body.password, function (err, user) {
                        if (err) {
                            res.status(500).send(err);
                            throw new Error(err);
                        } else {
                            res.status(200).send({message: 'Password saved successfully'});
                        }
                    }); 
                }
            });
        } else {
            res.status(404).send({message: 'There is no signed in user'});
        }
    },

    registerCustomer : function(req, res) {
        // Get information on customer
        var name = req.body.name;
        var email = req.body.email;
        // var network =  req.body.network;
        var password = req.body.password;
        var password2 = req.body.password2;
        var picture = req.body.pictureUrl;
        var googleId = req.body.googleId;
        var facebookId = req.body.facebookId;


        // Form Validator
        req.checkBody('name','Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        // req.checkBody('network','Network is required').notEmpty();
        if (!googleId && !facebookId) {
            req.checkBody('password','Password field is required').notEmpty();
            req.checkBody('password2','Passwords do not match').equals(req.body.password);
        }

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
            res.status(400).send({message: errors[0].msg });
        } else{
            // Create new user
            var customer = new User({
            name: name,
            email: email,
            // network: network,
            createdDate: Date.now()
            });

            if (password) {
                customer['password'] = password;
            }

            if (facebookId) {
                customer['facebookId'] = facebookId;
            }

            if (googleId) {
                customer['googleId'] = googleId;
            }

            if (picture) {
                customer['picture'] = picture;
            }

            User.createCustomer(customer, function(err, customer) {
                if (err) {
                    res.status(409).send({message: 'User already exists.'});
                    throw new Error(err);
                } else {
                    var payload = {id: customer.id, name: customer.name, email: customer.email};
                    var token = jwt.sign(payload, jwtOptions.secretOrKey);

                    res.status(200).send({
                        message: 'Customer created!',
                        token: 'JWT ' + token,
                        user: customer
                    });
                }
            });
        }
    },

    registerMerchant: function(req, res) {
        // Get merchant details
        const companyName = req.body.companyName;
        const email = req.body.email;
        const mobileNumber = req.body.mobileNumber;
        const companyDetails = req.body.companyDetails;

        // Form Validator
        req.checkBody('companyName','Company Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        req.checkBody('mobileNumber', 'Mobile number cannot be empty').notEmpty();
        req.checkBody('companyDetails', 'Company Details field is required').notEmpty();

        // Check Errors
        const errors = req.validationErrors();

        if (errors) {
            res,status(400).send({message: errors[0].msg });
        } else {
            var merchant = new User({
                email : email,
                merchantInfo: {
                    companyName : companyName,
                    mobileNumber : mobileNumber,
                    companyDetails : companyDetails
                },
                createdDate : Date.now(),
                status: 'pending',
                role : 2
            });

            merchant.save(function(err) {
            if(err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send({
                    message: 'Success! Your request has now been made and we will get back to you within 24hours.'});
                };

                Emailer.sendEmail(email, 'Registration Received', Messages.registered(companyName), function(response) {
                    console.log(`Email sent to ${companyName} at ${(new Date().toDateString())}`);
                });
            });
        }
    },

    signinCustomer : function (req, res) {
        var customer = req.user;
        var payload = {id: customer.id, name: customer.name, email: customer.email, mobileNumber: customer.mobileNumber};
        var token = jwt.sign(payload, jwtOptions.secretOrKey);

        //var token = jwt.sign(customer, secretKey, {
        //  expiresInMinutes: 1440
        //});

        res.status(200).send({
        token: 'JWT ' + token,
        user: req.user
        });
    },

    /**
     * Login Merchants and Admin
     */
    signinWeb: function (req, res) {
        var token = jwt.sign({
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive
        }, process.env.SECRET, {
            expiresIn: '24h'
        });

        var user = {
            id: req.user._id,
            email: req.user.email,
            isActive: true, 
            merchantInfo: req.user.merchantInfo,
            picture: req.user.picture,
            isSuper: req.user.role === 0
        };
        
        res.status(200).send({token, user});
    }
}