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
        .get(
            auth.authenticate,
            auth.isSuperAdmin,
            AdminCtrl.getAllAdmins
        )
        .post(
            auth.authenticate,
            auth.isSuperAdmin,
            AdminCtrl.addAdmin
        );

    // TODO: Create init and remove this
    router.route('/admin/sadmin')
        .post(AdminCtrl.addSuperAdmin);

    router.route('/admin/hotlist')
        .put(
            auth.authenticate,
            auth.isAdmin,
            AdminCtrl.removeSlide
        )
        .get(
            AdminCtrl.retrieveHotList
        )
        .post(
            auth.authenticate,
            auth.isAdmin,
            AdminCtrl.setHotList
        );

    // To Delete an Admin 
    router.route('/admin/:id')
        .delete(
            auth.authenticate,
            auth.isSuperAdmin,
            AdminCtrl.delete
        )
        .put(
            auth.authenticate,
            auth.isSuperAdmin,
            AdminCtrl.activeToggle
        );
};