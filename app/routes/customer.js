var express = require('express');
var router = express.Router();
var passport = require('./../middleware/passport');
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// models
const Customer = require('./../models/users');
const CustomerCtrl = require('./../controllers/customer');

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'coupinappcustomer';

router.route('/authenticate')
.post(passport.verify, CustomerCtrl.login)
// To authenticate token
.get(passport.verifyJWT1);


router.route('/register')
// register new user
.post(CustomerCtrl.register);

// Get customer by mobile number
router.route('/:mobileNumber')
.get(CustomerCtrl.retrieveByNo)
// Used to edit the customer
.put(CustomerCtrl.update);

module.exports = router;
