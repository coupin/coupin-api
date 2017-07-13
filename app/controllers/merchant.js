const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');

const Merchant = require('../models/users');
const emailer = require('../../config/email');

// Coupin App Messages
const messages = require('../../config/messages');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeader(),
    secretOrKey : 'coupinappmerchant'
}

module.exports = {
    adminCreate: function (req, res) {
        const body = req.body;

        Merchant.findOne({email: body.email}, function (err, merchant) {
            if (err) {
                res.status(500).send(err);
            } else if (merchant) {
                res.status(409).send({message: 'User already exists'});
            } else {
                let merchant = new Merchant({
                    email: body.email,
                    picture: body.picture,
                    passoword: body.password,
                    merchantInfo: {
                        companyName: body.companyName,
                        companyDetails: body.companyDetails,
                        address: body.address,
                        city: body.city,
                        mobileNumber: body.mobileNumber
                    },
                    isActive: true,
                    activated: true,
                    role: 2
                });

                Merchant.createCustomer(merchant, function (err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: 'User created successfully.'});
                    }
                });
            }
        });
    },
    adminReview: function (req, res) {
        const decision = req.body;
        Merchant.findById(req.params.id, function (err, merchant) {
            if (err)
            throw err;

            if (Object.keys(decision).length === 0) {
            // set isPending to true and save
            if (merchant.isPending) {
                res.send({success: false, message: 'User is already pending.'});
            } else {
                merchant.isPending = true;
                merchant.save(function (err) {
                    if (err)
                        throw err;

                    emailer.sendEmail(merchant.email, 'Registration Approved', messages.approved(merchant._id), function(response) {
                        res.send({success: true, rejected: false, message: 'Merchant Aprroved and email sent to ' + merchant.companyName});
                    });
                });
            }

            } else {
            // set rejected to true and save the reason
            merchant.rejected = true;
            merchant.reason = decision.details;
            merchant.save(function(err) {
                if(err)
                throw err;

                res.send({success: true, rejected: true, message: 'Merchant declined and email sent to ' + merchant.companyName});
            });
            }
        });
    },
    authenticate: function (req, res) {
        req.logIn(req.user, function (err, user) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({success: true, user: user});
            }
        });
    },
    authRedirect: function (req, res) {
        if (req.user) {
            if (req.user.role == 2) {
            res.sendfile('./public/views/merchant/index.html');
            } else {
            res.sendfile('./public/views/merchantReg.html');
            }
        } else {
            res.sendfile('./public/views/merchantReg.html');
        }
    },
    confirm: function (req, res) {
        // get the data from the the
        const address = req.body.address;
        const city = req.body.city;
        const password = req.body.password;
        const state = req.body.state;

        // Form Validator
        req.checkBody('address','Address field is required').notEmpty();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2', 'Please confirm password').notEmpty();
        req.checkBody('password2', 'Passwords are not the same').equals(req.body.password);
        req.checkBody('city', 'City field is required').notEmpty();
        req.checkBody('state', 'State field is required').notEmpty();

        const errors = req.validationErrors();

        if (errors) {
            res.send({success: false, message: errors[0].msg});
        } else {
            Merchant.findById(req.params.id, function(err, merchant){
                if (err)
                throw err;

                merchant.merchantInfo.address = address;
                merchant.password = password;
                merchant.merchantInfo.city = city;
                merchant.merchantInfo.state = state;
                merchant.activated = true;
                merchant.isPending = false;
                merchant.rejected = false;

                Merchant.createCustomer(merchant, function(err) {
                    if (err) {
                        res.status(500).send(err);
                    }

                    res.status(200).send({success: true, message: 'You have been confirmed!'});
                });
            });
        }
    },
    currentUser: function (req, res) {
        res.status(200).send(req.user);
    },
    getAllMerchants: function (req, res) {
        Merchant.find({role: 2}, function (err, merchants) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },
    register: function (req, res) {
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

        if(errors) {
            res.send({success: false, message: errors[0].msg });
        } else {
            var createdDate = Date.now();
            var merchant = new Merchant();      // create a new instance of the Customer model
            merchant.merchantInfo.companyName = companyName;
            merchant.email = email;
            merchant.merchantInfo.mobileNumber = mobileNumber;
            merchant.merchantInfo.companyDetails = companyDetails;
            merchant.createdDate = createdDate;
            merchant.role = 2;

            merchant.save(function(err) {
            if(err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({
                    success: true,
                    message: 'Success! Your request has now been made and we will get back to you within 24hours.'});
                };
            });
        }
    },
    update: function (req, res) {
        Merchant.findById(req.params.id, function(err, merchant) {
            console.log(req.body);
            if (err) {
                res.status(500).send(err);
            } else if (!merchant) {
                res.status(404).send({message: 'No such user exists'});
            } else {
                if (req.body.email) {
                    merchant.email = req.body.email;
                }

                if ('mobileNumber' in req.body.merchantInfo) {
                    merchant.merchantInfo.mobileNumber = req.body.merchantInfo.mobileNumber;
                }

                if ('companyName' in req.body.merchantInfo) {
                    merchant.merchantInfo.companyName = req.body.merchantInfo.companyName;
                }

                if (req.body.merchantInfo.companyDetails) {
                    merchant.merchantInfo.companyDetails = req.body.merchantInfo.companyDetails;
                }

                if (req.body.merchantInfo.address) {
                    merchant.merchantInfo.address =  req.body.merchantInfo.address;
                }

                if (req.body.merchantInfo.city) {
                    merchant.merchantInfo.city = req.body.merchantInfo.city;
                }

                if (req.body.merchantInfo.state) {
                    merchant.merchantInfo.state =  req.body.merchantInfo.state;
                }

                if (req.body.merchantInfo.location) {
                    merchant.merchantInfo.location = req.body.merchantInfo.location;
                }

                merchant.modifiedDate = Date.now();

                // save the customer updateCustomer
                merchant.save(function(err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({ message: 'Merchant updated!' });
                    }

                });
            }
        });
    }
}