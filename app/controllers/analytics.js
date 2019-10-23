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

        Booking.mapReduce({
            map: function () {
                var self = this;
                this.rewardId.forEach(function (reward) { reward.id = ObjectId(reward.id) })
                emit(self._id, self);
            },
            reduce: function (key, value) {
                return { value: value };
            },
            out: { replace: 'coupins' },
            verbose: true,
            resolveToObject: true,
        }).then(function (result) {
            var model = result.model;

            return model.aggregate([
                { $replaceRoot: { newRoot: '$value' } },
                { $match: { merchantId: merchantId } },
                { $unwind: { preserveNullAndEmptyArrays: true, path: '$rewardId' } },
                { $group: { _id: '$rewardId.id', bookings: { $addToSet: '$$ROOT' }, generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
                { $lookup: { from: 'rewards', localField: '_id', foreignField: '_id', as: 'reward' } },
                { $unwind: { preserveNullAndEmptyArrays: true, path: '$reward' } },
                { $match: { 'reward.startDate': { '$gte': new Date(parseInt(startDate)), '$lte': new Date(parseInt(endDate)) }, 'reward.status': 'active' } },
                { $skip: (rewardLimit * (page - 1)) },
                { $limit: rewardLimit }
            ])
        }).then(function (_result) {
            res.status(200).json({
                rewards: _result,
            });
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        })
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
        rewardOpt['status'] = 'active';
        // rewardOpt['isActive'] = true;
        rewardOpt['createdDate'] = {
            $gte:  new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

        generatedCoupinOpt['merchantId'] = id;
        generatedCoupinOpt['createdDate'] = {
            $gte:  new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

        redeemedCoupinOpt['merchantId'] = id;
        redeemedCoupinOpt['rewardId.status'] = 'used';
        redeemedCoupinOpt['createdDate'] = {
            $gte:  new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

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
