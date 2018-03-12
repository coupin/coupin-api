'use strict';
const _ = require('lodash');
const shortCode = require('shortid32');

const Booking = require('../models/bookings');
const Merchant = require('../models/users');
const Reward = require('./../models/reward');

module.exports = {
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
        } else{
            Reward.findOne({ name: req.body.name }, function (err, reward) {
                if (err) {
                    res.status(500).send(err);
                    throw new Error(err);
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
                    createdDate: Date.now(),
                    isActive: true
                    };

                    // Create new reward
                    var reward = new Reward(newReward);

                    reward.save(function (err) {
                        if(err) {
                            res.status(500).send(err);
                            throw new Error(err);
                        } else {
                            res.status(200).send(reward);                            
                            Merchant.findById(reward.merchantID, function(err, merchant) {
                                merchant.merchantInfo.lastAdded = new Date();

                                merchant.save();
                            });
                        }
                    });
                }
            });
        };
    },
    delete: function (req, res) {
        const id = req.params.id || req.body.id || req.query.id;
        Reward.findByIdAndRemove(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while deleting the reward', error: err });
                throw new Error(err);
            } else {
                res.status(200).send({message: 'Reward successfully deleted'});
            }
        });
    },
    getOne: function(req, res) {
        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(reward);
            }
        });
    },
    save: function (req, res) {
        let rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
        let rewardId = rewardString.split(" ");
        rewardId = _.without(rewardId, "");

        Booking.findOne({ $and: 
            [{ 
                rewardId: rewardId,
                userId: req.user._id
            }]
        }, function (err, booking) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } if (booking) {
                res.status(409).send({ message: 'Coupin already exists.' });
            } else {
                const booking = new Booking({
                    userId: req.user._id,
                    merchantId: req.body.merchantId,
                    rewardId: rewardId,
                    useNow: false
                });

                booking.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                        throw new Error(err);
                    } else {
                        Booking
                        .populate(booking, { 
                            path: 'rewardId'
                        }, function (err, booking) {
                            if (err) {
                                res.status(500).send(err);
                                throw new Error(err);
                            } else {
                                res.status(201).send(booking);
                            }
                        });
                    }
                });
            }
        });
    },
    toggleStatus: function(req, res) {
        Reward.findById(req.params.id, function (err, reward) {
            if (err) {
                res.status(500).send(err);
            } else if (!reward) {
                res.status(404).send({message: 'There is no such reward'});
            } else {
                reward.isActive = !reward.isActive;
                const status = reward.isActive ? 'Activated' : 'Deactivated';
                reward.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: `Reward successfully ${status}`});
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
        var page = req.params.page || req.query.page || 1;
        page -= 1;

        var opt = {};
        
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
        .skip(10 * page)
        .exec(function(err, rewards) {
            if (err) {
            res.status(500).send(err);
            throw new Error(err);
            } else {
            res.status(200).json(rewards);
            }
        });
    },
    updateReward: function (req, res) {
        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while retreiving the reward', error: err });
                throw new Error(err);
            } else if (!reward) {
                res.status(404).send({ message: 'There is no reward matching that id' });
            } else {
                reward.name = req.body.name || reward.name;
                reward.description = req.body.description || reward.description;
                reward.categories = req.body.categories || reward.categories;
                reward.startDate = req.body.startDate || reward.startDate;
                reward.endDate = req.body.endDate || reward.endDate;
                reward.pictures = req.body.pictures || reward.pictures;
                reward.multiple =  req.body.multiple || reward.multiple;
                reward.applicableDays = req.body.applicableDays || reward.applicableDays;
                reward.price = req.body.price || reward.price;
                reward.modifiedDate = Date.now();

                reward.save(function(err) {
                    if (err) {
                        res.status(500).send({ message: 'An error occured while updating the reward' });
                        throw new Error(err);
                    } else {
                        res.status(200).send({ message: 'Reward Updated' });
                    }
                });
            }
        });
    }
}