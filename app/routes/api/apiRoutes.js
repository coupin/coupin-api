const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();

// Routes
const merchantRoute = require('./merchants');

merchantRoute(router);

module.exports = router;