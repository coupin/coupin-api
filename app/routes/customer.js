var express = require('express');
var router = express.Router();
var passport = require('./../middleware/passport');


// models
const Customer = require('./../models/users');
const CustomerCtrl = require('./../controllers/customer');

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
