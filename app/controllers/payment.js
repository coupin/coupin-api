var moment = require('moment');

var paystackPayment = require('./../services/paystack');
var flutterwavePayment = require('./../services/flutterwave');

// Models
var Reward = require('./../models/reward')
var Merchant = require('./../models/users');

module.exports = {
  /**
   * Initiate merchant payment
   */
  initiatePayment: function (req, res) {
    var body = req.body;
    /**
     * Example data for body
     * 
     * {
     *  callbackUrl: 'url'
     *  amount: 10000, // amount in naira
     *  email: email@email.ie
     *  type: ['billing', 'reward']
     *  companyName: 'company name'
     *  userId: 'user id'
     *  billingPlan: if type is billing
     *  reward: { if the type is reward
     *    id: 2344,
     *    name: 'reward name'
     *  }
     * }
     */

    if (!body.amount || !body.email || !(body.type === 'billing' || body.type === 'reward')) {
      var message = 'Missing fields for initiating payment:';

      if (!body.amount) message += ' amount';
      if (!body.email) message += ' email';
      if (!(body.type === 'billing' || body.type === 'reward')) message += 'type should be reward or billing'

      return res.status(400).json({
        message: message,
      });
    }

    return flutterwavePayment
      .initiateTransaction(body)
      .then(function (response) {
        if (response.success) {
          res.json(response);
        } else {
          res.status(500).json(response);
        }
      })
      .catch(function (error) {
        res.status(500).json(error);
      });
  },

  /**
   * This should not be exposed to the users on the application, it is used to confirm payment from paystack
   */
  paystackPaymentSuccess: function (req, res) {
    var signature = req.headers['x-paystack-signature'] || '';
    var body = req.body;

    // only a post with paystack signature header gets our attention
    res.end();

    paystackPayment.processPayment(body, signature);
  },

  flutterwavePaymentSuccess: function (req, res) {
    // retrieve the signature from the header
    var hash = req.headers["verif-hash"];

    res.end();

    if (hash) {
      // Get signature stored as env variable on your server
      var secret_hash = process.env.FLUTTERWAVE_SECRET_HASH;

      // check if signatures match
      if (hash === secret_hash) {
        var requestJson = req.body;

        var data = requestJson.data || requestJson || {};

        // TODO: this is here for testing purposes
        console.log(requestJson, '<== ==>');

        var reference = data.tx_ref;
        var flutterwaveRef = data.flw_ref;
        var flutterwaveId = data.id;

        flutterwavePayment
          .verifyTransaction(flutterwaveId)
          .then(({ status, meta }) => {
            var paymentType = meta.paymentType || '';
            var merchantId = meta.merchantId || '';
            var rewardId = meta.rewardId || '';
            var billingPlan = meta.billingPlan || '';

            if (status === 'success') {
              // Save the merchant billing information
              var isFirstTime = false;

              Merchant.findById(merchantId).exec().then(function (merchant) {
                if (!merchant) {
                  Raven.captureException({
                    err: '',
                    message: 'User does not exist.',
                    merchantId: merchantId,
                    type: 'Merchant billing update',
                  });
                } else {
                  merchant.merchantInfo.billing.plan = billingPlan;
                  if (!merchant.merchantInfo.billing.history) {
                    merchant.merchantInfo.billing.history = [];
                    isFirstTime = true;
                  }

                  var expiration = null;
                  if (billingPlan !== 'payAsYouGo') {
                    if (billingPlan === 'monthly') {
                      expiration = moment(new Date()).add(1, 'months').toDate();
                    } else if (billingPlan === 'yearly') {
                      expiration = moment(new Date()).add(1, 'years').toDate();
                    } else {
                      expiration = null;
                    }
                  }

                  merchant.merchantInfo.billing.history.unshift({
                    plan: isFirstTime ? 'monthly' : billingPlan,
                    reference: reference,
                    expiration: expiration
                  });

                  // This is an new addition
                  if (merchant.status !== 'completed') {
                    merchant.isActive = true;
                    merchant.status = 'completed';
                    merchant.completedDate = new Date();
                  }

                  console.log('just before merchant.save');
                  merchant.save();

                  if (paymentType === 'reward') {
                    handleRewardUpdate(rewardId)
                  }
                }
              }, function (err) {
                console.error(err.message)
                // Handle error while trying to retieve merchant
                Raven.captureException({
                  error: err,
                  message: 'Error retrieveing the merchant information during payment processing',
                  merchantId: merchantId,
                  type: 'Merchant billing update',
                });
              })
              .catch(function (err) {
                console.error(err.message);
                Raven.captureException({
                  error: err,
                  message: err.message,
                  merchantId: merchantId,
                  type: 'Merchant billing update',
                });
              });

              function handleRewardUpdate(rewardId) {
                Reward.findById(rewardId).exec()
                  .then(function (reward) {
                    if (!reward) {
                      console.log('reward doesn\'t exist');
                      Raven.captureException({
                        err: '',
                        message: 'Reward does not exist.',
                        rewardId: rewardId,
                        type: 'Reward Payment update',
                      });
                    } else {
                      reward.status = 'isPending';
                      reward.isActive = true;
                      reward.modifiedDate = Date.now();
                      return reward.save();
                    }
                  }, function (err) {
                    console.log('some error here, meant to be error for getting reward');
                    console.error(err.message);
                    // Handle error while to retrieve
                    Raven.captureException({
                      err: err,
                      message: 'Error retrieving reward information',
                      rewardId: rewardId,
                      type: 'Reward Payment update',
                    });
                  })
                  .then(function () { },
                    function (err) {
                      console.log('some error here, meant to be error for updating reward');
                      console.error(err.message);
                      Raven.captureException({
                        err: err,
                        message: 'Error updating Reward details',
                        rewardId: rewardId,
                        type: 'Reward status update',
                      });
                    });
              }
            }
          });
      }
    }
  },
};
