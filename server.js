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
var Raven = require('./config/config').Raven;

var Users = require('./app/models/users');
// TODO: Remove
var Rewards = require('./app/models/reward');

var app = express();
dotenv.config();

// set our port
var port = process.env.PORT || 5030;

// connect to db
mongoose.connect(process.env.MONGO_URL);
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

function sortMerchantRewards() {
    Users.find({
        isActive: true,
        status: 'completed',
        role: 2,
        $or: [
          {
            'merchantInfo.pendingRewards.0': {
              $exists: true
            }
          },
          {
            'merchantInfo.rewards.0': {
              $exists: true
            }
          }
        ]
    })
    .populate('merchantInfo.rewards', 'endDate isActive startDate')
    .populate('merchantInfo.pendingRewards', 'endDate isActive startDate')
    .exec(function(err, merchants) {
        if (err) {
            Raven.captureMessage('An error occured while updating merchant\'s rewards. See below for reason.');
            Raven.captureException(err);
        } else {
          var date = new Date();
          date.setHours(0);
          date.setMinutes(0);
          date.setSeconds(0);
          merchants.forEach(function(merchant) {
            var active = merchant.merchantInfo.rewards || [];
            var pending = merchant.merchantInfo.pendingRewards || [];
            var expired = merchant.merchantInfo.expiredRewards || [];

            pending.forEach(function(reward, index) {
              if (reward.startDate <= date && reward.isActive && reward.status !== 'draft') {
                active.push(reward._id);
                pending.splice(index, 1);
              }
            });
            
            active.forEach(function(reward, index) {
              if (reward.endDate < date) {
                expired.push(reward._id);
                active.splice(index, 1);
              }
            });

            merchant.merchantInfo.rewards = [];
            merchant.merchantInfo.pendingRewards = [];
            active.filter(Boolean).forEach(function(temp) {
              if (temp && temp !== null) {
                merchant.merchantInfo.rewards.push(temp._id);
              }
            });
            pending.filter(Boolean).forEach(function(temp) {
              if (temp && temp !== null) {
                merchant.merchantInfo.pendingRewards.push(temp._id);
              }
            });
            expired.filter(Boolean).forEach(function(temp) {
              if (temp && temp !== null) {
                merchant.merchantInfo.expiredRewards.push(temp._id);
              }
            });

            merchant.save(function(err) {
              Raven.captureException(err);
            });
          });
          Raven.captureMessage('Done with Update');
        }
    });
}

cron.schedule("59 23 * * *", function() {
  sortMerchantRewards();
});

//start on localhost 3030
app.listen(port).on('error', function (err) {
  console.log(err);
});

// confirmation
console.log('Coupin API started on ' + port);

// expose app
module.exports = app;