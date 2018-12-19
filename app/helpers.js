var moment = require('moment');

var Emailer = require('./../config/email');
var Messages = require('./../config/messages');
var Raven = require('./../config/config').Raven;
var Rewards = require('./models/reward');
var Users = require('./models/users');

module.exports = {
  resetRewards: function(cb) {
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
        });
      });
      cb(true);
    });
  },
  sortRewards: function(cb) {
    Rewards.find({
      status: 'active'
    }, function(err, rewards) {
      if (rewards.length > 0) {
        var date = new Date();

        rewards.forEach(function(reward) {
          if (moment(date).isAfter(reward.endDate)) {
            reward.status = 'expired';
            reward.save();
          }

          if (moment(date).days(2).isSame(reward.endDate)) {
            Users.populate(reward, {
              path: 'merchantID',
              model: 'User',
              select: 'email merchantInfo.companyName'
            }, function(err, reward) {
              if (err) {
                return;
              } else {
                Emailer.sendEmail(reward.merchantID.email, `${reward.name} Expiring Soon`, Messages.rewardExpiring(
                  reward.merchantID.merchantInfo.companyName,
                  reward.name,
                  moment(reward.endDate).format("dddd, MMMM Do YYYY")
                  ), function(response) {
                    console.log(response);
                  });
              }
            });
          }
        });
      }

      Raven.captureMessage('Done with Reward sorting');
      cb(true);
    });
  },
  sortMerchantRewards: function(cb) {
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
            cb(false);
        } else {
          var today = moment(new Date());
          merchants.forEach(function(merchant) {
            var active = merchant.merchantInfo.rewards || [];
            var pending = merchant.merchantInfo.pendingRewards || [];
            var expired = merchant.merchantInfo.expiredRewards || [];
            var indexes = [];

            pending.forEach(function(reward, index) {
              if (today.isSameOrAfter(reward.startDate) && reward.isActive && reward.status === 'active') {
                active.push(reward);
                indexes.push(index);
              }
            });

            for (var z = indexes.length - 1; z >= 0; z--) {
              pending.splice(indexes[z], 1);
            };

            indexes = [];
            active.forEach(function(reward, index) {
              if (today.isAfter(reward.endDate)) {
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
              Raven.captureException(err);
            });
          });
          Raven.captureMessage('Done with Update');
          cb(true);
        }
    });
  }
};