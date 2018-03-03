const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');

// Get passport
const passport = require('./middleware/passport');

// Routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const coupinRoutes = require('./routes/coupin');
const merchantRoutes = require('./routes/merchant');
const overrideRoutes = require('./routes/override');
const rewardRoutes = require('./routes/rewards');
const userRoutes = require('./routes/customer');

adminRoutes(router);
authRoutes(router);
coupinRoutes(router);
merchantRoutes(router);
overrideRoutes(router);
rewardRoutes(router);
userRoutes(router);

router.route('/signature', function(req, res) {
    var params = req.body || req.params || req.query;
    var signature = cloudinary.utils.api_sign_request(params, 'F4SmP0wD7kQonfuybQjixWFYzP0');

    res.status(200).send(signature);
});

router.route('/logout/:opt', function(req, res) {
    req.logout();
    if (req.params.opt === 0) {
        res.redirect('/admin');
    } else {
        res.redirect('/merchant');
    }
});

module.exports = router;