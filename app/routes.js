// Get passport
var passport = require('passport');

// Routes
const apiRouter = require('./routes/api/apiRoutes');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const merchantRouter = require('./routes/merchant');
const userRouter = require('./routes/customer');
const rewardRouter = require('./routes/reward');

module.exports = function(app) {
    // server routes
    app.use('/api', apiRouter);
    app.use('/auth', authRouter);
    app.use('/admin', adminRouter);
    app.use('/reward', rewardRouter);
    app.use('/customer', userRouter);
    app.use('/merchant', isLoggedIn, merchantRouter);

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

    // app.get('/merchant/login', function(req, res) {
    //     //load the merchant login page
    //     res.sendfile('./public/views/merchantReg.html');
    // });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/admin');
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
        res.redirect('/admin');
    }
}