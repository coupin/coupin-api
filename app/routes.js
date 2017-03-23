// models
var Location = require('./models/location');
var User = require('./models/admin');

// Get passport
var passport = require('passport');

// Routes
var locationRouters = require('./routes/locations');
var adminRouters = require('./routes/admin');

module.exports = function(app) {
    // server routes
    app.use('/api/locations', locationRouters);
    app.use('/admin', adminRouters);

    // frontend routers
    
    // Sign Up Routes
    app.get('/signup', function(req, res) {
        // load the index page
        res.sendfile('./public/views/signup.html', {message: req.flash('SignUpMessage')});
    });

    app.get('/homepage', isLoggedIn, function(req, res) {
        // load the home page
        res.sendfile('./public/views/base.html');
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/admin/login');
    });
    // route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
        // if user is logged in then carry frontend
        if(req.isAuthenticated()) {
            return next();
        }

        // if not redirect to login screen
        res.redirect('/admin/login');
    }
}