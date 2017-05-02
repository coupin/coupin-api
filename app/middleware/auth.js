module.exports = {
    isAdmin: function (req, res, next) {
        if(req.user.role <= 1) {
            next();
        } else {
            res.status(400).send({success: false, message: "Unauthurized Admin"});
        }
    },
    isSuperAdmin: function (req, res, next) {
        if(req.user.role == 0) {
            next();
        } else {
            res.status(400).send({success: false, message: "Unauthurized SuperAdmin"});
        }
    }
};