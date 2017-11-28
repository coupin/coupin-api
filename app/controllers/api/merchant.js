// models
const Users = require('./../../models/users');
const Rewards = require('./../../models/reward');

module.exports = {
    deleteOne: function (req, res) {
        Users.findByIdAndRemove(req.params.id, function(err, merchant) {
            if(err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({message: 'Merchant Deleted'});
            }
        })
    },
    
    /**
     * Handles info gotten for the mobile markers
     */
    markerInfo: function (req, res) {
        const categories = JSON.parse(req.body.categories) || [];
        const limit = req.query.limit || req.body.limit || req.params.limit ||  4;
        const skip = req.query.page || req.body.page || req.params.page ||  0;
        let longitude = req.query.longitude || req.body.longitude || req.params.longitude;
        let latitude = req.query.latitude || req.body.latitude || req.params.latitude;


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

        if (longitude !== NaN || latitude !== NaN) {
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

    /**
     * Handles the search
     */
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
            } else {
                res.status(200).send(merchants);
            }
        });
    }
};