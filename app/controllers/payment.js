var moment = require('moment');
var Raven = require('./../../config/config').Raven;

var paystackPayment = require('./../services/paystack');
var flutterwavePayment = require('./../services/flutterwave');

// Models
var Reward = require('./../models/reward')
var Merchant = require('./../models/users');
var Booking = require('./../models/bookings');

module.exports = {
  /**
   * @api {post} /initiatepayment Initiate merchant payment
   * @apiName initiatePayment
   * @apiGroup Payment
   * 
   * @apiParam {String} callbackUrl - url to redirect user to on payment success or failure
   * @apiParam {Number} amount - amount to be paid
   * @apiParam {String} email - email of user making payment
   * @apiParam {String="billing", "reward"} type
   * @apiParam {String} companyName - company name
   * @apiParam {String} userId - id of user making payment
   * @apiParam {String} [billingPlan] - plan user is paying for if it is payment for billing plan
   * @apiParam {Object} [reward] - reward if type is reward
   * 
   * @apiParamExample {json} reward:
   * {
   *    "id": "reward-id",
   *    "name": "reward name"
   * }
   * 
   * @apiSuccess {Object} 
   * 
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *      "status": "success",
   *      "message": "Hosted Link",
   *      "data": {
   *        "link": "https://api.flutterwave.com/v3/hosted/pay/ab238syge94"
   *      }
   *  }
   * 
   * @apiError (Error 5xx) ServerError an error occured on the server.
   * 
   * @apiErrorExample ServerError:
   *  HTTP/1.1 500 ServerError
   *  {
   *      "message": "Server Error."
   *  }
   */
  initiatePayment: function (req, res) {
    var body = req.body;

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

        Raven.captureMessage(data);

        var reference = data.tx_ref;
        var flutterwaveRef = data.flw_ref;
        var flutterwaveId = data.id;

        flutterwavePayment
          .verifyTransaction(flutterwaveId)
          .then(function (result) {
            var paymentType = result.meta.paymentType || '';
            var merchantId = result.meta.merchantId || '';
            var rewardId = result.meta.rewardId || '';
            var billingPlan = result.meta.billingPlan || '';
            var coupinId = result.meta.coupinId || '';
            var userId = result.meta.userId || '';

            if (result.status === 'success') {
              if (paymentType === 'reward' || paymentType === 'billing') {
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
              } else if (paymentType === 'coupin') {
                // get user information
                // get coupin based on id
                // update transaction reference information
                // check if transaction has been successful
                // redeem the coupin

                // Booking.findById(bookingId)
                //   .populate('rewardId.id', 'multiple')
              }
            }
          });
      }
    }
  },

  initializeCoupinPayment: function (req, res) {
    var body = req.body;
    var coupinId = body.coupinId;
    var userId = body.userId;
    var date = new Date();
    
    // create reference
    var reference = `coupin-${coupinId}-${userId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getTime()}`;

    // get the coupin and update the transaction object
    Booking.findById(coupinId)
      .exec(function (err, booking) {
        if (err) {
          res.status(500).send(err);
          Raven.captureException(err);
        } else if (!booking) {
          res.status(404).send({ message: 'Coupin deos not exist.' });
        } else {
          booking.transactions.unshift({
            reference: reference,
          });

          booking.save(function (err) {
            if (err) {
              res.status(500).send(err);
              Raven.captureException(err);
            } else {
              res.json({
                success: true,
                data: {
                  reference: reference
                },
              });
            }
          });
        }
      });
  }
};
