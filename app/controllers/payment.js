var _ = require('lodash');
var https = require('https');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var moment = require('moment');
var querystring = require('querystring');
var { StringDecoder } = require('string_decoder');
var Raven = require('./../../config/config').Raven;

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

      res.status(400).json({
        message: message,
      });
    } else {
      // for creating the reference
      var referencePrefix = body.type === 'reward' ? `${body.reward.id}-${body.companyName.split(' ')[0]}` : `${body.billingPlan}-${body.userId}`;

      var date = new Date();
      var reference = `${referencePrefix}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getTime()}`;

      var customFields = [
        {
          display_name: 'Payment Type',
          variable_name: 'paymentType',
          value: body.type,
        },
        {
          display_name: body.type === 'reward' ? 'Reward Name' : 'Plan',
          variable_name: body.type === 'reward' ? 'The name of the reward' : 'Billing_Plan',
          value: body.type === 'reward' ? `${body.reward.name}` : `${body.companyName} - ${body.billingPlan}-${date.getTime()}`
        },
        {
          display_name: 'Merchant Identification',
          variable_name: 'merchantId',
          value: body.userId,
        },
        {
          display_name: 'Payment Reference',
          variable_name: 'reference',
          value: reference,
        }
      ];

      if (body.type === 'reward') {
        customFields.push({
          display_name: 'Reward Identification',
          variable_name: 'rewardId',
          value: body.reward.id,
        })
      }

      if (body.type === 'billing') {
        customFields.push({
          display_name: 'Billing Plan',
          variable_name: 'billingPlan',
          value: body.billingPlan,
        })
      }

      // data to send to paystack
      var postData = JSON.stringify({
        callback_url: body.callbackUrl,
        email: body.email,
        amount: body.amount * 100,
        ref: reference,
        metadata: {
          custom_fields: customFields,
        },
      });

      var paystackRequest = https.request({
        // url: `${process.env.PAYSTACK_URL}/transaction/initialize`,
        protocol: 'https:',
        hostname: 'api.paystack.co',
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      }, (paystackResponse) => {
        const status = paystackResponse.statusCode;
        var decoder = new StringDecoder('utf-8');
        let buffer = '';
        let parsedData;

        // Getting the request data
        paystackResponse.on('data', (chunk) => {
          buffer += decoder.write(chunk);
        });

        // End of request data
        paystackResponse.on('end', () => {
          buffer += decoder.end();
          parsedData = JSON.parse(buffer);

          // Successful request
          if (status === 200) {
            if (parsedData && parsedData.status) {
              // successfully created authorization url
              // send the user the authorizationUrl
              res.json({
                ...parsedData.data,
              });
            } else {
              // Could not create authorization url
              res.status(500).json({
                message: parsedData.message,
              });
            }
          } else {
            // Problem from paystack
            console.log(status, 'status')
            res.status(500).json({
              message: 'There was a problem initiating payment, please try again later',
            });
          }
        });
      });

      paystackRequest.on('error', (e) => {
        // Problem from paystack or sending to paystack
        console.error(`problem with request: ${e.message}`);
        Raven.captureException(e);
        res.status(500).json({
          message: 'There was a problem initiating payment, please try again later',
        });
      });

      paystackRequest.write(postData);
      paystackRequest.end();
    }
  },

  /**
   * This should not be exposed to the users on the application, it is used to confirm payment from paystack
   */
  paymentSuccess: function (req, res) {
    var  signature = req.headers['x-paystack-signature'] || '';
    var body= req.body;

    // only a post with paystack signature header gets our attention
    res.end();

    if (signature) {
      var bodyHash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(body)).digest('hex');

      if (bodyHash === signature) {
        if (body.event === 'charge.success') { 
          var customFields = body.data.metadata.custom_fields;
          // var reference = body.data.reference;
          var reference = _.find(customFields, { 'variable_name': 'reference' }).value;
          var paymentType = _.find(customFields, { 'variable_name': 'paymentType' }).value;
          var merchantId = _.find(customFields, { 'variable_name': 'merchantId' }).value;
          var merchantBillingType = ''
          var rewardId = '';

          // Get the billing type so the merchant info can be updated
          if (paymentType === 'reward') {
            rewardId = _.find(customFields, { 'variable_name': 'rewardId' }).value;
            merchantBillingType = 'payAsYouGo';
          } else if (paymentType === 'billing') {
            merchantBillingType = _.find(customFields, { 'variable_name': 'billingPlan' }).value;
          }

          // Save the merchant billing information
          var isFirstTime = false;

          var merchantPromise = Merchant.findById(merchantId).exec().then(function (merchant) {
            if (!merchant) {
              Raven.captureException({ 
                err: '',
                message: 'User does not exist.', 
                merchantId: merchantId,
                type: 'Merchant billing update',
              });
            } else {
              merchant.merchantInfo.billing.plan = merchantBillingType;
              if (!merchant.merchantInfo.billing.history) {
                merchant.merchantInfo.billing.history = [];
                isFirstTime = true;
              }
              var expiration = null;
              if (isFirstTime && moment(new Date()).isBefore('2020-04-01')) {
                expiration = moment(new Date()).add(2, 'months').toDate();
              } else {
                if (merchantBillingType !== 'payAsYouGo') {
                  if (merchantBillingType === 'monthly') {
                    expiration = moment(new Date()).add(1, 'months').toDate();
                  } else if (merchantBillingType === 'yearly') {
                    expiration = moment(new Date()).add(1, 'years').toDate();
                  } else {
                    expiration = null;
                  }
                }
              }

              merchant.merchantInfo.billing.history.unshift({
                plan: isFirstTime ? 'monthly' : merchantBillingType,
                reference: isFirstTime ? 'coupin-promo-first-timer' : reference,
                expiration: expiration
              });

              return merchant.save();
            }
          }, function (err) {
            // Handle error while trying to retieve merchant
            Raven.captureException({
              error: err, 
              message: 'Error retrieveing the merchant information during payment processing', 
              merchantId: merchantId,
              type: 'Merchant billing update',
            });
          })

          if (paymentType === 'reward') {
            merchantPromise.then(function (merchant) {
                if (merchant) {
                  // if type is reward then initiate the reward update
                  return Reward.findById(rewardId).exec();
                }
            }, function (err) {
              // Handle error while trying to save merchant billing and history
              Raven.captureException({ 
                err: err,
                message: 'Error updating Merchant billing history and history', 
                merchantId: merchantId,
                type: 'Merchant billing update',
              });
            }).then(function (reward) {
              // do stuff to reward
              if (!reward) {
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
              // Handle error while to retrieve
              Raven.captureException({ 
                err: err,
                message: 'Error retrieving reward information', 
                rewardId: rewardId,
                type: 'Reward Payment update',
              });
            }).then(function () {},
              function (err) {
                Raven.captureException({ 
                  err: err,
                  message: 'Error updating Reward details', 
                  rewardId: rewardId,
                  type: 'Reward status update',
                });
              })
          }
        }
      }
    }
  }
};
