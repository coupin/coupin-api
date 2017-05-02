// Get passport
var passport = require('passport');

// Routes
var adminRouter = require('./routes/admin');
var merchantRouter = require('./routes/merchant');
var userRouter = require('./routes/customer.js');

module.exports = function(app) {
    // server routes
    app.use('/admin', adminRouter);
    app.use('/merchant', merchantRouter);
    app.use('/customer', userRouter);

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
    // app.get('*', function(req, res) {
    //     // load the index page
    //     res.sendfile('./public/views/index.html');
    // });
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