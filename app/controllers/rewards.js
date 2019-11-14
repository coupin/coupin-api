'use strict';
var _ = require('lodash');
var moment = require('moment');
var Raven = require('./../../config/config').Raven;
var shortCode = require('shortid32');

var Booking = require('../models/bookings');
var Emailer = require('../../config/email');
var Merchant = require('../models/users');
var Messages = require('../../config/messages');
var Reward = require('./../models/reward');

module.exports = {
    adminCreate: function (req, res) {
        // Form Validator
        req.checkBody('name','Name field is required').notEmpty();
        req.checkBody('description','Description field is required').notEmpty();
        req.checkBody('categories','Categories field is required').notEmpty();
        req.checkBody('multiple','The Multiple field is required').notEmpty();
        req.checkBody('startDate','Start Date field is required').notEmpty();
        req.checkBody('endDate','End Date field is required').notEmpty();
        req.checkBody('applicableDays','Applicable Days field is required').notEmpty();

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
            res.status(400).send({ message: errors });
        } else{
            Reward.findOne({ name: req.body.name }, function (err, reward) {
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else if (reward) {
                    res.status(409).send({message: 'There is already a reward with that name'});
                } else {
                    // Get information of reward
                    var newReward = {
                        name : req.body.name,
                        merchantID : req.user.id || req.body.merchantID,
                        description :  req.body.description,
                        categories : req.body.categories,
                        startDate : req.body.startDate,
                        endDate : req.body.endDate,
                        multiple :  req.body.multiple,
                        applicableDays : req.body.applicableDays,
                        price: req.body.price,
                        delivery: req.body.delivery,
                        createdDate: Date.now(),
                        isActive: true,
                        status: 'active'
                    };

                    // Create new reward
                    var reward = new Reward(newReward);

                    reward.save(function (err) {
                        if(err) {
                            res.status(500).send(err);
                            Raven.captureException(err);
                        } else {
                            res.status(200).send(reward);                            
                            Merchant.findById(reward.merchantID, function(err, merchant) {
                                //TODO: 
                                merchant.merchantInfo.pendingRewards.push(reward._id);
                                merchant.merchantInfo.rewardsSize = merchant.merchantInfo.rewardsSize + 1;
                                merchant.merchantInfo.lastAdded = new Date();
                                if (moment(merchant.merchantInfo.latestExp).isBefore(reward.endDate)) {
                                    merchant.merchantInfo.latestExp = reward.endDate;
                                }
                                merchant.merchantInfo.categories = _.union(merchant.merchantInfo.categories, req.body.categories);

                                merchant.save(function(err) {
                                    if (err) {
                                        Raven.captureException(err);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        };
    },
    create: function (req, res) {
        // Form Validator
        req.checkBody('name','Name field is required').notEmpty();
        req.checkBody('description','Description field is required').notEmpty();
        req.checkBody('categories','Categories field is required').notEmpty();
        req.checkBody('multiple','The Multiple field is required').notEmpty();
        req.checkBody('startDate','Start Date field is required').notEmpty();
        req.checkBody('endDate','End Date field is required').notEmpty();
        req.checkBody('applicableDays','Applicable Days field is required').notEmpty();

        // Check Errors
        var errors = req.validationErrors();

        if(errors){
            res.status(400).json({ message: errors });
        } else {
            Reward.findOne({ name: req.body.name }, function (err, reward) {
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else if (reward) {
                    res.status(409).send({message: 'There is already a reward with that name'});
                } else {
                    console.log(req.body.startDate);
                    console.log(req.body.endDate);
                    // Get information of reward
                    var newReward = {
                        name : req.body.name,
                        merchantID : req.user.id || req.body.merchantID,
                        description :  req.body.description,
                        categories : req.body.categories,
                        startDate : req.body.startDate,
                        endDate : req.body.endDate,
                        multiple :  req.body.multiple,
                        applicableDays : req.body.applicableDays,
                        price: req.body.price,
                        delivery: req.body.delivery,
                        status: req.body.status,
                        createdDate: Date.now()
                    };

                    // Create new reward
                    var reward = new Reward(newReward);

                    reward.save(function (err) {
                        if(err) {
                            res.status(500).send(err);
                            Raven.captureException(err);
                        } else {
                            res.status(200).send(reward);          
                            Merchant.findById(reward.merchantID, function(err, merchant) {
                                if (err) {
                                    Raven.captureException(err);
                                } else {
                                    merchant.merchantInfo.pendingRewards.push(reward._id);
                                    merchant.merchantInfo.rewardsSize = merchant.merchantInfo.rewards.length;
                                    merchant.merchantInfo.categories = _.union(merchant.merchantInfo.categories, req.body.categories);

                                    merchant.save(function(err) {
                                        if (err) {
                                            Raven.captureException(err);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        };
    },
    delete: function (req, res) {
        var id = req.params.id || req.body.id || req.query.id;
        Reward.findByIdAndRemove(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while deleting the reward', error: err });
                Raven.captureException(err);
            } else {
                res.status(200).send({message: 'Reward successfully deleted'});
            }
        });
    },
    getOne: function(req, res) {
        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).send(reward);
            }
        });
    },
    toggleStatus: function(req, res) {
        var id = req.params.id;
        var today = moment(new Date());

        Reward.findById(id, function (err, reward) {
            if (err) {
                res.status(500).send(err);
            } else if (!reward) {
                res.status(404).send({message: 'There is no such reward'});
            } else {
                reward.isActive = !reward.isActive;
                reward.status = req.body.status || reward.status;
                var status = reward.isActive ? 'Activated' : 'Deactivated';
                reward.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: `Reward successfully ${status}`});
                        if (status === 'active' && today.isSameOrAfter(reward.startDate) && today.isBefore(reward.endDate)) {
                            Merchant.findById(reward.merchantID, function(err, merchant) {
                                var index = merchant.merchantInfo.pendingRewards.indexOf(id);
                                merchant.merchantInfo.pendingRewards.splice(index, 1);
                                merchant.merchantInfo.rewards.push(id);
                                merchant.save();
                            });
                        }
                    }
                });
            }
        });
    },
    /**
     * Read rewards belonging to particular merchant
     * params(*) req
     */
    read: function(req, res) {
        var id = req.params.id || req.user.id;
        var query = req.params.query || req.query.query;
        var opt = {};
        var page = req.params.page || req.query.page || 1;
        page -= 1;
        
        if (id) {
            opt['merchantID'] = id;
        }

        if (query) {
            opt['$and'] = [
                { 
                    $or: [{
                        name: {
                            $regex: query,
                            $options: 'i'
                        }
                    }]
                },
                { 
                    $or: [{
                        description: {
                            $regex: query,
                            $options: 'i'
                        }
                    }]
                }
            ];
        };

        Reward.find(opt)
        .limit(10)
        .sort({ createdDate: -1  })
        .skip(10 * page)
        .exec(function(err, rewards) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).json(rewards);
            }
        });
    },

    /**
     * @api {get} /rewards/merchant/:id Retrieve a merchnt's rewards
     * @apiName readByMerchant
     * @apiGroup Rewards
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {Number} page Index of pages i.e. 0 for page 1 and so on.
     * @apiParam {String} merchantId id of the merchant
     * 
     * @apiSuccess {String} _id The id of reward
     * @apiSuccess {String} name The name of the reward
     * @apiSuccess {String} description The description of the reward
     * @apiSuccess {String} merchantID The id of the merchant that the reward belongs to
     * @apiSuccess {String[]} categories String array of categories
     * @apiSuccess {Date} startDate The date that the reward starts
     * @apiSuccess {Date} endDate The date that the reward ends
     * @apiSuccess {String[]} pictures String array of pictures belonging to the reward
     * @apiSuccess {Date} createdDate The date that the reward was created
     * @apiSuccess {Date} modifiedDate The date that the reward was modified
     * @apiSuccess {Object} multiple The object containing status {boolean} true for yes and false for no, capacity {Number}
     * @apiSuccess {Object} price The object containing old {Number} and new {Number}
     * @apiSuccess {Number[]} applicableDays An array of applicaple days 0 for Monday, 1 for Tuesday and so on
     * @apiSuccess {Boolean} isActive To tell if the reward is active
     * @apiSuccess {Boolean} delivery If the reward can be delivered
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  [{
     *     "_id": "5b7ab4ce24688b0adcb9f54b",
     *     "name": "Test Reward",
     *     "merchantID": "0b7ab4ce24688b0adcb9f544",
     *     "categories": ["foodndrink"],
     *     "startDate": "2018-08-22",
     *     "endDate": "2018-08-28",
     *     "pictures": [{
     *          "id": "coupin/test",
     *          "url": "http://www.example.com/coupin/test.png"
     *     }],
     *     "createdDate": "2018-08-20",
     *     "modifiedDate": "2018-08-20",
     *     "multiple": [{
     *          "status": true,
     *          "capacity": 2
     *     }],
     *     "price": [{
     *          "old": 1500,
     *          "new": 1200
     *     }],
     *     "applicableDays": [0, 1, 2, 5],
     *     "status": "active",
     *     "delivery": true
     *  }]
     * 
     * @apiError Unauthorized Invalid token.
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Unauthorized
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError FavouriteNotFound Invalid token.
     * 
     * @apiErrorExample RewardNotFound:
     *  HTTP/1.1 404 RewardNotFound
     *  {
     *      "message": "There no more rewards available."
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
    readByMerchant: function(req, res) {
        var id = req.params.id || req.query.id || req.body.id;
        var limit = req.params.limit || req.query.limit || req.body.limit || 10;
        var page = req.params.page || req.query.page || req.body.page || 0;

        if (typeof limit !== Number) {
            limit = parseInt(limit);
        }

        if (typeof page !== Number) {
            page = parseInt(page);
        }

        var query = {};
        var date = new Date();

        if (req.user.role === 3) {
            query["startDate"] = {
                $lte: date
            };

            query["endDate"] = {
                $gte: date
            };
        }

        if (id !== '0') {
            query['merchantID'] = id;
        }
        
        if (req.query.status && req.query.status !== 'all') {
            query['status'] = req.query.status;
        } else {
            query['status'] = 'active';
        }

        Reward.find(query)
        .sort('-startDate')
        .populate({
            path: 'merchantID',
            model: 'User',
            select: 'merchantInfo.companyName'
        })
        .limit(limit)
        .skip(page * limit)
        .exec(function(err, rewards) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else if (!rewards) {
                res.status(404).send({ message: 'There no more rewards available.' });
            } else {
                res.status(200).send(rewards);
            }
        });
    },
    readByRequests: function(req, res) {
        var limit = req.params.limit || req.query.limit || req.body.limit || 10;
        var page = req.params.page || req.query.page || req.body.page || 0;

        if (typeof limit !== Number) {
            limit = parseInt(limit);
        }

        if (typeof page !== Number) {
            page = parseInt(page);
        }

        Reward.find({
            status: 'isPending'
        })
        .limit(10)
        .skip(page * limit)
        .populate('merchantID', 'merchantInfo.companyName')
        .exec(function(err, rewards) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                res.status(200).send(rewards);
            }
        });
    },
    updateReview: function(req, res) {
        var body = req.body;
        var title = '';

        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while retreiving the reward', error: err });
                Raven.captureException(err);
            } else if (!reward) {
                res.status(404).send({ message: 'There is no reward matching that id' });
            } else {
                if (!reward.review) {
                    reward['review'] = [];
                }
                reward.review.push(body.review);
                reward.status = body.status;

                if (reward.status === 'active' && !reward.isActive) {
                    title = `${reward.name} Approved.`;
                    reward.isActive = true;
                }

                if (reward.status === 'inactive' || reward.status === 'expired' && reward.isActive) {
                    title = `${reward.name} Requires Changes.`;
                    reward.isActive = false;
                }

                reward.modifiedDate = Date.now();
                reward.save(function(err) {
                    if (err) {
                        res.status(500).send({ message: 'An error occured while updating the reward' });
                        Raven.captureException(err);
                    } else {
                        res.status(200).send({ message: 'Review added successfully.' });
                        Reward.populate(reward, {
                            path:"merchantID",
                            model: 'User',
                            select: 'email merchantInfo.companyName'
                        }, function(err, reward) {
                            if (err) {
                                console.log(`Email about reward failed to send to ${reward.merchantID.merchantInfo.companyName} at ${(new Date().toDateString())}`);
                            } else {
                                const status = reward.isActive ? 'accepted' : 'reviewed and changes are required';
                                Emailer.sendEmail(reward.merchantID.email, title, Messages.reviewed(reward.name, status), function(response) {
                                    console.log(`Email sent to ${reward.merchantID.merchantInfo.companyName} at ${(new Date().toDateString())}`);
                                });
                            }
                        });
                    }
                });
            }
        });
    },
    updateReward: function (req, res) {
        var body = req.body;

        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while retreiving the reward', error: err });
                Raven.captureException(err);
            } else if (!reward) {
                res.status(404).send({ message: 'There is no reward matching that id' });
            } else {
                ['name', 'description', 'categories', 'startDate', 'endDate', 'pictures', 'multiple',
                'applicableDays', 'price', 'delivery', 'status'].forEach(function(key) {
                    if (body[key]) {
                        reward[key] = body[key];
                    }
                });

                reward.modifiedDate = Date.now();

                reward.save(function(err) {
                    if (err) {
                        res.status(500).send({ message: 'An error occured while updating the reward' });
                        Raven.captureException(err);
                    } else {
                        res.status(200).send({ message: 'Reward Updated' });
                    }
                });
            }
        });
    }
}