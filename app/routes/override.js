var moment = require('moment');

// Middleware
const auth = require('./../middleware/auth');
const booking = require('./../models/bookings');
var moment = require('moment');

var helper = require('../helpers');

// Controllers
const MerchantCtrl = require('./../controllers/merchant');
var Rewards = require('./../models/reward');
var Raven = require('./../../config/config').Raven;
var Users = require('./../models/users');

function dateCheck(dateStr1, dateStr2, isGreater) {
  var date1 = new Date(dateStr1);
  var date2 = new Date(dateStr2);
  var sameMonth = date1.getMonth() === date2.getMonth();

  if (isGreater) {
    return date1.getFullYear() >= date2.getFullYear() &&
    date1.getMonth() >= date2.getMonth() &&
    (sameMonth ? date1.getDate() >= date2.getDate() : true);
  } else {
    return date1.getFullYear() <= date2.getFullYear() &&
    date1.getMonth() <= date2.getMonth() &&
    (sameMonth ? date1.getDate() <= date2.getDate() : true);
  }
}

module.exports = function(router) {
  router.route('/override/rewards/reset').post(function(req, res) {
    var password = req.body.password;

    if (password !== process.env.UPDATE_PASS) {
      res.status(404).send({ message: 'Not Found' });
    } else {
      helper.resetRewards(function(success) {
        if (!success) {
          res.status(404).send({ message: 'Not Found' });
        } else {
          res.status(200).send({ message: 'Done Resetting.' });
        }
      });
    }
  });

  router.route('/override/rewards/update').post(function(req, res) {
    var body = req.body;

    if (req.body.password !== process.env.UPDATE_PASS) {
      res.status(404).send({ message: 'Not Found' });
    } else {
      helper.sortRewards(function(success) {
        if (!success) {
          res.status(404).send({ message: 'Not Found' });
        } else {
          res.status(200).send({ message: 'Done.' });
        }
      });
    }
  });

  router.route('/override/merchant/update').post(function(req, res) {
    var body = req.body;

    if (req.body.password !== process.env.UPDATE_PASS) {
      res.status(404).send({ message: 'Not Found' });
    } else {
      helper.sortMerchantRewards(function(success) {
        if (!success) {
          res.status(404).send({ message: 'Not Found' });
        } else {
          res.status(200).send({ message: 'Done.' });
        }
      });
    }
  });
};