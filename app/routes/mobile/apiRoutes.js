const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();

// Routes
const merchantRoute = require('./merchants');
const rewardRoute = require('./rewards');
const userRoute = require('./users');

merchantRoute(router);
rewardRoute(router);
userRoute(router);



module.exports = router;