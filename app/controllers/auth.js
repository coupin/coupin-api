const jwt = require('jsonwebtoken');

const User = require('../models/users');

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
            res.status(400).send({success: false, message: errors[0].msg });
        } else{
            // Create new user
            var customer = new Customer({
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

            Customer.createCustomer(customer, function(err, customer) {
                if (err)
                {
                    res.status(409).send({message: 'User already exists.'});
                    throw new Error(err);
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

    signinCustomer : function (req, res) {
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

    /**
     * Login Merchants
     */
    signinMerchant: function (req, res) {
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
            picture: req.user.picture
        };
        
        res.status(200).send({success: true, token, user});
    }
}