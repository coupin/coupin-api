const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();

// Routes
const merchantRoute = require('./merchants');
const rewardRoute = require('./rewards');

merchantRoute(router);
rewardRoute(router);


module.exports = router;