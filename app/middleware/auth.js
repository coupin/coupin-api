module.exports = {
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