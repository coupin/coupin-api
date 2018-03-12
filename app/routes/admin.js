var passport = require('./../middleware/passport');

// Models
var User = require('../models/users');
// Middles ware
const auth = require('./../middleware/auth');

// Controllers
const AdminCtrl = require('./../controllers/admin');

module.exports = function(router) {
    // Log a user in from the form
    router.route('/admin')
        .post(passport.verify, AdminCtrl.login);
        
    // Admin api routes
    router.route('/admin/all')
        .get(AdminCtrl.getAllAdmins);

    // TODO: Create init and remove this
    router.route('/admin/sadmin')
        .post(AdminCtrl.addSuperAdmin)
        .get(function (req, res) {
            User.find({}, function (err, users) {
                res.json(users);
            });
        });

    // routes to handle all angular requests
    // router.route('/').get(AdminCtrl.loginPage)


    // Add new admin
    router.route('/admin/addAdmin')
        .post(auth.isSuperAdmin, AdminCtrl.addAdmin);

    router.route('/admin/activate/:id')
        .post(auth.isSuperAdmin, AdminCtrl.activate);

    router.route('/admin/deactivate/:id')
        .post(auth.isSuperAdmin, AdminCtrl.deactivate);

    router.route('/admin/hotlist')
        .get(AdminCtrl.retrieveHotList)
        .post(AdminCtrl.setHotList);

    // To Delete an Admin 
    router.route('/admin/:id')
        .delete(auth.isSuperAdmin, AdminCtrl.delete);
};