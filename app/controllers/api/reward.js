//@ts-check
const _ = require('lodash');
const shortCode = require('shortid');
const Booking = require('../../models/bookings');
const Merchant = require('../../models/users');
const Reward = require('../../models/reward');

module.exports = {
    getAll: function (req, res) {
        Booking.find({}, function (err, bookings) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(bookings);
            }
        });
    },

    getRewardsForLater: function (req, res) {
        let query = Booking.find({});
        query.where('userId', req.user._id);
        query.where('useNow', false);
        query.populate('rewardId', 'name description endDate price')
        query.populate('merchantId', 'merchantInfo _id');
        query.limit(10);
        query.exec(function (err, bookings) {
            if (err) {
                res.status(500).send(err);
            } else if (bookings.length === 0) {
                res.status(404).send({message: 'No active bookings.'});
            } else {
                res.status(200).send(bookings);
            }
        })
    },

    getRewardsForNow: function (req, res) {
        let query = Booking.find({});
        query.where('userId', req.user._id);
        query.where('useNow', true);
        query.populate('rewardId', 'name description endDate price')
        query.populate('merchantId', 'merchantInfo _id');
        query.limit(10);
        query.exec(function (err, bookings) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (bookings.length === 0) {
                res.status(404).send({message: 'No active bookings.'});
            } else {
                res.status(200).send(bookings);
            }
        })
    },

    // TODO: Remove
    testdelete: function (req, res) {
        Booking.remove({}, (err, bookings) => {
            res.status(200).send({ message: 'Removed' });
        });
    },

    useSavedCoupin: function (req, res) {
        const id = req.body.id || req.query.id;
        Booking.findById(id, function (err, booking) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (!booking) {
                res.status(404).send({ message: 'No such booking exists' });
            } else {
                booking.shortCode = shortCode.generate();
                booking.useNow = true;

                booking.save(function(err, booking) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(booking);
                    }
                });
            }
        });
    },

    coupin: function (req, res) {
        let rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
        let rewardId = rewardString.split(" ");
        rewardId = _.without(rewardId, "");

        Booking.findOne({rewardId: rewardId}, function (err, booking) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } if (booking) {
                res.status(409).send({ message: 'Coupin already exists.' });
            } else {
                const booking = new Booking({
                    userId: req.user._id,
                    merchantId: req.body.merchantId,
                    rewardId: rewardId,
                    shortCode: shortCode.generate()
                });

                booking.save(function (err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        Booking
                        .populate(booking, { 
                            path: 'rewardId'
                        }, function (err, booking) {
                            if (err) {
                                console.log(err);
                                res.status(500).send(err);
                            } else {
                                res.status(201).send(booking);
                            }
                        });
                    }
                });
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
                console.log(err);
                res.status(500).send(err);
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
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        Booking
                        .populate(booking, { 
                            path: 'rewardId'
                        }, function (err, booking) {
                            if (err) {
                                console.log(err);
                                res.status(500).send(err);
                            } else {
                                res.status(201).send(booking);
                            }
                        });
                    }
                });
            }
        });
    }
};