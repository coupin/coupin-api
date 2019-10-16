var _ = require('lodash');
var moment = require('moment');
var shortCode = require('shortid32');

var Raven = require('../../config/config').Raven;
var Booking = require('../models/bookings');
var Reward = require('../models/reward');
var User = require('../models/users');
var emailer = require('../../config/email');
var messages = require('../../config/messages');

module.exports = {
    getRewards: function (req, res) {
        var startDate = req.query.start || moment().subtract(30, 'day');
        var endDate = req.query.end || moment();
        var page = req.query.page || 1;
        var merchantId = req.params.id || req.user.id;
        var rewardLimit = 10;
        var opt = {};

        // set merchant id
        opt['merchantID'] = merchantId;
        // opt['createdDate'] = {
        //     $gte: moment(startDate),
        //     $lte: moment(endDate),
        // };

        Booking.mapReduce({
            map: function () {
                var self = this
                this.rewardId.forEach(function (_rewardId) {
                    emit(ObjectId(_rewardId.id), {
                        usedOn: _rewardId.usedOn,
                        status: _rewardId.status,
                        rewardId: _rewardId.id,
                        coupinId: self._id,
                    })
                })
            },
            reduce: function (key, value) {
                return {
                    coupins: value,
                    coupinCount: value.length || 0
                };
            },
            out: { replace: 'coupins' },
            verbose: true,
            resolveToObject: true,
            query:{ merchantId: merchantId },

        }).then(function (result) {
            var model = result.model;

            return Promise.all([
                model.aggregate([
                    {
                        $lookup: {
                            from: 'rewards',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'reward'
                        }
                    },
                    { $unwind: "$reward" },
                    {
                        $project: {
                            'value': 1,
                            'reward.name': 1,
                            'reward.startDate': 1,
                            'reward.endDate': 1,
                            'reward.createdDate': 1,
                        }
                    },
                    { $skip: (rewardLimit * (page - 1)) },
                    { $limit: rewardLimit }
                ]),
                Reward.count(opt).exec(),
            ])
        }).then(function (_result) {
            var rewards = _result[0];
            var rewardCount = _result[1];

            res.status(200).json({
                rewards: rewards,
                rewardCount: rewardCount,
            });
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        })

        // Promise.all([
        // Reward.find(opt)
        //     .select('name createdDate startDate endDate')
        //     .limit(rewardLimit)
        //     .skip(10 * (page - 1))
        //     .exec(),
        // Reward.count(opt).exec()
        // ]).then(([rewards, rewardCount]) => {
        //     res.status(200).json({
        //         rewards,
        //         rewardCount,
        //     });
        // })
        // .catch(function (err) {
        //     res.status(500).send(err);
        //     Raven.captureException(err);
        // });
    },
    getStats: function (req, res) {
        // var duration = req.query.duration || 30;
        var startDate = req.query.start || moment().subtract(30, 'day');
        var endDate = req.query.end || moment();
        var id = req.params.id || req.user.id;
        var rewardOpt = {};
        var generatedCoupinOpt = {};
        var redeemedCoupinOpt = {};

        // set merchant id
        rewardOpt['merchantID'] = id;
        // rewardOpt['status'] = 'active';
        // rewardOpt['isActive'] = true;
        // rewardOpt['createdDate'] = {
        //     $gte: startDate,
        //     $lte: endDate,
        // };

        generatedCoupinOpt['merchantId'] = id;
        // generatedCoupinOpt['createdDate'] = {
        //     $gte: startDate,
        //     $lte: endDate,
        // };

        redeemedCoupinOpt['merchantId'] = id;
        redeemedCoupinOpt['rewardId.status'] = 'used';
        // redeemedCoupinOpt['createdDate'] = {
        //     $gte: startDate,
        //     $lte: endDate,
        // };

        Promise.all([
            Reward.count(rewardOpt).exec(),
            Booking.count(generatedCoupinOpt).exec(),
            Booking.count(redeemedCoupinOpt).exec()
        ]).then(([activeRewardCount, generatedCpupins, redeemedCoupins]) => {
            res.status(200).json({
                active: activeRewardCount,
                generated: generatedCpupins,
                redeemed: redeemedCoupins,
            });
        }).catch((err) => {
            res.status(500).send(err);
            Raven.captureException(err);
        })
    },
};
