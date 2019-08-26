const express = require('express');
const router = express.Router();

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
const paymentRoutes = require('./routes/payment');

// For Test
const MerchantCtrl = require('./controllers/merchant');

adminRoutes(router);
authRoutes(router);
coupinRoutes(router);
merchantRoutes(router);
overrideRoutes(router);
rewardRoutes(router);
userRoutes(router);
paymentRoutes(router);

router.get('/mobile/version', function(req, res) {
    res.status(200).send(process.env.MOBILE_VERSION);
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