const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();
const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');

//Controller
const authCtrl = require('./../controllers/auth');

router.route('/password')
    .post(auth.authenticate, authCtrl.changePassword);

module.exports = router;