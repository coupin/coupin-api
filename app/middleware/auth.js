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