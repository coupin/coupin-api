const jwt = require('jsonwebtoken');

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
    },

    /**
     * Login Merchants
     */
    signinMerchant: function (req, res) {
        var token = jwt.sign({
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive
        }, process.env.SECRET, {
            expiresIn: '24h'
        });

        var user = {
            id: req.user._id,
            email: req.user.email,
            isActive: true,
            merchantInfo: req.user.merchantInfo,
            picture: req.user.picture
        };

        res.status(200).send({success: true, token, user});
    },

    /**
     * Reditect on access attempt
     */
    authRedirect: function (req, res) {
        if (req.user) {
            if (req.user.role == 2) {
            res.sendfile('./public/views/merchant/index.html');
            } else {
            res.sendfile('./public/views/shared/merchantReg.html');
            }
        } else {
            res.sendfile('./public/views/shared/merchantReg.html');
        }
    },
}