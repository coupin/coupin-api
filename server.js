var _ = require('lodash');
var bodyParser = require('body-parser');
var cron = require("node-cron");
var dotenv = require('dotenv');
// server module
var express = require('express');
//var session = require('express-session');
var methodOverride = require('method-override');

// Express validatory
var expressValidator = require('express-validator');
// Database module
var mongoose = require('mongoose');
// authentication module
var passport = require('passport');
var cookieParser = require('cookie-parser');
// For logging all request
var morgan = require('morgan');
// For token validation
var fs = require('fs-extra');
var busboy = require('connect-busboy');
var cors = require('cors');

var myRoutes = require('./app/routes');
var helper = require('./app/helpers');

var app = express();
dotenv.config();

// set our port
var port = process.env.PORT || 5030;

// connect to db
// mongoose.connect(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL_STAGING);
// mongoose.connect(process.env.LOCAL_URL);

/**
 * get all data of the body parameters
 * parse application/json
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// app.use(function(req, res, next) {
//   if(!req.secure && process.env.NODE_ENV !== 'development') {
//     var secureUrl = 'https://' + req.headers['host'] + req.url;
//     res.redirect(secureUrl);
//   } else {
//     next();
//   }
// });

/**
 * override with the X-HTTP-Override header in the request.
 * Simulate DEvarE and PUT
 */
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img
app.use(express.static(__dirname + '/apiDoc'));

// Add express validator
app.use(expressValidator());

// Initialize passport and it's sessions
app.use(passport.initialize());
app.use(passport.session());

app.use('/doc', function(req, res) {
  res.status(200).sendfile('./apiDoc/index.html');
});

// configure our routes
app.use('/api/v1', myRoutes);

cron.schedule('0 10 1 * * *', function() {
  helper.sortRewards(function() {
    helper.sortMerchantRewards(function() {});
  });
});

cron.schedule('0 11 * * 1', function() {
  helper.getUpdateCount(function(res) {
    helper.sendNotifications(res.total, false, function(isSuccessful) {
      var date = new Date();
      console.log('Notifications sent at: ' + date.toISOString());
    });
  });
});

cron.schedule('0 11 * * 5', function() {
  helper.getUpdateCount(function(res) {
    helper.sendNotifications(res.total, true, function(isSuccessful) {
      var date = new Date();
      console.log('Notifications sent at: ' + date.toISOString());
    });
  });
});

//start on localhost 3030
app.listen(port).on('error', function (err) {
  console.log(err);
});

// confirmation
console.log('Coupin API started on ' + port);

// expose app
module.exports = app;