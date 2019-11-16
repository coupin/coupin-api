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
        var startDate = req.query.start || moment().subtract(30, 'day').valueOf();
        var endDate = req.query.end || moment().valueOf();
        var id = req.params.id || req.user.id;
        var rewardOpt = {};
        var generatedCoupinOpt = {};
        var redeemedCoupinOpt = {};

        // set merchant id
        rewardOpt['merchantID'] = id;
        rewardOpt['status'] = 'active';
        // rewardOpt['isActive'] = true;
        rewardOpt['createdDate'] = {
            $gte: new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

        generatedCoupinOpt['merchantId'] = id;
        generatedCoupinOpt['createdAt'] = {
            $gte: new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

        redeemedCoupinOpt['merchantId'] = id;
        redeemedCoupinOpt['rewardId.status'] = 'used';
        redeemedCoupinOpt['createdAt'] = {
            $gte: new Date(parseInt(startDate)),
            $lte: new Date(parseInt(endDate)),
        };

        Promise.all([
            Reward.count(rewardOpt).exec(),
            Booking.count(generatedCoupinOpt).exec(),
            Booking.count(redeemedCoupinOpt).exec()
        ]).then(([activeRewardCount, generatedCoupins, redeemedCoupins]) => {
            res.status(200).json({
                active: activeRewardCount,
                generated: generatedCoupins,
                redeemed: redeemedCoupins,
            });
        }).catch((err) => {
            res.status(500).send(err);
            Raven.captureException(err);
        })
    },
    getOverallCoupinStat: function (req, res) {
        var id = req.params.id || req.user.id;
        var generatedCoupinOpt = {};
        var redeemedCoupinOpt = {};

        redeemedCoupinOpt['merchantId'] = generatedCoupinOpt['merchantId'] = id;
        redeemedCoupinOpt['rewardId.status'] = 'used';

        Promise.all([
            Booking.count(generatedCoupinOpt).exec(),
            Booking.count(redeemedCoupinOpt).exec()
        ]).then((result) => {
            res.status(200).json({
                generated: result[0],
                redeemed: result[1],
            });
        }).catch((err) => {
            res.status(500).send(err);
            Raven.captureException(err);
        })
    },
    getRewardBookingGenderDistribution: function (req, res) {
        var rewardId = req.params.id;

        Booking.mapReduce({
            map: function () {
                this.userId = ObjectId(this.userId)
                emit(this._id, this);
            },
            reduce: function (key, value) { return { value } },
            out: { replace: 'modifiedBookingsForUsers' },
            verbose: true,
            resolveToObject: true,
        }).then(function (result) {
            var model = result.model;

            return model.aggregate([
                { $replaceRoot: { newRoot: '$value' } },
                { $unwind: { preserveNullAndEmptyArrays: true, path: '$rewardId' } },
                { $match: { "rewardId.id": rewardId } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: { preserveNullAndEmptyArrays: true, path: '$user' } },
                { $group: { _id: '$user.sex', generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
            ]);
        }).then(function (_result) {
            var totalGenerated = _result.reduce(function (acc, r) {
                return acc + parseInt(r.generatedCoupin, 10);
            }, 0);

            var totalRedeemed= _result.reduce(function (acc, r) {
                return acc + parseInt(r.redeemedCoupin, 10);
            }, 0);

            console.log(totalGenerated)

            var yt = _result.map(function(r) {
                return {
                    name: r._id || 'uncategorised',
                    data: [100 * (r.generatedCoupin / totalGenerated), 100 * (r.redeemedCoupin / totalRedeemed)],
                };
            });

            res.status(200).json(yt);
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        });
    },
};
