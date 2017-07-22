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
        Users.find({role: 2}, function (err, users) {
            if (err) {
                res.status(500).send(err);
            } else {
                var counter = 0;
                var max = users.length;
                var markerInfo = [];
                users.forEach(function (user) {
                    Rewards.find({merchantID: user._id}, function (error, rewards) {
                        counter++;
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
                                address: user.merchantInfo.address + ', ' + user.merchantInfo.city + ', ' + user.merchantInfo.state,
                                location: user.merchantInfo.location,
                                rewards: rewards
                            }
                            
                            markerInfo.push(info);
                        }
                        if (counter === max) {
                            res.status(200).send(markerInfo);
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