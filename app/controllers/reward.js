//@ts-check
const Reward = require('./../models/reward');

module.exports = {
    activate: function (req, res) {
        Reward.findById(req.params.id, function (err, reward) {
            if (err) {
                res.status(500).send(err);
            } else if (!reward) {
                res.status(404).send({message: 'There is no such reward'});
            } else {
                reward.isActive = true;
                reward.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: 'Reward successfully activated'});
                    }
                });
            }
        });
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
        } else{
            Reward.findOne({ name: req.body.name }, function (err, reward) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                } else if (reward) {
                    res.status(409).send({message: 'There is already a reward with that name'});
                } else {
                    // Get information of reward
                    var newReward = {
                    name : req.body.name,
                    merchantID : req.user._id || req.body.merchantID,
                    description :  req.body.description,
                    categories : req.body.categories,
                    startDate : req.body.startDate,
                    endDate : req.body.endDate,
                    picture : req.body.picture || 'default.png',
                    multiple :  req.body.multiple,
                    applicableDays : req.body.applicableDays,
                    price: req.body.price,
                    createdDate: Date.now(),
                    isActive: true
                    };

                    // Create new reward
                    var reward = new Reward(newReward);

                    reward.save(function (err) {
                        if(err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).json({message: 'Reward created!' });
                        }
                    });
                }
            });
        };
    },
    deactivate: function (req, res) {
        Reward.findById(req.params.id, function (err, reward) {
            if (err) {
                res.status(500).send(err);
            } else if (!reward) {
                res.status(404).send({message: 'There is no such reward'});
            } else {
                reward.isActive = false;
                reward.save(function (err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: 'Reward successfully deactivated'});
                    }
                });
            }
        });
    },
    delete: function (req, res) {
        Reward.findByIdAndRemove(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while deleting the reward', error: err });
            } else {
                res.status(200).send({message: 'Reward successfully deleted'});
            }
        });
    },
    getAll: function (req, res) {
        Reward.find({}, function (err, rewards) {
            res.status(200).send(rewards);
        });
    },
    getOne: function(req, res) {
        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(reward);
            }
        });
    },
    updateReward: function (req, res) {
        Reward.findById(req.params.id, function(err, reward) {
            if (err) {
                res.status(500).send({ message: 'An error occured while retreiving the reward', error: err });
            } else if (!reward) {
                res.status(404).send({ message: 'There is no reward matching that id' });
            } else {
                reward.name = req.body.name || reward.name;
                reward.description = req.body.description || reward.description;
                reward.categories = req.body.categories || reward.categories;
                reward.startDate = req.body.startDate || reward.startDate;
                reward.endDate = req.body.endDate || reward.endDate;
                reward.picture = req.body.picture || reward.picture;
                reward.multiple =  req.body.multiple || reward.multiple;
                reward.applicableDays = req.body.applicableDays || reward.applicableDays;
                reward.price = req.body.price || reward.price;
                reward.modifiedDate = Date.now();

                reward.save(function(err) {
                    if (err) {
                        res.status(500).send({ message: 'An error occured while updating the reward' });
                    } else {
                        res.status(200).send({ message: 'Reward Updated' });
                    }
                });
            }
        });
    }
}