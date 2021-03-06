var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var stream = require('stream');

var Raven = require('../../config/config').Raven;
var Booking = require('../models/bookings');
var Reward = require('../models/reward');
var User = require('../models/users');
var pdf = require('./../../config/pdf');
var excelReport = require('./../../config/excel');

function getRewardList(merchantId, startDate, endDate, rewardLimit, page) {
    var aggArr = [
        { $replaceRoot: { newRoot: '$value' } },
        { $match: { merchantId: merchantId } },
        { $unwind: { preserveNullAndEmptyArrays: true, path: '$rewardId' } },
        { $group: { _id: '$rewardId.id', bookings: { $addToSet: '$$ROOT' }, generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
        { $lookup: { from: 'rewards', localField: '_id', foreignField: '_id', as: 'reward' } },
        { $unwind: { preserveNullAndEmptyArrays: true, path: '$reward' } },
        { $match: { 'reward.startDate': { '$gte': new Date(parseInt(startDate)), '$lte': new Date(parseInt(endDate)) }/* , 'reward.status': 'active' */ } },
    ];

    if (rewardLimit) {
        var skip = page || 1;
        aggArr.push({ $skip: (rewardLimit * (skip - 1)) });
        aggArr.push({ $limit: rewardLimit });
    }

    return Booking.mapReduce({
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
        return model.aggregate(aggArr);
    });
}

function getGenderDist(rewardId) {
    return Booking.mapReduce({
        map: function () {
            this.userId = ObjectId(this.userId)
            emit(this._id, this);
        },
        reduce: function (key, value) { return { value: value } },
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
    });
}

function getAgeDist(rewardId) {
    return Booking.mapReduce({
        map: function () {
            this.userId = ObjectId(this.userId)
            emit(this._id, this);
        },
        reduce: function (key, value) { return { value: value } },
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
            { $group: { _id: '$user.ageRange', generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
        ]);
    });
}

function getSingleReward(rewardId) {
    return Booking.mapReduce({
        map: function () {
            var self = this;
            this.rewardId.forEach(function (reward) { reward.id = ObjectId(reward.id) })
            emit(self._id, self);
        },
        reduce: function (key, value) { return { value: value }; },
        out: { replace: 'modifiedBookingsRewards' },
        verbose: true,
        resolveToObject: true,
    }).then(function (result) {
        var model = result.model;

        return model.aggregate([
            { $replaceRoot: { newRoot: '$value' } },
            { $unwind: { preserveNullAndEmptyArrays: true, path: '$rewardId' } },
            { $match: { "rewardId.id": mongoose.Types.ObjectId(rewardId) } },
            { $group: { _id: '$rewardId.id', bookings: { $addToSet: '$$ROOT' }, generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
            { $lookup: { from: 'rewards', localField: '_id', foreignField: '_id', as: 'reward' } },
            { $unwind: { preserveNullAndEmptyArrays: true, path: '$reward' } },
            { $project: { _id: 1, generatedCoupin: 1, redeemedCoupin: 1, 'name': '$reward.name', 'startDate': '$reward.startDate', 'endDate': '$reward.endDate' } }
        ]);
    }).then(function (data) {
        return data[0] || {}
    });
}

module.exports = {
    getRewards: function (req, res) {
        var startDate = req.query.start || moment().subtract(30, 'day');
        var endDate = req.query.end || moment();
        var page = req.query.page || 1;
        var merchantId = req.params.id || req.user.id;
        var rewardLimit = 10;

        getRewardList(merchantId, startDate, endDate, rewardLimit, page).then(function (_result) {
            res.status(200).json({
                rewards: _result,
            });
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        });
    },
    getSingleReward: function (req, res) {
        var rewardId = req.params.id;

        getSingleReward(rewardId).then(function (data) {
            res.status(200).json(data);
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

        getGenderDist(rewardId).then(function (_result) {
            if (!_.find(_result, { _id: 'male' })) {
                _result.push({ _id: 'male', generatedCoupin: 0, redeemedCoupin: 0 } )
            }

            if (!_.find(_result, { _id: 'female' })) {
                _result.push({ _id: 'female', generatedCoupin: 0, redeemedCoupin: 0 } )
            }

            res.status(200).json(processGenderData(_result));
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        });
    },
    getRewardBookingAgeDistribution: function (req, res) {
        var rewardId = req.params.id;

        getAgeDist(rewardId).then(function (_result) {
            var redeemed = [];
            var generated = [];

            ['under 15', '15 - 25', '25 - 35', '35 - 45', 'above 45'].forEach(function (age) {
                var val = _result.find(function (r) { return r._id === age }) || { _id: age, generatedCoupin: 0, redeemedCoupin: 0 };
                redeemed.unshift(val.redeemedCoupin);
                generated.unshift(val.generatedCoupin);
            });

            res.json([{
                name: 'Redeemed',
                data: redeemed
            }, {
                name: 'Generated',
                data: generated
            }]);
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        });
    },
    getGeneratedVsRedeemedCoupin: function (req, res) {
        var rewardId = req.params.id;

        Promise.all([
            Reward.findById(rewardId),
            Booking.aggregate([
                { $unwind: { preserveNullAndEmptyArrays: true, path: '$rewardId' } },
                { $match: { 'rewardId.id': rewardId } },
                { $addFields: { yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, } },
                { $group: { _id: '$yearMonthDay', bookings: { $addToSet: '$$ROOT' }, generatedCoupin: { $sum: 1 }, redeemedCoupin: { $sum: { $switch: { branches: [{ case: { $eq: ['$rewardId.status', 'used'] }, then: 1 }], default: 0 } } } } },
            ])
        ]).then(function (result) {
            var reward = result[0];
            var aggResult = result[1];
            var labels = [];

            var generated = []
            var redeemed = []

            // generate the labels needed for the data so we can have
            // evenly spaced data on the frontend
            var lastValue = moment(reward.startDate).valueOf();
            labels.push(lastValue);
            while (moment(reward.endDate).diff(moment(lastValue)) > 0) {
                lastValue = moment(lastValue).add(1, 'days');
                labels.push(lastValue.valueOf());
            }

            labels.forEach(function (time) {
                var val = _.find(aggResult, function (o) { return moment(o._id).isSame(moment(time)) || moment(o._id).diff(moment(time), 'days') === 0; });

                if (val) {
                    generated.push([new Date(val._id).getTime(), val.generatedCoupin || 0]);
                    redeemed.push([new Date(val._id).getTime(), val.redeemedCoupin || 0]);
                } else {
                    generated.push([time, 0]);
                    redeemed.push([time, 0]);
                }
            });

            res.json([
                {
                    name: "Redeemed Coupin",
                    data: redeemed
                },
                {
                    name: "Generated Coupin",
                    data: generated
                },
            ])
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        });
    },
    getAllRewardsPdf: function (req, res) {
        var startDate = req.query.start || moment().subtract(30, 'day');
        var endDate = req.query.end || moment();
        var merchantId = req.params.id || req.user.id;

        Promise.all([
            getRewardList(merchantId, startDate, endDate),
            User.findById(merchantId)
        ]).then(function (_result) {
            var rewards = _result[0];
            var merchant = _result[1];
            var pdfObject = {
                merchantName: merchant.merchantInfo.companyName,
                address: merchant.merchantInfo.address,
                city: merchant.merchantInfo.city,
                state: merchant.merchantInfo.state,
                rewards: rewards,
                startDate: moment(parseInt(startDate, 10)).format('ll'),
                endDate: moment(parseInt(endDate, 10)).format('ll'),
            };

            // create the pdf here
            pdf.generatePdf('allRewards', pdfObject, function (err, _res) {
                if (err) {
                    res.status(500).send('Error creating the pdf, please try again later');
                } else {
                    var doc = JSON.parse(_res);
                    res.send({
                        documentId: doc.document.id,
                        status: doc.document.status,
                    });
                }
            });
        }).catch(function (err) {
            console.log(err)
            res.status(500).send(err);
            Raven.captureException(err);
        })
    },
    getRewardPdf: function (req, res) {
        var rewardId = req.params.id;
        var merchantId = req.user.id;

        Promise.all([
            getSingleReward(rewardId),
            getAgeDist(rewardId),
            getGenderDist(rewardId),
            User.findById(merchantId),
        ]).then(function (result) {
            var reward = result[0];
            var ageDist = result[1];
            var genderDist = result[2];
            var merchant = result[3];

            var payload = {
                merchantName: merchant.merchantInfo.companyName,
                address: merchant.merchantInfo.address,
                city: merchant.merchantInfo.city,
                state: merchant.merchantInfo.state,
                reward: {
                    _id: reward._id,
                    generatedCoupin: reward.generatedCoupin,
                    redeemedCoupin: reward.redeemedCoupin,
                    name: reward.name,
                    startDate: reward.startDate,
                    endDate: reward.endDate,
                },
                ageData: processAgeDataPdf(ageDist),
                genderData: processGenderDataPdf(genderDist),
            }

            pdf.generatePdf('singleReward', payload, function (err, _res) {
                if (err) {
                    res.status(500).send('Error creating the pdf, please try again later');
                } else {
                    var doc = JSON.parse(_res);
                    res.send({
                        documentId: doc.document.id,
                        status: doc.document.status,
                    });
                }
            });
        });
    },
    checkPdfStatus: function (req, res) {
        var documentId = req.query.documentId;

        if (!documentId) {
            res.status(400).send('documentId is required');
            return;
        }

        pdf.checkPdf(documentId, function (err, _res) {
            if (err) {
                res.status(500).send('Error creating the pdf, please try again later');
            } else {
                var doc = JSON.parse(_res);
                res.send({
                    documentId: doc.document.id,
                    status: doc.document.status,
                    downloadUrl: doc.document.download_url,
                });
            }
        });
    },
    getAllRewardExcel: function (req, res) {
        var startDate = req.query.start || moment().subtract(30, 'day');
        var endDate = req.query.end || moment();
        var merchantId = req.params.id || req.user.id;

        Booking.mapReduce({
            map: function () {
                var self = this;
                this.rewardId.forEach(function (reward) { reward.id = ObjectId(reward.id) });
                this.userId = ObjectId(this.userId);
                emit(self._id, self);
            },
            reduce: function (key, value) {
                return { value: value };
            },
            out: { replace: 'testCoupins' },
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
                { $match: { 'reward.startDate': { '$gte': new Date(parseInt(startDate)), '$lte': new Date(parseInt(endDate)) } } },
                {
                    $facet: {
                        rewards: [
                            {
                                $project: {
                                    _id: 1,
                                    name: '$reward.name',
                                    startDate: '$reward.startDate',
                                    endDate: '$reward.endDate',
                                    generatedCoupin: 1,
                                    redeemedCoupin: 1,
                                },
                            },
                        ],
                        ageDist: [
                            { $unwind: { preserveNullAndEmptyArrays: true, path: '$bookings' } },
                            { $lookup: { from: 'users', localField: 'bookings.userId', foreignField: '_id', as: 'bookings.users' } },
                            { $unwind: { preserveNullAndEmptyArrays: true, path: '$bookings.users' } },
                            {
                                $project: {
                                    // reward: 0,
                                    /* 'bookings.merchantId': 0,
                                    'bookings.expiryDate': 0,
                                    'bookings.createdAt': 0,
                                    'bookings.isActive': 0,
                                    'bookings.useNow': 0,
                                    'bookings.shortCode': 0,
                                    'bookings.__v': 0, */
                                    '_id': 1,
                                    'bookings.users.ageRange': 1,
                                    'bookings.rewardId.status': 1,
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        age: '$bookings.users.ageRange',
                                        rewardId: '$_id',
                                    },
                                    generatedCoupin: {
                                        $sum: 1
                                    },
                                    redeemedCoupin: {
                                        $sum: { $switch: { branches: [{ case: { $eq: ['$bookings.rewardId.status', 'used'] }, then: 1 }], default: 0 } }
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    rewardId: '$_id.rewardId',
                                    age: '$_id.age',
                                    generatedCoupin: 1,
                                    redeemedCoupin: 1,
                                }
                            }
                        ],
                        genderDist: [
                            { $unwind: { preserveNullAndEmptyArrays: true, path: '$bookings' } },
                            { $lookup: { from: 'users', localField: 'bookings.userId', foreignField: '_id', as: 'bookings.users' } },
                            { $unwind: { preserveNullAndEmptyArrays: true, path: '$bookings.users' } },
                            {
                                $project: {
                                    '_id': 1,
                                    'bookings.users.sex': 1,
                                    'bookings.rewardId.status': 1,
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        gender: '$bookings.users.sex',
                                        rewardId: '$_id'
                                    },
                                    generatedCoupin: {
                                        $sum: 1
                                    },
                                    redeemedCoupin: {
                                        $sum: { $switch: { branches: [{ case: { $eq: ['$bookings.rewardId.status', 'used'] }, then: 1 }], default: 0 } }
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    rewardId: '$_id.rewardId',
                                    gender: '$_id.gender',
                                    generatedCoupin: 1,
                                    redeemedCoupin: 1,
                                }
                            }
                        ],
                    }
                }
            ]);
        }).then(function (_result) {
            var data = _result[0] || {};
            return excelReport(data)
                .then(function (buffer) {
                    res.setHeader('Content-disposition', 'attachment; filename=excel_report_from' + startDate + '_to_' + endDate + '.xlsx');
                    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.send(buffer);
                });

        }).catch(function (error) {
            res.status(500).json({
                message: 'There was an error generating the report, please try again later',
                err: error,
            });
        });
    }
};

function processGenderData(result) {
    var totalGenerated = result.reduce(function (acc, r) {
        return acc + parseInt(r.generatedCoupin, 10);
    }, 0);

    var totalRedeemed = result.reduce(function (acc, r) {
        return acc + parseInt(r.redeemedCoupin, 10);
    }, 0);

    return result.map(function (value) {
        var generatedvalue = 100 * (value.generatedCoupin / totalGenerated);
        var redeemedvalue = 100 * (value.redeemedCoupin / totalRedeemed);

        return {
            name: value._id || 'uncategorised',
            data: [
                parseFloat((generatedvalue || 0).toFixed(2)), 
                parseFloat((redeemedvalue || 0).toFixed(2))
            ],
        };
    }).sort(function (a, b) {
        if (
            (a.name === 'female' && b.name === 'male') ||
            (a.name === 'male' && b.name === 'uncategorised') ||
            (a.name === 'female' && b.name === 'uncategorised')
        ) {
            return -1;
        }

        if (
            (a.name === 'male' && b.name === 'female') ||
            (a.name === 'uncategorised' && b.name === 'male') ||
            (a.name === 'uncategorised' && b.name === 'female')
        ) {
            return 1;
        }

        return 0;
    });
}

function processGenderDataPdf(result) {
    return result.map(function (value) {
        return {
            name: value._id || 'uncategorised',
            generatedCoupin: value.generatedCoupin,
            redeemedCoupin: value.redeemedCoupin,
        };
    });
}

function processAgeDataPdf(result) {
    return ['under 15', '15 - 25', '25 - 35', '35 - 45', 'above 45'].map(function (age) {
        var value = _.find(result, { _id: age });
        if (!value) {
            return {
                name: age,
                generatedCoupin: 0,
                redeemedCoupin: 0,
            }
        } else {
            return {
                name: value._id || 'uncategorised',
                generatedCoupin: value.generatedCoupin,
                redeemedCoupin: value.redeemedCoupin,
            }
        }
    });
}


