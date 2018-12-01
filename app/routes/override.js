var moment = require('moment');

// Middleware
const auth = require('./../middleware/auth');
const booking = require('./../models/bookings');

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
    var body = req.body;
  
    if (req.body.password !== process.env.UPDATE_PASS) {
      res.status(404).send({ message: 'Not Found' });
    } else {
      var count = 1;
      Users.find({
        role: 2
      }, function(err, merchants) {
        merchants.forEach(function(merchant) {
          Rewards.find({
            merchantID: merchant._id
          }, function(err, rewards) {
            merchant.merchantInfo.pendingRewards = [];
            merchant.merchantInfo.rewards = [];
            merchant.merchantInfo.expiredRewards = [];
            
            if (rewards && rewards.length > 0) {
              rewards.forEach(function(reward) {
                merchant.merchantInfo.pendingRewards.push(reward._id);
              });
            }
            
            merchant.save();
            count++;
          });
        });
        res.status(200).send({ message: 'Done Resetting.' });
      });
    }
  });

  router.route('/override/merchant/update').post(function(req, res) {
    var body = req.body;

    if (req.body.password !== process.env.UPDATE_PASS) {
      res.status(404).send({ message: 'Not Found' });
    } else {
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
      .populate('merchantInfo.rewards', 'endDate isActive startDate status')
      .populate('merchantInfo.pendingRewards', 'endDate isActive startDate status')
      .exec(function(err, merchants) {
        if (err) {
            Raven.captureMessage('An error occured while updating merchant\'s rewards. See below for reason.');
            Raven.captureException(err);
        } else {
          var date = new Date();
          date.setHours(1);
          date.setMinutes(0);
          date.setSeconds(0);
          merchants.forEach(function(merchant) {
            var active = merchant.merchantInfo.rewards || [];
            var pending = merchant.merchantInfo.pendingRewards || [];
            var expired = merchant.merchantInfo.expiredRewards || [];
            var indexes = [];

            pending.forEach(function(reward, index) {
              if (dateCheck(reward.startDate, date.toString(), false) && reward.isActive && reward.status === 'active') {
                active.push(reward);
                indexes.push(index);
              }
            });

            for (var z = indexes.length - 1; z >= 0; z--) {
              pending.splice(indexes[z], 1);
            };

            indexes = [];
            active.forEach(function(reward, index) {
              if (dateCheck(reward.endDate, date.toString(), false)) {
                expired.push(reward);
                indexes.push(index);
              }
            });
            for (var z = indexes.length - 1; z >= 0; z--) {
              active.splice(indexes[z], 1);
            };

            merchant.merchantInfo.expiredRewards = [];
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
              if (err) {
                Raven.captureException(err);
              }
            });
          });
          res.status(200).send({ message: 'Done.' });
          Raven.captureMessage('Done with Update');
        }
      });
    }
  });
};