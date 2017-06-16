const User = require('../models/users');

module.exports = {
    changePassword: function (req, res) {
        if (req.user) {
            User.findById(req.user._id, function (err, user) {
                if (err) {
                    res.status(500).send(err);
                } else if (!user) {
                    res.status(404).send({message: 'There is no such user'});
                } else {
                    User.updatePassword(user, req.body.password, function (err, user) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send({message: 'Password saved successfully'});
                        }
                    }); 
                }
            });
        } else {
            res.status(404).send({message: 'There is no signed in user'});
        }
    }
}