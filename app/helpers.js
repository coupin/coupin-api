var _ = require('lodash');
var moment = require('moment');

var Emailer = require('./../config/email');
var Messages = require('./../config/messages');
var Raven = require('./../config/config').Raven;
var Notification = require('./../config/notifications');
var Rewards = require('./models/reward');
var Users = require('./models/users');
var ConfigModel = require('./models/config');

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
  getUpdateCount: function(cb) {
    var lastChecked = moment(new Date()).subtract(7, 'd').toDate();
    
    Rewards
    .find({
        createdDate:  {
            $gte: lastChecked.toString()
        }
    })
    .select('categories')
    .exec(function(err, rewards) {
      var categories = [];
      /**
       * Obinna wants the total number of merchants with new rewards
       * instead of the total number of actual reqards
       */
      var merchants = [];

      rewards.forEach(function(reward) {
        if (merchants.indexOf(reward.merchantID) === -1) {
          merchants.push(reward.merchantID);
        }
        categories = _.union(reward.categories, categories);
      });

      if (err) {
          cb(null);
          Raven.captureException(err);
      } else {
        cb({
          categories: categories,
          total: merchants.length
        });
      }
    });
  },
  sendNotifications: function(res, isWeekend, cb) {
    var days = isWeekend ? 'weekends' : 'weekdays';
    var title, msg;

    if (res.total > 0) {
      title = 'New Rewards!!!';
      if (res.total > 1) {
        msg = `There are ${res.total} new deals available just for you!`;
      } else {
        msg = 'There is 1 new deal available just for you!'
      }

      Users.find({
        'interests': {
          $in: res.categories
        },
        'notification.notify': true,
        'notification.days': days,
        'notification.token': {
          $ne: null
        }
      }).select('notification').exec(function(err, users) {
        if(err) {
          cb(false);
          Raven.captureException(err);
        } else {
          var tokens = [];
  
          users.forEach(function(user) {
            tokens.push(user.notification.token);
          });
  
          Notification.sendMessage(title, msg, tokens, {
            navigateTo: 'hot'
          });
          cb(true);
        }
      });
    }
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
    .populate('merchantInfo.rewards', 'endDate isActive startDate status')
    .populate('merchantInfo.pendingRewards', 'endDate isActive startDate status')
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
              if (today.isSameOrAfter(reward.endDate)) {
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
  },
  getConfig: function (cb) {
    ConfigModel.find({}, function (err, config) {
      if (err) {
        Raven.captureMessage('An error coccured while trying to get config');
        Raven.captureException(err);
        cb(false)
      } else {
        if (config.length > 0) {
          cb(config[0])
        } else {
          cb({});
        }
      }
    });
  },
  disabledTrialPeriod: function (configId, cb) {
    trialPeriodStatus = false;
    trialPeriodDuration = 0;

    ConfigModel.update({ _id: configId }, {
      trialPeriod: {
        enabled: false,
        endDate: null,
        duration: 0,
      },
    }, function (err, data) {
      if (err) {
        Raven.captureMessage('An error coccured while trying to disable trial period');
        Raven.captureException(err);
        cb(false);
      } else {
        cb(true);
      }
    });
  }
};