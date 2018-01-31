// Get passport
const passport = require('./middleware/passport');

// Routes
const apiRouter = require('./routes/mobile/apiRoutes');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const merchantRouter = require('./routes/merchant');
const overrideRouter = require('./routes/override');
const rewardRouter = require('./routes/web/rewards');
const userRouter = require('./routes/customer');

module.exports = function(app) {
    // server routes
    app.use('/api/v1', apiRouter);
    app.use('/auth', authRouter);
    app.use('/admin', adminRouter);
    app.use('/reward', rewardRouter);
    app.use('/customer', userRouter);
    app.use('/merchant', merchantRouter);
    app.use('/override', overrideRouter);

    // frontend routers
    app.get('/', function(req, res) {
        res.sendfile('./public/views/welcome.html');
    });
    
    // Sign Up Routes
    app.get('/signup', function(req, res) {
        // load the index page
        res.sendfile('./public/views/signup.html', {message: req.flash('SignUpMessage')});
    });
    
    app.get('/homepage', function(req, res) {
        // load the home page
        res.sendfile('./public/views/base.html');
    });

    // app.get('/merchant/login', function(req, res) {
    //     //load the merchant login page
    //     res.sendfile('./public/shared/views/merchantReg.html');
    // });

    app.get('/logout/:opt', function(req, res) {
        req.logout();
        if (req.params.opt === 0) {
            res.redirect('/admin');
        } else {
            res.redirect('/merchant');
        }
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