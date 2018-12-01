var _ = require('lodash');
var cryptoJs = require('crypto-js');
var jwt = require('jsonwebtoken');
var passportJWT = require('passport-jwt');

var config = require('./../../config/config');
var Raven = config.Raven;
var Emailer = require('../../config/email');
var Messages = require('../../config/messages');
var User = require('../models/users');

var ExtractJwt = passportJWT.ExtractJwt;
var jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey : 'coupinappcustomer'
}

module.exports = {
    /**
     * Confirm Encoded String
     */
    confirmString: function(req, res) {
        var encoded = req.query.encoded || req.params.encoded || req.body.encoded;
        encoded = encoded.replace(/\s/g, '+');

        if (encoded) {
            var decrypted = cryptoJs.AES.decrypt(encoded.toString(), config.secret);
            var id = decrypted.toString(cryptoJs.enc.Utf8)
            User.count({
                _id: id
            }, function(err, count) {
                if(err) {
                    res.status(500).send({
                        message: err
                    });
                    Raven.captureException(err);
                } else if (count > 0) {
                    res.status(200).send({
                        id: id,
                        message: 'confirmed.'
                    });
                } else {
                    res.status(404).send({
                        message: 'User does not exist.'
                    });
                }
            });
        } else {
            res.status(400).send({ message: 'Bad Request.' });
        }
    },

    /**
     * @api {post} /auth/password/c Change Password
     * @apiName changePassword
     * @apiGroup Auth
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} New Password. Confirming password should be done on mobile.
     * 
     * @apiSuccess {String} message 'Password change successful' 
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "message": "Password change successful",
     *  }
     * 
     * @apiError Unauthorized Invalid token.
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Unauthorized
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError UserNotFound no such user exists..
     * 
     * @apiErrorExample UserNotFound:
     *  HTTP/1.1 404 UserNotFound
     *  {
     *      "message": "There is no such user."
     *  }
     * 
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
    changePassword: function (req, res) {
        if (req.user) {
            User.findById(req.user._id, function (err, user) {
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else if (!user) {
                    res.status(404).send({message: 'There is no such user'});
                } else {
                    User.updatePassword(user, req.body.password, function (err, user) {
                        if (err) {
                            res.status(500).send(err);
                            Raven.captureException(err);
                        } else {
                            res.status(200).send({message: 'Password change successful'});
                        }
                    }); 
                }
            });
        } else {
            res.status(401).send({message: 'There is no signed in user'});
        }
    },

    /**
     * @api {post} /auth/forgot-password Forgot Password
     * @apiName forgotPassword
     * @apiGroup Auth
     * 
     * @apiParam {String} email. Email address associated with email.
     * 
     * @apiSuccess {String} message 'Email sent successfully' 
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "message": "Email sent successfully",
     *  }
     * 
     * @apiError UserNotFound no such user exists..
     * 
     * @apiErrorExample UserNotFound:
     *  HTTP/1.1 404 UserNotFound
     *  {
     *      "message": "There is no such user."
     *  }
     * 
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
    forgotPassword: function(req, res) {
        var email = req.body.email || req.param.email;

        User.findOne({
            email: email
        }, function(err, user) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!user) {
                res.status(404).send({message: 'There is no such user'});
            } else {
                var encrypted = cryptoJs.AES.encrypt(user._id.toString(), config.secret);
                Emailer.sendEmail(user.email, 'Forgot Password', Messages.forgotPassword(encrypted.toString(), Emailer.getUiUrl()), function(response) {
                    res.status(200).send({ message: 'Email sent successfully.' });
                    Raven.captureMessage(`Email sent to ${email} at ${(new Date().toDateString())}`);
                });
            }
        });
    },

    newPassword: function(req, res) {
        const id = req.body.id || req.params.id;
        const password = req.body.password || req.params.password;
        const encoded = req.query.encoded || req.params.encoded || req.body.encoded;

        if (id && encoded) {
            var decrypted = cryptoJs.AES.decrypt(encoded.toString(), config.secret);
            if (decrypted.toString(cryptoJs.enc.Utf8) === id) {
                User.findById(id, function (err, user) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else if (!user) {
                        res.status(404).send({message: 'There is no such user'});
                    } else {
                        User.updatePassword(user, password, function (err, user) {
                            if (err) {
                                res.status(500).send(err);
                                Raven.captureException(err);
                            } else {
                                res.status(200).send({message: 'Password change successful'});
                            }
                        }); 
                    }
                });
            } else {
                res.status(400).send({message: 'Invalid id or encoded string.'});
            }
        } else {
            res.status(400).send({message: 'An id must be supplied with the encoded string.'});
        }
    },

    /**
     * @api {post} /auth/register/c Sign up: Mobile
     * @apiName registerCustomer
     * @apiGroup Auth
     * 
     * @apiParam {String} facebookId (Optional) unique facebook id for loging in with facebook
     * @apiParam {String} googleId (Optional) unique google id for loging in with google
     * @apiParam {String} name Full name of the user 
     * @apiParam {String} email Email of the user
     * @apiParam {String} password
     * @apiParam {String} confirmed password compares with password above
     * @apiParam {String} picture (Optional) image url
     * 
     * @apiSuccess {String} token 'JWT token' to be exact, to be used for authentication
     * @apiSuccess {String} message 'Successful Registration' 
     * @apiSuccess {Object} user an object holding the user's information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "token": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmlzby5sYXdhbEBnbWFpbC5jb20iLCJqdGkiOiI5OTAzODA2MS01NmI3LTQxYjktYTlkZi03MjAwM2FhZTFlNWUiLCJpZCI6IjciLCJuYmYiOjE1MzQyNDMyNzQsImV4cCI6MTUzNDMyOTY3NCwiaXNzIjoiaHR0cHM6Ly9hcGkubHlucS5jb20iLCJhdWQiOiJodHRwczovL2x5bnEuY29tIn0.cutCBM5PFkf2n3MaUQfNJU8Na4A78UFfPk6KgnWRHC4",
     *      "message": "Successful Registration",
     *      "user": {
     *          "_id": "5b7ab4ce24688b0adcb9f54b",
     *          "email": "test@email.com"
     *          "name": "Test User",
     *          "dateOfBirth": "2018-08-22",
     *          "ageRange": "15 - 25",
     *          "sex": "male",
     *          "isActive": true,
     *          "blacklist": [],
     *          "favourites": [],
     *          "interests": [],
     *          "city": "lagos",
     *          "picutre": {
     *              "url": null
     *          }":
     *       }
     *  }
     * 
     * @apiError BadRequest A Field is invalid or missing
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 Bad Request
     *  {
     *      "message": "Name Field is Required."
     *  }
     * 
     * @apiError Conflict User already exists the email of the user already exists
     * 
     * @apiErrorExample Conflict:
     *  HTTP/1.1 409 Conflict
     *  {
     *      "message": "User already exists."
     *  }
     */
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
                createdDate: Date.now(),
                isActive: true
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
                customer['picture'] = {
                    url: picture
                };
            }

            customer.isActive = true;

            User.createCustomer(customer, function(err, user) {
                if (err) {
                    res.status(409).send({message: 'User already exists.'});
                    Raven.captureException(err);
                } else {
                    var payload = {id: user._id, name: user.name, email: user.email};
                    var token = jwt.sign(payload, jwtOptions.secretOrKey);

                    //TODO: Remove customer details not necessary
                    var data = {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        dateOfBirth: user.dateOfBirth,
                        ageRange: user.ageRange,
                        sex: user.sex,
                        isActive: user.isActive,
                        blacklist: user.blacklist || [],
                        favourites: user.favourites,
                        interests: user.interests,
                        city: user.city,
                        picutre: {
                            url: user.picture
                        }
                    };

                    res.status(200).send({
                        message: 'Successful Registration!',
                        token: 'JWT ' + token,
                        user: data
                    });
                }
            });
        }
    },

    registerMerchant: function(req, res) {
        // Get merchant details
        var address = req.body.address;
        var city = req.body.city;
        var companyName = req.body.companyName;
        var email = req.body.email;
        var mobileNumber = req.body.mobileNumber;
        var state = req.body.state;

        // Form Validator
        req.checkBody('companyName','Company Name field is required').notEmpty();
        req.checkBody('email','Email field is required').isEmail();
        req.checkBody('mobileNumber', 'Mobile number cannot be empty').notEmpty();
        req.checkBody('address', 'Address field is required').notEmpty();
        req.checkBody('city', 'City field is required').notEmpty();
        req.checkBody('state', 'State field is required').notEmpty();

        // Check Errors
        var errors = req.validationErrors();

        if (errors) {
            res,status(400).send({message: errors[0].msg });
        } else {
            var merchant = new User({
                email : email,
                merchantInfo: {
                    companyName : companyName,
                    mobileNumber : mobileNumber,
                    address : address,
                    city : city,
                    state : state
                },
                createdDate : Date.now(),
                status: 'pending',
                role : 2
            });

            merchant.save(function(err) {
            if(err) {
                res.status(500).send(err);
                Raven.captureException(err);
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

    /**
     * @api {post} /auth/signin Sign in: Mobile (Add "/c" to sign in with social)
     * @apiName signinCustomer
     * @apiGroup Auth
     * 
     * @apiParam {String} facebookId (Optional) unique facebook id for loging in with facebook, to be sent to social
     * @apiParam {String} googleId (Optional) unique google id for loging in with google, to be sent to social
     * @apiParam {String} email Email of the user
     * @apiParam {String} password
     * 
     * @apiSuccess {String} token 'JWT token' to be exact, to be used for authentication
     * @apiSuccess {String} message 'Successful Registration' 
     * @apiSuccess {Object} user an object holding the user's information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "token": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmlzby5sYXdhbEBnbWFpbC5jb20iLCJqdGkiOiI5OTAzODA2MS01NmI3LTQxYjktYTlkZi03MjAwM2FhZTFlNWUiLCJpZCI6IjciLCJuYmYiOjE1MzQyNDMyNzQsImV4cCI6MTUzNDMyOTY3NCwiaXNzIjoiaHR0cHM6Ly9hcGkubHlucS5jb20iLCJhdWQiOiJodHRwczovL2x5bnEuY29tIn0.cutCBM5PFkf2n3MaUQfNJU8Na4A78UFfPk6KgnWRHC4",
     *      "user": {
     *          "_id": "5b7ab4ce24688b0adcb9f54b",
     *          "email": "test@email.com"
     *          "name": "Test User",
     *          "dateOfBirth": "2018-08-22",
     *          "ageRange": "15 - 25",
     *          "sex": "male",
     *          "isActive": true,
     *          "blacklist": [],
     *          "favourites": [],
     *          "interests": [],
     *          "city": "lagos",
     *          "picutre": {
     *              "url": null
     *          }":
     *       }
     *  }
     * 
     * @apiError BadRequest Field is invalid or missing
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 Bad Request
     *  {
     *      "message": "Name Field is Required."
     *  }
     * 
     * @apiError Unauthorized Failed to authenticate
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Bad Request
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError UserNotFound User does not exist
     * 
     * @apiErrorExample UserNotFound:
     *  HTTP/1.1 404 Unknown
     *  {
     *      "message": "User already exists."
     *  }
     */
    signinCustomer : function (req, res) {
        var user = req.user;
        var payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber
        };
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        var data = {
            _id: user._id,
            email: user.email,
            name: user.name,
            dateOfBirth: user.dateOfBirth,
            mobileNumber: user.mobileNumber,
            ageRange: user.ageRange,
            sex: user.sex,
            isActive: user.isActive,
            blacklist: user.blacklist || [],
            favourites: user.favourites,
            interests: user.interests,
            visited: user.visited,
            city: user.city,
            picture: user.picture
        };

        res.status(200).send({
            token: 'JWT ' + token,
            user: data
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