// models
var Location = require('./models/location');
var User = require('./models/admin');

// Get passport
var passport = require('passport');

// Routes
var locationRouters = require('./routes/locations');
var userRouters = require('./routes/user');

module.exports = function(app) {
    // server routes
    app.use('/api/locations', locationRouters);
    app.use('/users', userRouters);

    // frontend routers
    // routes to handle all angular requests
    app.get('/login', function(req, res) {
        // load the index page
        res.sendfile('./public/views/index.html');
    });

    // Sign Up Routes
    app.get('/signup', function(req, res) {
        // load the index page
        res.sendfile('./public/views/signup.html', {message: req.flash('SignUpMessage')});
    });

    // Sign a user up from the form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/homepage',
        failureRedirect : '/login',
        failureFlash: true 
    }));

    // Log a user in from the form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/homepage',
        failureRedirect : '/login',
        failureFlash: true 
    }));

    app.get('/homepage', isLoggedIn, function(req, res) {
        // load the home page
        res.sendfile('./public/views/base.html');
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });
    // route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
        // if user is logged in then carry frontend
        if(req.isAuthenticated()) {
            console.log(req);
            return next();
        }

        // if not redirect to login screen
        res.redirect('/login');
    }

}