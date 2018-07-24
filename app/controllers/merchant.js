const moment = require('moment');

const emailer = require('../../config/email');
const Merchant = require('../models/users');
const Reward = require('./../models/reward');

// Coupin App Messages
const messages = require('../../config/messages');

module.exports = {
    /**
     * Handles creation of merchants
     */
    adminCreate: function (req, res) {
        const body = req.body;

        Merchant.findOne({email: body.email}, function (err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (merchant) {
                res.status(409).send({message: 'User already exists'});
            } else {
                let merchant = new Merchant({
                    email: body.email,
                    password: body.password || 'merchant',
                    merchantInfo: {
                        companyName: body.companyName,
                        companyDetails: body.companyDetails,
                        address: body.address,
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

                Merchant.createCustomer(merchant, function (err) {
                    if (err) {
                        res.status(500).send(err);
                        throw new Error(err);
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
        const body = req.body;
        const id = req.params.id || req.query.id || req.body.id;

        if (!body.accepted || !body.details) {
            res.status(400).send({ message: 'Bad body in request.' });
        }

        Merchant.findById(id, function (err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
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
                        throw new Error(err);
                    } else {
                        if (decision.accepted) {
                            emailer.sendEmail(merchant.email, 'Registration Approved', messages.approved(merchant._id, emailer.getUiUrl()), function(response) {
                                res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.companyName });
                            });
                        } else {
                            emailer.sendEmail(merchant.email, `${merchant.merchantInfo.companyName} Registration Rejected`, messages.rejected(merchant.reason), function(response) {
                                res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.companyName });
                            });
                        }
                    }
                });
            }
        });
    },

    billing: function(req, res) {
        const body = req.body;
        const id = req.params.id || req.query.id || req.body.id;

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (!merchant) {
                res.status(404).send({ message: 'User does not exist.' });
            } else {
                merchant.merchantInfo.billing.plan = body.plan;
                if (!merchant.merchantInfo.billing.history) {
                    merchant.merchantInfo.billing.history = [];
                }
                merchant.merchantInfo.billing.history.push({
                    plan: body.plan,
                    reference: body.reference
                });

                merchant.save(function(err, merchant) {
                    if (err) {
                        res.status(500).send(err);
                        throw new Error(err);
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
        const id = req.params.id || req.query.id || req.body.id;

        // get the data from the the
        const address = req.body.address;
        const city = req.body.city;
        const password = req.body.password;
        const state = req.body.state;
        const billing = req.body.billing;

        // Form Validator
        req.checkBody('address','Address field is required').notEmpty();
        req.checkBody('password','Password field is required').notEmpty();
        req.checkBody('password2', 'Please confirm password').notEmpty();
        req.checkBody('password2', 'Passwords are not the same').equals(req.body.password);
        req.checkBody('city', 'City field is required').notEmpty();
        req.checkBody('state', 'State field is required').notEmpty();
        req.checkBody('billing', 'Billing info is required').notEmpty();

        const errors = req.validationErrors();

        if (errors) {
            res.status(400).send({message: errors[0].msg});
        } else {
            Merchant.findById(id, function(err, merchant){
                if (err) {
                    res.status(500).send(err);
                    throw new Error(err);
                } else if (!merchant) {
                    res.status(404).send({ message: 'Merchant does not exist.' });
                } else {
                    console.log(req.body);
                    merchant.merchantInfo.address = address;
                    merchant.password = password;
                    merchant.merchantInfo.city = city;
                    merchant.merchantInfo.billing = {
                        plan : billing.plan,
                        history : [{
                            plan: billing.plan,
                            date: new Date(billing.date),
                            reference: billing.reference
                        }]
                    };
                    merchant.merchantInfo.state = state;
                    merchant.isActive = true;
                    merchant.status = 'completed';
                    merchant.completedDate = new Date();

                    Merchant.createCustomer(merchant, function(err) {
                        if (err) {
                            res.status(500).send(err);
                            throw new Error(err);
                        } else {
                            res.status(200).send({message: 'Congratulations! Welcome to the family! Please login to continue.'});
                            emailer.sendEmail(merchant.email, 'Congratulations!', messages.completedEmail({
                                name: merchant.merchantInfo.companyName
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
        const id = req.params.id || req.query.id || req.body.id;

        Merchant.findByIdAndRemove(req.params.id, function(err, merchant) {
            if(err)
            throw err;

            res.send({message: 'Merchant Deleted'});
        });
    },

    getByStatus: function(req, res) {
        const status = req.params.status;
        let limit = req.query.limit || req.body.limit || req.params.limit ||  10;
        let skip = req.query.page || req.body.page || req.params.page ||  0;

        Merchant.find({
            status: status,
            role: 2
        }, function(err, merchants) {
            if (err) {
                res.status(500).send(err);
            } else {
                var response = [];

                merchants.forEach(function(merchant) {
                    response.push({
                        id: merchant._id,
                        email: merchant.email,
                        name: merchant.merchantInfo.companyName,
                        mobile: merchant.merchantInfo.mobileNumber,
                        details: merchant.merchantInfo.companyDetails,
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
        Merchant.find({
            role: 2
        }, 'merchantInfo.companyName', function(err, rewards) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(rewards);
            }
        });
    },

     /**
     * Handles info gotten for the mobile markers
     */
    markerInfo: function (req, res) {
        const categories = JSON.parse(req.body.categories) || [];
        let limit = req.query.limit || req.body.limit || req.params.limit ||  4;
        let skip = req.query.page || req.body.page || req.params.page ||  0;
        let longitude = req.query.longitude || req.body.longitude || req.params.longitude;
        let latitude = req.query.latitude || req.body.latitude || req.params.latitude;

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
        let maxDistance = req.body.distance || req.query.distance || req.params.distance || 3;
        maxDistance *= 1000;
        let coords = [longitude, latitude];

        // Convert to radians.radisu of the earth is approxs 6371 kilometers
        maxDistance /= 6371;

        var query = {
            'role' : 2,
            "merchantInfo.rewards.0" : { "$exists" : true }
            // "merchantInfo.latestExp": {
            //     $gte: new Date('03/03/2018')
            // }
        };

        if (longitude && latitude && longitude !== NaN && latitude !== NaN) {
            query['merchantInfo.location'] = {
                $near: coords,
                $maxDistance: maxDistance
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
        .exec(function (err, users) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (users.length === 0) {
                res.status(404).send({ message: 'Sorry there is no reward around you.'});
            } else {
                var counter = 0;
                var max = users.length - 1;
                var markerInfo = [];
                users.forEach(function (user) {
                    Reward.find({
                        merchantID: user._id,
                        status: 'active',
                        startDate: {
                            $lte: new Date()
                        },
                        endDate: {
                            $gte: new Date()
                        }
                    }).limit(2).select('name').exec(function (error, rewards) {
                        console.log(rewards);
                        if (error) {
                            res.status(500).send(error);
                            throw new Error(err);
                        } else if (rewards) {
                            const info = {
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
                                rewards: rewards,
                                count: user.merchantInfo.rewards.length,
                                category: user.merchantInfo.categories[Math.floor(Math.random() * user.merchantInfo.categories.length)]
                            }
                            
                            markerInfo.push(info);
                        }

                        if (counter === max) {
                            res.status(200).send(markerInfo);
                        } else {
                            counter++;
                        }
                    });
                });
            }
        });
    },


    // TODO: Send Back most recent based on users categories
    mostRecent: function(req, res) {
        const limit = req.query.limit || req.body.limit || req.params.limit ||  10;
        const skip = req.query.page || req.body.page || req.params.page ||  0;
        const categories = req.user.interests;

        Merchant.find({
            'merchantInfo.categories': {
                $in: categories
            }
        })
        .sort({lastAdded: 'desc'})
        .limit(limit)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward'
        })
        .exec(function(err, merchants) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    notificationUpdates: function(req, res) {
        const dateString = req.body.lastChecked || req.params.lastChecked || req.query.lastChecked;
        const lastChecked = moment(dateString);
        
        if (lastChecked.isValid()) {
            Reward.find({
                createdDate:  {
                    $gte: lastChecked.toString()
                }
            })
            .select('name')
            .exec(function(err, rewards) {
                if (err) {
                    res.status(500).send(err);
                    throw new Error(err);
                }
                res.send({
                    total: rewards.length,
                    rewards: rewards
                });
            });
        } else {
            res.status(400).send({ message: 'Invalid date' });
        }
    },

    /**
     * Get all merchants
     */
    read: function (req, res) {
        let limit = req.body.limit || req.query.limit || req.params.limit || 10;
        let page = req.body.page || req.query.page || req.params.page || 0;
        const query = {
            role: 2
        };


        Merchant.find(query)
        .limit(limit)
        .skip(page * limit)
        .exec(function (err, merchants) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    readById: function(req, res) {
        const id = req.params.id || req.query.id || req.body.id;

        Merchant.findById(id)
        .select('name email merchantInfo isActive status')
        .exec(function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(merchant);
            }
        });
    },

    /**
     * Get the hot list
     */
    retrieveHotList: function(req, res) {
        const limit = req.body.limit || 3;

        Merchant.find({
            'merchantInfo.hot.status': true
        })
        .populate('merchantInfo.rewards')
        .sort({ 'merchantInfo.hot.starts': 'desc' })
        .limit(limit)
        .exec(function(err, users) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(users);
            }
        });
    },

    search: function (req, res) {
        let query = req.params.query || req.body.query || req.params.query || [' '];
        if (!Array.isArray(query)) {
            query = query.split(' ');
        }

        const categories = JSON.parse(req.body.categories) || [];
        let limit = req.body.limit || req.query.limit || req.params.limit || 10;
        let page = req.body.page || req.query.page || req.params.page || 0;

        let longitude = req.body.long || req.query.long || req.params.long;
        let latitude = req.body.lat || req.query.lat || req.params.lat;
        let maxDistance = req.body.distance || req.query.distance || 50000;
        
        if (Array.isArray(query)) {
            for (var x = 0; x < query.length; x++) {
                query[x] = new RegExp(query[x], 'i');
            }
        }

        let fullQuery = { $or: [
            {
                'merchantInfo.companyName': { 
                    '$in' : query
                }
            }, {
                'merchantInfo.companyDetails': {
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
            "merchantInfo.rewards.0" : { "$exists" : true },
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
            model: 'Reward'
        })
        .limit(limit)
        .skip(page * limit)
        .exec(function (err, merchants) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (merchants.length === 0) {
                res.status(404).send({message: 'No Merchants under that name was found'});
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    statusUpdate: function(req, res) {
        const id = req.params.id || req.query.id || req.body.id;
        const body = req.body;

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (!merchant) {
                res.status(404).send({message: 'No such user exists'});
            } else {
                merchant.status = body.status;

                if (body.rating) {
                    merchant.merchantInfo.rating.value = body.rating;
                }

                if (body.reason) {
                    merchant.reason = body.reason;
                }

                merchant.save(function(err) {
                    if (err) {
                        res.status(500).send(err);
                        throw new Error(err);
                    } else {
                        if (body.status === 'accepted') {
                            emailer.sendEmail(merchant.email, 'Registration Approved', messages.approved(merchant._id, emailer.getUiUrl()), function(response) {
                                res.status(200).send({ message: 'Merchant Aprroved and email sent to ' + merchant.companyName });
                            });
                        } else if (body.status === 'rejected') {
                            emailer.sendEmail(merchant.email, `${merchant.merchantInfo.companyName} Registration Rejected`, messages.rejected(merchant.reason), function(response) {
                                res.status(200).send({ message: 'Merchant Declined and email sent to ' + merchant.companyName });
                            });
                        } else {
                            res.status(200).send({message: `Status is now ${req.body.status}.`});
                        }
                    }
                });
            }
        });
    },

    update: function (req, res) {
        const id = req.params.id || req.query.id || req.body.id;
        const body = req.body;

        Merchant.findById(id, function(err, merchant) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
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
                        throw new Error(err);
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