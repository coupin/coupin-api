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
        console.log(req.user._id);
        Booking.find({userId: req.user._id, useNow: false}, function (err, bookings) {
            if (err) {
                res.status(500).send(err);
            } else if (bookings.length === 0) {
                res.status(404).send({message: 'No bookings saved for later.'});
            } else {
                const  total = bookings.length - 1;
                let count = 0;
                let response = [];

                bookings.forEach(function (booking) {
                    Reward.findById(booking.rewardId, function (err1, reward) {
                        if (err1) {
                            res.status(500).send(err1);
                        } else {
                            Merchant.findById(reward.merchantID, function (err2, merchant) {
                                if (err2) {
                                    res.status(500).send(err1);
                                } else {
                                    let temp = {
                                        bookingId: booking._id,
                                        shortCode: booking.shortCode,
                                        reward: {
                                            name: reward.name,
                                            description: reward.description,
                                            expirationDate: (new Date(reward.endDate).getTime())
                                        },
                                        merchant: {
                                            name: merchant.merchantInfo.companyName,
                                            address: merchant.merchantInfo.address + ', ' + merchant.merchantInfo.city + ', ' + merchant.merchantInfo.state,
                                            logo: merchant.merchantInfo.logo || null
                                        }
                                    };

                                    response.push(temp);

                                    if ( count === total) {
                                        res.status(200).send(response);
                                    } else {
                                        count++;
                                    }
                                }
                            });
                        }
                    });
                });
            }
        })
    },

    getRewardsForNow: function (req, res) {
        let query = Booking.find({});
        query.where('userId', req.user._id);
        query.where('useNow', true);
        query.limit(10);
        query.exec(function (err, bookings) {
            if (err) {
                res.status(500).send(err);
            } else if (bookings.length === 0) {
                res.status(404).send({message: 'No active bookings.'});
            } else {
                const  total = bookings.length - 1;
                let count = 0;
                let response = [];

                bookings.forEach(function (booking) {
                    Reward.findById(booking.rewardId, function (err1, reward) {
                        if (err1) {
                            res.status(500).send(err1);
                        } else {
                            Merchant.findById(reward.merchantID, function (err2, merchant) {
                                if (err2) {
                                    res.status(500).send(err1);
                                } else {
                                    let temp = {
                                        bookingId: booking._id,
                                        shortCode: booking.shortCode,
                                        reward: {
                                            name: reward.name,
                                            description: reward.description,
                                            expirationDate: (new Date(reward.endDate).getTime())
                                        },
                                        merchant: {
                                            name: merchant.merchantInfo.companyName,
                                            address: merchant.merchantInfo.address + ', ' + merchant.merchantInfo.city + ', ' + merchant.merchantInfo.state,
                                            logo: merchant.merchantInfo.logo || null
                                        }
                                    };

                                    response.push(temp);

                                    if ( count === total) {
                                        res.status(200).send(response);
                                    } else {
                                        count++;
                                    }
                                }
                            });
                        }
                    });
                });
            }
        })
    },

    getCode: function (req, res) {
        let valid = false;
        let code = shortCode.generate();

        Booking.findOne({shortCode: code}, function (err, booking) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (!booking) {
                const booking = new Booking({
                    userId: req.user._id,
                    rewardId: req.body.rewardId,
                    shortCode: code
                });

                booking.save(function (err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({'code': code});
                    }
                });
            }
        });
    }
};