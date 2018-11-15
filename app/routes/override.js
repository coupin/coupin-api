var moment = require('moment');

// Middleware
const auth = require('./../middleware/auth');
const booking = require('./../models/bookings');

// Controllers
const MerchantCtrl = require('./../controllers/merchant');
var Rewards = require('./app/models/reward');
var Raven = require('./../../config/config').Raven;
var Users = require('./../models/users');

module.exports = function(router) {
  // router.route('/override/code/delete').post(function(req, res) {
  //   booking.remove({}, function(err) {
  //     if (err) {
  //       console.log(err);
  //     }

  //     res.status(200).send("Done!");
  //   });
  // });
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
              if (moment(reward.startDate).isSameOrBefore(date) && reward.isActive && reward.status !== 'draft') {
                active.push(reward._id);
                pending.splice(index, 1);
              }
            });
            
            active.forEach(function(reward, index) {
              if (moment(reward.endDate).isAfter(date)) {
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
          res.status(200).send({ message: 'Done.' });
          Raven.captureMessage('Done with Update');
        }
      });
    }
  });
};