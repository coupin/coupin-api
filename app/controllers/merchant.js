var _ = require('lodash');
var moment = require('moment');
var path = require('path');

var Raven = require('./../../config/config').Raven;
var emailer = require('../../config/email');
var Merchant = require('../models/users');
var Prime = require('../models/prime');
var Reward = require('./../models/reward');

// Coupin App Messages
var messages = require('../../config/messages');

function getVisited(id) {
    return new Promise(function(res, rej) {
        Merchant.findById(id).select('favourites visited').exec(function(err, user) {
            res(user);
        });
    });
}

module.exports = {
    /**
     * Handles creation of merchants
     */
    adminCreate: function (req, res) {
        var body = req.body;

        Merchant.findOne({email: body.email}, function (err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (merchant) {
                res.status(409).send({message: 'User already exists'});
            } else {
                var merchant = new Merchant({
                    email: body.email,
                    password: body.password || 'merchant',
                    merchantInfo: {
                        companyName: body.companyName,
                        companyDetails: body.companyDetails,
                        address: body.address,
                        billing: {
                            history: []
                        },
                        city: body.city,
                        mobileNumber: body.mobileNumber,
                        location: [body.longitude, body.latitude],
                        logo: {
                            id: body.public_id,
                            url: body.logo
                        }
                    },
                    status: 'completed',
                    isActive: true,
                    role: 2
                });

                if (moment(new Date()).isBefore('2020-04-01')) {
                    merchant.merchantInfo.billing.history.unshift({
                        plan: 'monthly',
                        reference: 'coupin-promo-first-timer',
                        expiration: expiration
                    });
                }

                Merchant.createCustomer(merchant, function (err) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        res.status(200).send(merchant);
                    }
                });
            }
        });
    },

    /**
     * Changeg the status of the merchants
     */
    adminReview: function (req, res) {
        var body = req.body;
        var id = req.params.id || req.query.id || req.body.id;

        if (!body.accepted || !body.details) {
            res.status(400).send({ message: 'Bad body in request.' });
        }

        Merchant.findById(id, function (err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if(!merchant) {
                res.status(404).send({ message: 'Merchant does not exist.' });
            } else {
                if (body.accepted) {
                    merchant.status = 'accepted';
                } else {
                    merchant.status = 'rejected';
                    merchant.reason = body.details;
                }

                merchant.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        if (decision.accepted) {
                            emailer.sendEmail(
                                merchant.email,
                                'Registration Approved',
                                messages.approved(merchant._id, emailer.getUiUrl(), merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() })),
                                function(response) {
                                    res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.merchantInfo.companyName });
                                }
                            );
                        } else {
                            emailer.sendEmail(
                                merchant.email,
                                merchant.merchantInfo.companyName + ' Registration Rejected',
                                messages.rejected(merchant.reason, merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() })),
                                function(response) {
                                    res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.merchantInfo.companyName });
                                }
                            );
                        }
                    }
                });
            }
        });
    },

    billing: function(req, res) {
        var body = req.body;
        var id = req.params.id || req.query.id || req.body.id;
        var isFirstTime = false;

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!merchant) {
                res.status(404).send({ message: 'User does not exist.' });
            } else {
                merchant.merchantInfo.billing.plan = body.plan;
                if (!merchant.merchantInfo.billing.history) {
                    merchant.merchantInfo.billing.history = [];
                    isFirstTime = true;
                }
                var expiration = null;
                if (isFirstTime && moment(new Date()).isBefore('2020-04-01')) {
                    expiration = moment(new Date()).add(2, 'months').toDate();
                } else {
                    if (body.plan !== 'payAsYouGo') {
                        if (body.plan === 'monthly') {
                            expiration = moment(new Date()).add(1, 'months').toDate();
                        } else if (body.plan === 'yearly') {
                            expiration = moment(new Date()).add(1, 'years').toDate();
                        } else {
                            expiration = null;
                        }
                    }
                }

                merchant.merchantInfo.billing.history.unshift({
                    plan: isFirstTime ? 'monthly' : body.plan,
                    reference: isFirstTime ? 'coupin-promo-first-timer' : body.reference,
                    expiration: expiration
                });

                merchant.save(function(err, merchant) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        res.status(200).send({
                            id: merchant._id,
                            email: merchant.email,
                            isActive: true,
                            merchantInfo: merchant.merchantInfo,
                            picture: merchant.picture,
                            isSuper: req.user.role === 0
                        });
                    }
                });
            }
        });
    },

    /**
     * Handles merchant confirmation
     */
    confirm: function (req, res) {
        var id = req.params.id || req.query.id || req.body.id;

        // get the data from the the
        var password = req.body.password;
        var banner = req.body.banner;
        var billing = req.body.billing;
        var companyDetails = req.body.companyDetails;
        var logo = req.body.logo;
        var state = req.body.state;

        // Form Validator
        req.checkBody('companyDetails', 'Company Details field is required').notEmpty();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2', 'Please confirm password').notEmpty();
        req.checkBody('password2', 'Passwords are not the same').equals(req.body.password);
        req.checkBody('logo', 'Logo is required').notEmpty();
        req.checkBody('banner', 'Banner is required').notEmpty();

        var errors = req.validationErrors();

        if (errors) {
            res.status(400).send({message: errors[0].msg});
        } else {
            Merchant.findById(id, function(err, merchant){
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else if (!merchant) {
                    res.status(404).send({ message: 'Merchant does not exist.' });
                } else {
                    merchant.password = password;
                    merchant.merchantInfo.companyDetails = companyDetails;
                    merchant.merchantInfo.logo = logo;
                    merchant.merchantInfo.banner = banner;
                    merchant.merchantInfo.state = state;

                    if ((billing.plan === 'trial' || billing.plan === 'payAsYouGo') && merchant.status !== 'completed') {
                        const billingHistoryObject = {
                            plan: billing.plan,
                            date: new Date(billing.date),
                            reference: billing.reference,
                        };

                        if (billing.plan === 'trial') {
                            billingHistoryObject.expiration = new Date(billing.expiration);
                        }

                        merchant.isActive = true;
                        merchant.status = 'completed';
                        merchant.completedDate = new Date();
                        merchant.merchantInfo.billing = {
                            plan : billing.plan,
                            history : [billingHistoryObject],
                        };
                    }

                    Merchant.createCustomer(merchant, function(err) {
                        if (err) {
                            res.status(500).send(err);
                            Raven.captureException(err);
                        } else {
                            res.status(200).send({message: 'Congratulations! Welcome to Coupin! Please login to continue.'});
                            emailer.sendEmail(merchant.email, 'Congratulations!', messages.completedEmail({
                                name: merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() }),
                            }), function(response) {
                                console.log(response);
                            });
                        }
                    });
                }
            });
        }
    },

    /**
     * Delete one merchant
     */
    deleteOne: function(req, res) {
        var id = req.params.id || req.query.id || req.body.id;

        Merchant.findByIdAndRemove(req.params.id, function(err, merchant) {
            if(err)
            throw err;

            res.send({message: 'Merchant Deleted'});
        });
    },

    getByStatus: function(req, res) {
        var status = req.params.status;
        var limit = req.query.limit || req.body.limit || req.params.limit ||  10;
        var skip = req.query.page || req.body.page || req.params.page ||  0;

        Merchant.find({
            status: status,
            role: 2
        }, function(err, merchants) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                var response = [];

                merchants.forEach(function(merchant) {
                    response.push({
                        id: merchant._id,
                        email: merchant.email,
                        name: merchant.merchantInfo.companyName,
                        mobile: merchant.merchantInfo.mobileNumber,
                        address: merchant.merchantInfo.address,
                        createdDate: merchant.createdDate,
                        status: merchant.status,
                        extra: {
                            reason: merchant.reason,
                            isActive: merchant.isActive,
                            rating: merchant.merchantInfo.rating.value
                        },
                        role: 2
                    });
                });

                res.status(200).send(response);
            }
        });
    },

    getNames: function(req, res) {
        var active = req.query.active === 'true';
        var query = {
            status: 'completed',
            role: 2
        };

        if (active) {
            query['merchantInfo.rewards.0'] = { 
                $exists : true 
            };
        }

        Merchant.find(query, 'merchantInfo.companyName merchantInfo.logo', function(err, rewards) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).send(rewards);
            }
        });
    },

     /**
     * @api {post} /merchant Retrieve merchants for map
     * @apiName markerInfo
     * @apiGroup Merchant
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String[]} categories An array of categories for the filters (Optional)
     * @apiParam {Number} distance The distance to search through. Default is 3km, which is '3'. (Optional)
     * @apiParam {Number} limit The number of merchants to return (Optional)
     * @apiParam {Number} skip The page based on index. 0 stands for the first page, 1 stands for the 2nd. (Optional)
     * @apiParam {Number} longitude From geolocation (Optional)
     * @apiParam {Number} latitude From geolocation (Optional)
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The company's name
     * @apiSuccess {String} mobile The merchant's mobile number
     * @apiSuccess {String} details The merchant's company details
     * @apiSuccess {Object} logo An object containing url {String} url of image
     * @apiSuccess {Object} banner An object containing url {String} url of image
     * @apiSuccess {String} address The company's address
     * @apiSuccess {Object} location The company's geolocation. long {Number} longitude and lat {Number} latitude.
     * @apiSuccess {Object} reward The company's first reward
     * @apiSuccess {String[]} reward Array containing ids of the rewards
     * @apiSuccess {String} category A random category the company falls under
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  [{
     *     "_id": 5b7ab4ce24688b0adcb9f54b,
     *     "name": "The Palms",
     *     "email": "thepalms@email.com",
     *     "mobile": "09045673289",
     *     "details": "A mall full of many surprises.",
     *     "logo": {
     *          "id": "coupin/palms-logo",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-logo.png"
     *     },
     *     "banner": {
     *          "id": "coupin/palms-banner",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-banner.png"
     *     },
     *     "address": "25A Adeola Odeku Street, V.I, Lagos",
     *     "location": {
     *         "long": 3.467894,
     *         "lat": 6.455654
     *     },
     *     "rating": 5,
     *     "reward": {
     *          Refer to Reward Model
     *     },
     *     "rewards": ["5b7ab4ce24688b0adcb9f542", "5b7ab4ce24688b0adcb9f541"],
     *     "category": "foodndrink"
     *  }]
     * 
     * @apiError BadRequest Bad request data.
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 BadRequest
     *  {
     *      "message": "BadRequest."
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
     * @apiError MerchantsNotFound No merchants found.
     * 
     * @apiErrorExample MerchantsNotFound:
     *  HTTP/1.1 404 MerchantsNotFound
     *  {
     *      "message": "Sorry there is no reward around you.."
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
    markerInfo: function (req, res) {
        var categories = req.body.categories ? JSON.parse(req.body.categories) : [];
        var limit = req.query.limit || req.body.limit || req.params.limit ||  5;
        var skip = req.query.page || req.body.page || req.params.page ||  0;
        var longitude = req.query.longitude || req.body.longitude || req.params.longitude;
        var latitude = req.query.latitude || req.body.latitude || req.params.latitude;

        if (typeof limit !== Number) {
            limit = parseInt(limit);
        }

        if (typeof skip !== Number) {
            skip = parseInt(skip);
        }

        if (typeof longitude !== Number) {
            longitude = parseFloat(longitude);
        }

        if (typeof latitude !== Number) {
            latitude = parseFloat(latitude);
        }

        // Kilometers
        var maxDistance = req.body.distance || req.query.distance || req.params.distance || 3;
        maxDistance *= 1000;
        var coords = [longitude, latitude];
        
        var query = {
            isActive: true,
            status: 'completed',
            role : 2,
            'merchantInfo.rewards.0' : { $exists : true }
        };

        if (longitude && latitude && longitude !== NaN && latitude !== NaN) {
            query['merchantInfo.location'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coords
                    },
                    $maxDistance: maxDistance
                }
            }
        }

        if (categories.length > 0) {
            query['merchantInfo.categories'] = {
                $in: categories
            }
        }

        Merchant.find(query)
        .limit(limit)
        .skip(skip * 5)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward',
            select: 'name'
        })
        .exec(function (err, users) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (users.length === 0) {
                res.status(404).send({ message: 'Sorry there is no reward around you.'});
            } else {
                var counter = 0;
                var max = users.length - 1;
                var markerInfo = [];
                users.forEach(function (user) {
                    var info = {
                        _id: user._id,
                        name: user.merchantInfo.companyName,
                        email: user.email,
                        mobile: user.merchantInfo.mobileNumber,
                        details: user.merchantInfo.companyDetails,
                        logo: user.merchantInfo.logo || null,
                        banner: user.merchantInfo.banner || null,
                        address: user.merchantInfo.address + ', ' + user.merchantInfo.city,
                        location: {
                            long: user.merchantInfo.location[0] || null,
                            lat: user.merchantInfo.location[1] || null
                        },
                        rating: user.merchantInfo.rating.value,
                        reward: user.merchantInfo.rewards[0],
                        rewards: user.merchantInfo.rewards,
                        count: user.merchantInfo.rewards.length,
                        category: user.merchantInfo.categories[Math.floor(Math.random() * user.merchantInfo.categories.length)]
                    }
                    
                    markerInfo.push(info);

                    if (counter === max) {
                        res.status(200).send(markerInfo);
                    } else {
                        counter++;
                    }
                });
            }
        });
    },


    /**
     * @api {post} /merchant/recent Retrieve most recent merchants
     * @apiName mostRecent
     * @apiGroup Merchant
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {Number} limit The number of merchants to return (Optional)
     * @apiParam {Number} skip The page based on index. 0 stands for the first page, 1 stands for the 2nd. (Optional)
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The company's name
     * @apiSuccess {String} mobile The merchant's mobile number
     * @apiSuccess {String} details The merchant's company details
     * @apiSuccess {Object} logo An object containing url {String} url of image
     * @apiSuccess {Object} banner An object containing url {String} url of image
     * @apiSuccess {String} address The company's address
     * @apiSuccess {Object} location The company's geolocation. long {Number} longitude and lat {Number} latitude.
     * @apiSuccess {Object} reward The company's first reward
     * @apiSuccess {String[]} reward Array containing ids of the rewards
     * @apiSuccess {String} category A random category the company falls under
     * @apiSuccess {boolean} favourite Shows if the merchant is a favourite
     * @apiSuccess {boolean} visited Shows if a merchant has been visited
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  [{
     *     "_id": "string",
     *     "email": "String",
     *     "merchantInfo": {
     *         "companyName": "String",
     *         "companyDetails": "String",
     *         "mobileNumber": "String",
     *         "address": "String",
     *         "city": "String",
     *         "location": [longitude, latitude],
     *         "categories": ["foodndrink", "technology", "healthnbeauty"],
     *         "logo": {
     *             "id": "String".
     *             "url": "String"
     *         },
     *         "banner": {
     *             "id": "String".
     *             "url": "String"
     *         },
     *         "rewards": {
     *             Refer to Rewards Model
     *         },
     *         "rewardsSize": 0,
     *         "rating": {
     *             "value": 5.
     *             "raters": 2
     *         },
     *         "visited": true,
     *         "favourite": false
     *     }
     *  }, {
     *     "email": "String",
     *     "merchantInfo": {
     *         "companyName": "String",
     *         "companyDetails": "String",
     *         "mobileNumber": "String",
     *         "address": "String",
     *         "city": "String",
     *         "location": [longitude, latitude],
     *         "categories": ["foodndrink", "technology", "healthnbeauty"],
     *         "logo": {
     *             "id": "String".
     *             "url": "String"
     *         },
     *         "banner": {
     *             "id": "String".
     *             "url": "String"
     *         },
     *         "rewards": {
     *             Refer to Rewards Model
     *         },
     *         "rewardsSize": 0,
     *         "rating": {
     *             "value": 5.
     *             "raters": 2
     *         },
     *         "visited": false,
     *         "favourite": false
     *     }
     *  }]
     * 
     * @apiError BadRequest Bad request data.
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 BadRequest
     *  {
     *      "message": "BadRequest."
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
     * @apiError MerchantsNotFound No merchants found.
     * 
     * @apiErrorExample MerchantsNotFound:
     *  HTTP/1.1 404 MerchantsNotFound
     *  {
     *      "message": "No new merchants matching your interests."
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
    mostRecent: function(req, res) {
        var limit = req.query.limit || req.body.limit || req.params.limit ||  10;
        var page = req.query.page || req.body.page || req.params.page ||  0;
        var categories = req.user.interests;
        var currentUser = req.user;

        Merchant.find({
            'merchantInfo.categories': {
                $in: categories
            },
            'merchantInfo.rewards.0' : {
                $exists: true
            },
            role : 2
        })
        .select('email merchantInfo')
        .sort({lastAdded: 'desc'})
        .skip(page * limit)
        .limit(limit)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward'
        })
        .exec(function(err, merchants) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (merchants.length === 0) {
                res.status(404).send({ message: 'No new merchants matching your interests.' });
            } else {
                var favourites = (currentUser && currentUser.favourites) ? currentUser.favourites : [];
                var visited = (currentUser && currentUser.visited) ? currentUser.visited : [];
                var info = merchants.map(function(user) {
                    return {
                        _id: user._id,
                        email: user.email,
                        merchantInfo: {
                            companyName: user.merchantInfo.companyName,
                            mobileNumber: user.merchantInfo.mobileNumber,
                            companyDetails: user.merchantInfo.companyDetails,
                            logo: user.merchantInfo.logo,
                            banner: user.merchantInfo.banner,
                            address: user.merchantInfo.address + ', ' + user.merchantInfo.city,
                            city: user.merchantInfo.city,
                            location: user.merchantInfo.location,
                            categories: user.merchantInfo.categories,
                            rating: user.merchantInfo.rating.value,
                            reward: user.merchantInfo.rewards[0],
                            rewards: user.merchantInfo.rewards,
                            rewardsSize: user.merchantInfo.rewards.length,
                        },
                        visited: visited.indexOf(user._id) > -1,
                        favourite: favourites.indexOf(user._id) > -1
                    }
                });

                res.status(200).send(info);
            }
        });
    },

    /**
     * @api {post} /merchant/new Check for notification updates
     * @apiName notificationUpdates
     * @apiGroup Merchant
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {Date} lastChecked Last time the user checked for an update. Can be in string format.
     * 
     * @apiSuccess {Number} total The total number of rewards created since the last time checked.
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "total": 1
     *  }
     * 
     * @apiError BadRequest Bad request data.
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 BadRequest
     *  {
     *      "message": "Invalid date"
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
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
    notificationUpdates: function(req, res) {
        var dateString = req.body.lastChecked || req.params.lastChecked || req.query.lastChecked;
        var lastChecked = new Date(dateString);
        var categories = req.user.interests;
        
        if (!isNaN(Date.parse(lastChecked))) {
            Reward.count({
                createdDate:  {
                    $gte: lastChecked.toString()
                },
                categories: {
                    $in: categories
                }
            }, function(err, count) {
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else {
                    res.status(200).send({
                        total: count
                    });
                }
            });
        } else {
            res.status(400).send({ message: 'Invalid date' });
        }
    },

    /**
     * Get all merchants
     */
    read: function (req, res) {
        var limit = req.body.limit || req.query.limit || req.params.limit || 10;
        var page = req.body.page || req.query.page || req.params.page || 0;
        var query = {
            role: 2
        };

        Merchant.find(query)
        .limit(limit)
        .skip(page * limit)
        .exec(function (err, merchants) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    readById: function(req, res) {
        var id = req.params.id || req.query.id || req.body.id;

        Merchant.findById(id)
        .select('name email merchantInfo isActive status')
        .exec(function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).send(merchant);
            }
        });
    },

    /**
     * @api {get} /merchant/prime Get Featured and Hotlist Merchants
     * @apiName retrieveHotList
     * @apiGroup Merchant
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiSuccess {Object} featured It contains keys 'first', 'second' and 'third' for featured.
     * @apiSuccess {Object[]} hotlist It contains 'id', 'index' and 'url'
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "featured": {
     *          "first": {
     *              "_id": "String",
     *              "email": "String",
     *              "merchantInfo": {
     *                  "companyName": "String",
     *                  "companyDetails": "String",
     *                  "mobileNumber": "String",
     *                  "address": "String",
     *                  "city": "String",
     *                  "location": [longitude, latitude],
     *                  "categories": ["foodndrink", "technology", "healthnbeauty"],
     *                  "logo": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "banner": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "rewards": {
     *                      Refer to Rewards Model
     *                  },
     *                  "rewardsSize": 0,
     *                  "rating": {
     *                      "value": 5.
     *                      "raters": 2
     *                  }
     *              }
     *          },
     *          "second": {
     *              "_id": "String",
     *              "email": "String",
     *              "merchantInfo": {
     *                  "companyName": "String",
     *                  "companyDetails": "String",
     *                  "mobileNumber": "String",
     *                  "address": "String",
     *                  "city": "String",
     *                  "location": [longitude, latitude],
     *                  "categories": ["foodndrink", "technology", "healthnbeauty"],
     *                  "logo": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "banner": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "rewards": {
     *                      Refer to Rewards Model
     *                  },
     *                  "rewardsSize": 0,
     *                  "rating": {
     *                      "value": 5.
     *                      "raters": 2
     *                  }
     *              }
     *          }
     *          "third": {
     *              "_id": "String",
     *              "email": "String",
     *              "merchantInfo": {
     *                  "companyName": "String",
     *                  "companyDetails": "String",
     *                  "mobileNumber": "String",
     *                  "address": "String",
     *                  "city": "String",
     *                  "location": [longitude, latitude],
     *                  "categories": ["foodndrink", "technology", "healthnbeauty"],
     *                  "logo": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "banner": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "rewards": {
     *                      Refer to Rewards Model
     *                  },
     *                  "rewardsSize": 0,
     *                  "rating": {
     *                      "value": 5.
     *                      "raters": 2
     *                  }
     *              }
     *          }
     *      },
     *      "visited": {
     *          "first": true,
     *          "second": false,
     *          "third": false
     *      },
     *      "hotlist": [
     *          "id": {
     *              "_id": "String",
     *              "email": "String",
     *              "merchantInfo": {
     *                  "companyName": "String",
     *                  "companyDetails": "String",
     *                  "mobileNumber": "String",
     *                  "address": "String",
     *                  "city": "String",
     *                  "location": [longitude, latitude],
     *                  "categories": ["foodndrink", "technology", "healthnbeauty"],
     *                  "logo": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "banner": {
     *                      "id": "String".
     *                      "url": "String"
     *                  },
     *                  "rewards": {
     *                      Refer to Rewards Model
     *                  },
     *                  "rewardsSize": 0,
     *                  "rating": {
     *                      "value": 5.
     *                      "raters": 2
     *                  }
     *              }
     *          },
     *          "index": 0,
     *          "url": "http://exmple.com/url-for-banner-image.png"
     *    ]
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
    retrieveHotList: function(req, res) {
        var currentUser = req.user;

        Prime.findOne({})
        .populate({
            path: 'featured.first',
            model: 'User',
            select: 'email merchantInfo'
        })
        .populate({
            path: 'featured.second',
            model: 'User',
            select: 'email merchantInfo'
        })
        .populate({
            path: 'featured.third',
            model: 'User',
            select: 'email merchantInfo'
        })
        .populate({
            path: 'hotlist.id',
            model: 'User',
            select: 'email merchantInfo'
        })
        .exec(function(err, prime) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!prime) {
                res.status(404).send('There are currently no hot merchants.');
            } else {
                Reward.populate(prime, [{
                    path: 'featured.first.merchantInfo.rewards',
                    model: 'Reward',
                    select: 'name'
                }, {
                    path: 'featured.second.merchantInfo.rewards',
                    model: 'Reward',
                    select: 'name'
                }, {
                    path: 'featured.third.merchantInfo.rewards',
                    model: 'Reward',
                    select: 'name'
                }, {
                    path: 'hotlist.id.merchantInfo.rewards',
                    model: 'Reward',
                    select: 'name'
                }], function(err) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        var visited = {
                            first: null,
                            second: null,
                            third: null
                        };

                        if (prime.featured) {
                            if (prime.featured.first) {
                               visited.first = currentUser.visited.indexOf(prime.featured.first._id) > -1; 
                            }
                            if (prime.featured.second) {
                               visited.second = currentUser.visited.indexOf(prime.featured.second._id) > -1; 
                            }
                            if (prime.featured.third) {
                               visited.third = currentUser.visited.indexOf(prime.featured.third._id) > -1; 
                            }
                        }

                        var response = {
                            _id: prime._id,
                            history: prime.history,
                            hotlist: prime.hotlist,
                            featured: prime.featured,
                            visited: visited
                        };

                        res.status(200).send(response);
                    }
                });
            }
        });
    },

    /**
     * @api {post} /merchant/search/:query Search through merchants
     * @apiName search
     * @apiGroup Merchant
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} query The search term to use to search. String; Strings with spaces inbtwn should replace them with & e.g. "/search/an&example" (Optional)
     * @apiParam {String[]} categories An array of categories for the filters (Optional)
     * @apiParam {Number} distance The distance to search through. 3km should be sent as '3' and so on (Optional)
     * @apiParam {Number} limit The number of merchants to return (Optional)
     * @apiParam {Number} skip The page based on index. 0 stands for the first page, 1 stands for the 2nd. (Optional)
     * @apiParam {Number} longitude From geolocation (Optional)
     * @apiParam {Number} latitude From geolocation (Optional)
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The company's name
     * @apiSuccess {String} mobile The merchant's mobile number
     * @apiSuccess {String} details The merchant's company details
     * @apiSuccess {Object} logo An object containing url {String} url of image
     * @apiSuccess {Object} banner An object containing url {String} url of image
     * @apiSuccess {String} address The company's address
     * @apiSuccess {Object} location The company's geolocation. long {Number} longitude and lat {Number} latitude.
     * @apiSuccess {Object} reward The company's first reward
     * @apiSuccess {String[]} reward Array containing ids of the rewards
     * @apiSuccess {String} category A random category the company falls under
     * @apiSuccess {Boolean} visited To know if the user has visited the merchant
     * @apiSuccess {Boolean} favourite To know if the user has the merchant as a favourite
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  [{
     *     "_id": 5b7ab4ce24688b0adcb9f54b,
     *     "name": "The Palms",
     *     "email": "thepalms@email.com",
     *     "mobile": "09045673289",
     *     "details": "A mall full of many surprises.",
     *     "logo": {
     *          "id": "coupin/palms-logo",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-logo.png"
     *     },
     *     "banner": {
     *          "id": "coupin/palms-banner",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-banner.png"
     *     },
     *     "address": "25A Adeola Odeku Street, V.I, Lagos",
     *     "location": {
     *         "long": 3.467894,
     *         "lat": 6.455654
     *     },
     *     "rating": 5,
     *     "reward": {
     *          Refer to Reward Model
     *     },
     *     "rewards": ["5b7ab4ce24688b0adcb9f542", "5b7ab4ce24688b0adcb9f541"],
     *     "category": "foodndrink"
     *  }]
     * 
     * @apiError BadRequest Bad request data.
     * 
     * @apiErrorExample BadRequest:
     *  HTTP/1.1 400 BadRequest
     *  {
     *      "message": "BadRequest."
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
     * @apiError MerchantsNotFound No merchants found.
     * 
     * @apiErrorExample MerchantsNotFound:
     *  HTTP/1.1 404 MerchantsNotFound
     *  {
     *      "message": "No Merchants under that name was found"
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
    search: function (req, res) {
        var query = req.params.query || req.body.query || req.params.query || [' '];

        if (!Array.isArray(query)) {
            query = query.split('&');
        }

        var currentUser = req.user;

        var categories = req.body.categories ? JSON.parse(req.body.categories) : [];
        var limit = req.body.limit || req.query.limit || req.params.limit || 7;
        var page = req.body.page || req.query.page || req.params.page || 0;

        var longitude = req.body.long || req.query.long || req.params.long;
        var latitude = req.body.lat || req.query.lat || req.params.lat;
        var maxDistance = req.body.distance || req.query.distance || 5;
        maxDistance *= 1000;
        
        if (Array.isArray(query)) {
            for (var x = 0; x < query.length; x++) {
                query[x] = new RegExp(query[x], 'i');
            }
        }

        var fullQuery = { $or: [
            {
                'merchantInfo.companyName': { 
                    '$in' : query
                }
            }, {
                'merchantInfo.companyDetails': {
                    '$in' : query
                }
            }, {
                'merchantInfo.categories': {
                    '$in' : query
                }
            }, {
                'merchantInfo.address': {
                    '$in' : query
                }
            }, {
                'merchantInfo.city': {
                    '$in' : query
                }
            }],
            'merchantInfo.rewards.0' : {
                $exists: true
            },
            isActive: true,
            role: 2
        };

        if (categories.length > 0) {
            fullQuery['merchantInfo.categories'] = {
                $in: categories
            }
        }

        Merchant.find(fullQuery)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward',
            select: 'name'
        })
        .limit(limit)
        .skip(page * limit)
        .exec(function (err, merchants) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (merchants.length === 0) {
                res.status(404).send({message: 'No Merchants under that name was found'});
            } else {
                var counter = 0;
                var max = merchants.length - 1;
                var result = [];

                merchants.forEach(function (user) {
                    var info = {
                        _id: user._id,
                        name: user.merchantInfo.companyName,
                        email: user.email,
                        mobile: user.merchantInfo.mobileNumber,
                        details: user.merchantInfo.companyDetails,
                        logo: user.merchantInfo.logo || null,
                        banner: user.merchantInfo.banner || null,
                        address: user.merchantInfo.address + ', ' + user.merchantInfo.city,
                        location: {
                            long: user.merchantInfo.location[0] || null,
                            lat: user.merchantInfo.location[1] || null
                        },
                        rating: user.merchantInfo.rating.value,
                        reward: user.merchantInfo.rewards[0],
                        rewards: user.merchantInfo.rewards,
                        count: user.merchantInfo.rewards.length,
                        category: user.merchantInfo.categories[Math.floor(Math.random() * user.merchantInfo.categories.length)],
                        visited: currentUser.visited.indexOf(user._id) > -1,
                        favourite: currentUser.favourites.indexOf(user._id) > -1
                    }
                    
                    result.push(info);

                    if (counter === max) {
                        res.status(200).send(result);
                    } else {
                        counter++;
                    }
                });
            }
        });
    },

    statusUpdate: function(req, res) {
        var id = req.params.id || req.query.id || req.body.id;
        var body = req.body;
        var pdfFile = path.join(__dirname, '../pdf/Coupin Merchant Quick Setup Guide.pdf');

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!merchant) {
                res.status(404).send({message: 'No such user exists'});
            } else {
                merchant.status = body.status;

                if (body.location) {
                    merchant.merchantInfo.location = [body.location.long, body.location.lat];
                }

                if (body.rating) {
                    merchant.merchantInfo.rating.value = body.rating;
                }

                if (body.reason) {
                    merchant.reason = body.reason;
                }

                merchant.save(function(err) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        if (body.status === 'accepted') {
                            emailer.sendEmail(
                                merchant.email,
                                'Registration Approved',
                                messages.approved(merchant._id, emailer.getUiUrl(), merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() })),
                                pdfFile,
                                function(response) {
                                    res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.merchantInfo.companyName });
                                }
                            );
                        } else if (body.status === 'rejected') {
                            emailer.sendEmail(
                                merchant.email, 
                                merchant.merchantInfo.companyName + ' Registration Rejected`',
                                messages.rejected(merchant.reason, merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() })),
                                function(response) {
                                    res.status(200).send({ message: 'Merchant Declined and email sent to ' + merchant.merchantInfo.companyName });
                                }
                            );
                        } else {
                            res.status(200).send({message: `Status is now ${req.body.status}.`});
                        }
                    }
                });
            }
        });
    },

    update: function (req, res) {
        var id = req.params.id || req.query.id || req.body.id;
        var body = req.body;

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!merchant) {
                res.status(404).send({message: 'No such user exists'});
            } else {
                if (body.email) {
                    merchant.email = body.email;
                }

                ['companyName', 'companyDetails', 'mobileNumber', 'address', 'city', 'state', 'location', 'categories', 'logo', 'banner', 'rating'].forEach(key => {
                    if (body[key]) {
                        merchant.merchantInfo[key] = body[key];
                    }
                });

                merchant.modifiedDate = Date.now();

                // save the customer updateCustomer
                merchant.save(function(err) {
                    if (err) {
                        res.status(500).send(err);
                        Raven.captureException(err);
                    } else {
                        res.status(200).send({
                            id: merchant._id,
                            email: merchant.email,
                            isActive: true,
                            merchantInfo: merchant.merchantInfo,
                            picture: merchant.picture,
                            isSuper: req.user.role === 0
                        });
                    }

                });
            }
        });
    }
}