// Modules
var express = require('express');
var router = express.Router();
var moment = require('moment');

var passport = require('./../middleware/passport');

// Models
var User = require('../models/users');

// Middles ware
const auth = require('./../middleware/auth');

// Controllers
const AdminCtrl = require('./../controllers/admin');

// Admin api routes
router.route('/all').get(AdminCtrl.getAllAdmins);

// TODO: Create init and remove this
router.route('/sadmin').post(AdminCtrl.addSuperAdmin).get(function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    });
});


// frontend routers
// routes to handle all angular requests
router.route('/').get(AdminCtrl.loginPage)
// Log a user in from the form
.post(passport.verify, AdminCtrl.login);

// Add new admin
router.route('/addAdmin').post(auth.isSuperAdmin, AdminCtrl.addAdmin);

router.route('/activate/:id').post(auth.isSuperAdmin, AdminCtrl.activate);

router.route('/deactivate/:id').post(auth.isSuperAdmin, AdminCtrl.deactivate);

// Get currently logged in user
router.route('/getCurrentUser').get(function(req, res){
    res.send(req.user);
});

router.route('/hotlist')
.get(AdminCtrl.retrieveHotList)
.post(AdminCtrl.setHotList);

// To Delete an Admin 
router.route('/:id').delete(auth.isSuperAdmin, AdminCtrl.delete);

module.exports = router;