// models
var Location = require('./models/location');
var User = require('./models/admin');

// Get passport
var passport = require('passport');

// Routes
var adminRouters = require('./routes/admin');
var locationRouters = require('./routes/locations');
var merchantRouters = require('./routes/merchant');

module.exports = function(app) {
    // server routes
    app.use('/admin', adminRouters);
    app.use('/api', merchantRouters);
    app.use('/api/locations', locationRouters);

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

    app.get('/merchant/login', function(req, res) {
        //load the merchant login page
        res.sendfile('./public/views/merchantReg.html');
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/admin/login');
    });

    // frontend routers
    // routes to handle all angular requests
    app.get('*', function(req, res) {
        // load the index page
        res.sendfile('./public/views/index.html');
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