const emailer = require('../../config/email');
const Merchant = require('../models/users');

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
            } else if (merchant) {
                res.status(409).send({message: 'User already exists'});
            } else {
                let merchant = new Merchant({
                    email: body.email,
                    picture: body.picture || null,
                    password: body.password || 'merchant',
                    merchantInfo: {
                        companyName: body.companyName,
                        companyDetails: body.companyDetails,
                        address: body.address,
                        city: body.city,
                        mobileNumber: body.mobileNumber,
                        location: [body.longitude, body.latitude]
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

    /**
     * Changeg the status of the merchants
     */
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

    /**
     * Handles merchant confirmation
     */
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

    /**
     * Delete one merchant
     */
    deleteOne: function(req, res) {
        Merchant.findByIdAndRemove(req.params.id, function(err, merchant) {
            if(err)
            throw err;

            res.send({message: 'Merchant Deleted'});
        });
    },

    /**
     * Get all merchants
     */
    getAllMerchants: function (req, res) {
        Merchant.find({role: 2}, function (err, merchants) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    /**
     * Get merchant confirmation page
     */
    getConfirmationPage: function(req, res) {
        // load the merchant registration page
        Merchant.findById(req.params.id, function(err, merchant){
            if(err)
            res.sendfile('./public/views/error.html');

            if('activated' in merchant && merchant.activated) {
            res.sendfile('./public/shared/views/merchantReg.html');
            } else {
            res.sendfile('./public/shared/views/merchantCon.html');
            }
        });
    },

    /**
     * Get one merchant
     */
    getOne: function(req, res) {
        Merchant.findById(req.params.id, function(err, merchant) {
            if (err)
            throw(err);

            res.json(merchant);
        })
    },

    getRegPage: function(req, res) {
        // load the merchant registration page
        res.sendfile('./public/shared/views/merchantReg.html');
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

        Users.find(query)
        .limit(limit)
        .skip(skip * 5)
        .exec(function (err, users) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (users.length === 0) {
                res.status(404).send({ message: 'Sorry there is no reward around you '});
            } else {
                var counter = 0;
                var max = users.length - 1;
                var markerInfo = [];
                users.forEach(function (user) {
                    Rewards.find({merchantID: user._id}, function (error, rewards) {
                        if (error) {
                            res.status(500).send(error);
                        } else if (rewards.length > 0) {
                            const info = {
                                _id: user._id,
                                name: user.merchantInfo.companyName,
                                email: user.email,
                                mobile: user.merchantInfo.mobileNumber,
                                details: user.merchantInfo.companyDetails,
                                picture: user.picture || null,
                                address: user.merchantInfo.address + ', ' + user.merchantInfo.city,
                                location: {
                                    long: user.merchantInfo.location[0] || null,
                                    lat: user.merchantInfo.location[1] || null
                                },
                                rewards: rewards
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

        Users.find({
            'merchantInfo.categories': {
                $in: categories
            }
        })
        .sort({createdDate: 'desc'})
        .limit(limit)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward'
        })
        .exec(function(err, merchants) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    notificationUpdates: function(req, res) {
        const temp = req.body.lastChecked || req.params.lastChecked || req.query.lastChecked;

        const lastChecked = moment(temp);
        

        Rewards.find({
           createdDate:  {
               $gte: lastChecked.toString()
           }
        }).select('name').exec(function(err, rewards) {
            res.send({total: rewards.length});
        });
    },

    /**
     * Get the hot list
     */
    retrieveHotList: function(req, res) {
        const limit = req.body.limit || 3;

        Users.find({
            'merchantInfo.hot.status': true
        })
        .populate('merchantInfo.rewards')
        .sort({ 'merchantInfo.hot.starts': 'desc' })
        .limit(limit)
        .exec(function(err, users) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(users);
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

    search: function (req, res) {
        let query = req.params.query || req.body.query || req.params.query || [' '];
        if (!Array.isArray(query)) {
            query = query.split(' ');
        }

        const categories = JSON.parse(req.body.categories) || [];
        let limit = req.body.limit || req.query.limit || req.params.limit || 10;

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
            // 'merchantInfo.location' : {
            //     $near: coords,
            //     $maxDistance: maxDistance
            // },
            "merchantInfo.rewards.0" : { "$exists" : true },
            role: 2
        };

        if (categories.length > 0) {
            fullQuery['merchantInfo.categories'] = {
                $in: categories
            }
        }

        //TODO: Finally Decide whether to make location a factor
        // if (typeof longitude !== Number) {
        //     longitude = parseFloat(longitude);
        // }

        // if (typeof latitude !== Number) {
        //     latitude = parseFloat(latitude);
        // }

        // const coords = [longitude, latitude];

        Users.find(fullQuery)
        .populate({
            path: 'merchantInfo.rewards',
            model: 'Reward'
        })
        .limit(limit)
        .exec(function (err, merchants) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (merchants.length === 0) {
                res.status(404).send({message: 'No Merchants under that name was found'});
            } else {
                res.status(200).send(merchants);
            }
        });
    },

    update: function (req, res) {
        const body = req.body;

        Merchant.findById(req.params.id, function(err, merchant) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (!merchant) {
                res.status(404).send({message: 'No such user exists'});
            } else {
                if (body.email) {
                    merchant.email = body.email;
                }

                ['companyName', 'companyDetails', 'mobileNumber', 'address', 'city', 'state', 'location', 'categories', 'logo', 'banner'].forEach(key => {
                    if (body.merchantInfo[key]) {
                        merchant.merchantInfo[key] = body.merchantInfo[key];
                    }
                });
                
                merchant.modifiedDate = Date.now();

                // save the customer updateCustomer
                merchant.save(function(err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({
                            id: merchant._id,
                            email: merchant.email,
                            merchantInfo: merchant.merchantInfo,
                            picture: merchant.picture
                        });
                    }

                });
            }
        });
    },

    populate: function(req, res) {
        Merchant.find({'merchantInfo.categories' : {
            $in: ['foodndrinks']
        }}, function(err, users) {
            // for(var t = 0; t < users.length; t++) {
            //     if (t%2 === 0) {
            //         users[t].merchantInfo['categories'] = ['foodndrinks', 'shopping', 'gadgets'];
            //         users[t].save();
            //     } else {
            //         users[t].merchantInfo['categories'] = ['foodndrinks', 'entertainment', 'travel', 'tickets'];
            //         users[t].save();
            //     }
            // }

            res.status(200).send(users);
        });
    }
}