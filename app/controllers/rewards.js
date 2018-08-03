'use strict';
const _ = require('lodash');
const moment = require('moment');
const schedule = require('node-schedule');
const shortCode = require('shortid32');

const Booking = require('../models/bookings');
const Emailer = require('../../config/email');
const Merchant = require('../models/users');
const Messages = require('../../config/messages');
const Reward = require('./../models/reward');

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
                            throw new Error(err);
                        } else {
                            res.status(200).send(reward);                            
                            Merchant.findById(reward.merchantID, function(err, merchant) {
                                merchant.merchantInfo.rewards.push(reward._id);
                                merchant.merchantInfo.lastAdded = new Date();
                                if (moment(merchant.merchantInfo.latestExp).isBefore(reward.endDate)) {
                                    merchant.merchantInfo.latestExp = reward.endDate;
                                }

                                // Schedule to move to used on expired
                                schedule.scheduleJob(new Date(reward.endDate), function(merchant, reward) {
                                    reward.status = 'expired';
                                    reward.isActive = false;
                                    reward.save();

                                    merchant.merchantInfo.rewards.forEach(function(element) {
                                        return element !== reward._id;
                                    });

                                    if (!merchant.expired) {
                                        merchant.expired = [];
                                    }
                                    merchant.expired.push(reward._id);
                                    merchant.save();
                                }.bind(null, merchant, reward));

                                merchant.save(function(err) {
                                    if (err) {
                                        throw new Error(err);
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
                        delivery: req.body.delivery,
                        status: req.body.status,
                        createdDate: Date.now()
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
                                if (err) {
                                    throw new Error(err);
                                } else {
                                    var rewardsList = merchant.merchantInfo.rewards ? merchant.merchantInfo.rewards : [];
                                    rewardsList.push(reward._id);
                                    merchant.merchantInfo.rewards = rewardsList;

                                    // Schedule to move to used on expired
                                    schedule.scheduleJob(new Date(reward.endDate), function(merchant, reward) {
                                        reward.status = 'expired';
                                        reward.isActive = false;
                                        reward.save();

                                        merchant.merchantInfo.rewards.forEach(function(element) {
                                            return element !== reward._id;
                                        });
                                        merchant.save();
                                    }.bind(null, merchant, reward));

                                    merchant.save(function(err) {
                                        if (err) {
                                            throw new Error(err);
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
                reward.status = req.body.status || reward.status;
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
    readByMerchant: function(req, res) {
        const id = req.params.id || req.query.id || req.body.id;
        let limit = req.params.limit || req.query.limit || req.body.limit || 10;
        let page = req.params.page || req.query.page || req.body.page || 0;

        if (typeof limit !== Number) {
            limit = parseInt(limit);
        }

        if (typeof page !== Number) {
            page = parseInt(page);
        }

        var query = {};

        if (id !== '0') {
            query['merchantID'] = id;
        }
        
        if (req.query.status && req.query.status !== 'all') {
            query['status'] = req.query.status;
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
                throw new Error(err);
            } else if (!rewards) {
                res.status(404).send({ message: 'There no more rewards available.' });
            } else {
                res.status(200).send(rewards);
            }
        });
    },
    readByRequests: function(req, res) {
        let limit = req.params.limit || req.query.limit || req.body.limit || 10;
        let page = req.params.page || req.query.page || req.body.page || 0;

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
        .exec(function(err, rewards) {
            console.log(rewards);
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(rewards);
            }
        });
    },
    updateReward: function (req, res) {
        const body = req.body;
        let sendEmail = false;
        let tile = '';

        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while retreiving the reward', error: err });
                throw new Error(err);
            } else if (!reward) {
                res.status(404).send({ message: 'There is no reward matching that id' });
            } else {
                ['name', 'description', 'categories', 'startDate', 'endDate', 'pictures', 'multiple',
                'applicableDays', 'price', 'delivery', 'status', 'review'].forEach(function(key) {
                    if (body[key] && key === 'review') {
                        if (reward[key]) {
                            reward[key].push(body[key]);
                        } {
                            reward[key] = [body[key]];
                        }
                        sendEmail = true;
                        reward.notify = true;
                    } else if (body[key] && key === 'pictures') {
                        var picturesList = [];
                        body[key].forEach(function(value) {
                            picturesList.push(Object({
                                id: value.id,
                                url: value.url
                            }));
                        });
                        reward[key] = picturesList;
                    } else if (body[key]) {
                        reward[key] = body[key];
                    }
                });

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
                        throw new Error(err);
                    } else {
                        res.status(200).send({ message: 'Reward Updated' });

                        if (sendEmail) {
                            Reward.populate(reward, {
                                path:"merchantID",
                                model: 'User',
                                select: 'email merchantInfo.companyName'
                            }, function(err, reward) {
                                if (err) {
                                    console.log(`Email about reward failed to send to ${reward.merchantID.merchantInfo.companyName} at ${(new Date().toDateString())}`);
                                } else {
                                    Emailer.sendEmail(reward.merchantID.email, title, Messages.reviewed(reward.review), function(response) {
                                        console.log(`Email sent to ${reward.merchantID.merchantInfo.companyName} at ${(new Date().toDateString())}`);
                                    });
                                }
                             });
                        }
                    }
                });
            }
        });
    }
}