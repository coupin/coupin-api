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
    markerInfo: function (req, res) {
        const limit = req.query.limit ||  6;
        const skip = req.query.skip ||  0;
        let longitude = req.query.longitude;
        let latitude = req.query.latitude;


        if (typeof longitude !== Number) {
            longitude = parseFloat(longitude);
        }

        if (typeof latitude !== Number) {
            latitude = parseFloat(latitude);
        }
        
        // Kilometers
        let maxDistance = req.query.distance || 20000;
        let coords = [longitude, latitude];

        // Convert to radians.radisu of the earth is approxs 6371 kilometers
        maxDistance /= 6371;

        Users.find({
            'role' : 2,
            'merchantInfo.location' : {
                $near: coords,
                $maxDistance: maxDistance
            }
        })
        .limit(limit)
        .skip(skip)
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
    search: function (req, res) {
        const query = req.params.query;

        let search = Users.find({
            'merchantInfo.companyName': 
            {
                '$regex' : query, 
                '$options': 'i'
            }, 
            role: 2
            });
        
        search.select('merchantInfo');
        search.exec(function (err, merchants) {
            if (err) {
            res.status(500).send(err);
            } else {
            res.status(200).send(merchants);
            }
        });
    }
};