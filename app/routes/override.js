const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();
const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');

// ontrollers
const MerchantCtrl = require('./../controllers/merchant');

router.route('/merchant').post(MerchantCtrl.adminCreate);

module.exports = router;