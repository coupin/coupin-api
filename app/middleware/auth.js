module.exports = {
    authenticate: function (req, res, next) {
        console.log(req.user);
        if(req.user) {
            next();
        } else {
            res.status(401).send({message: 'Unauthorized Access, there is noone logged in on this device'});
            // res.sendfile('./public/views/merchantReg.html');
        }
    },
    isAdmin: function (req, res, next) {
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
    isMerchant: function (req, res, next) {
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
    isSuperAdmin: function (req, res, next) {
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