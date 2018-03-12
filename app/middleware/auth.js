var jwt = require('jsonwebtoken');

module.exports = {
    authenticate: function(req, res, next) {
        var token = req.headers['x-access-token'] || req.headers['Authorization'];
        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) {
                res.status(500).send(err);
            } else if (!decoded) {
                res.status(401).send('Unauthorized Access. Must be signed in.')
            } else {
                req.user = decoded;
                next();
            }
        });
    },
    isAdmin: function(req, res, next) {
        if (req.user) {
            if(req.user.role <= 1) {
                next();
            } else {
                res.status(400).send({success: false, message: "Unauthurized User"});
            }
        } else {
            res.status(400).send({success: false, message: "Unauthurized User"});
        }
    },
    isCustomer: function(req, res, next) {
        if (req.user) {
            if(req.user.role <= 1 || req.user.role == 3) {
                next();
            } else {
                res.status(400).send({success: false, message: "Unauthurized User"});
            }
        } else {
            res.status(400).send({success: false, message: "Unauthurized User"});
        }
    },
    isMerchant: function(req, res, next) {
        if (req.user) {
            if(req.user.role <= 2) {
                next();
            } else {
                res.status(400).send({success: false, message: "Unauthurized User"});
            }
        } else {
            res.status(400).send({success: false, message: "Unauthurized User"});
        }
    },
    isOwner: function(req, res) {
        const id = req.body.id || req.params.id || req.query.id;
        const requesterId = req.user.id || req.user._id;

        if (id === requesterId) {
            next();
        } else {
            res.status(400).send({success: false, message: "Unauthurized. Only the owner can perform this action"});
        }
    },
    isSuperAdmin: function(req, res, next) {
        if (req.user) {
            if(req.user.role == 0) {
                next();
            } else {
                res.status(400).send({success: false, message: "Unauthurized SuperAdmin"});
            }
        } else {
            res.status(400).send({success: false, message: "Unauthurized User"});
        }
    }
};