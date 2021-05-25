var crypto = require('crypto');
var _ = require('lodash');
var moment = require('moment');
var { StringDecoder } = require('string_decoder');
var https = require('https');

var Raven = require('./../../config/config').Raven;

// Models
var Reward = require('./../models/reward')
var Merchant = require('./../models/users');

module.exports = {
  initiateTransaction: function (body) {
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

    return new Promise(function (resolve, reject) {
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
              resolve({
                ...parsedData.data,
              });
            } else {
              // Could not create authorization url
              reject({
                message: parsedData.message,
              });
            }
          } else {
            // Problem from paystack
            reject({
              message: 'There was a problem initiating payment, please try again later',
            });
          }
        });
      });

      paystackRequest.on('error', (e) => {
        // Problem from paystack or sending to paystack
        console.error(`problem with request: ${e.message}`);
        Raven.captureException(e);
        reject({
          message: 'There was a problem initiating payment, please try again later',
        });
      });

      paystackRequest.write(postData);
      paystackRequest.end();
    });
  },

  processPayment(body, signature) {
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
              if (merchantBillingType !== 'payAsYouGo') {
                if (merchantBillingType === 'monthly') {
                  expiration = moment(new Date()).add(1, 'months').toDate();
                } else if (merchantBillingType === 'yearly') {
                  expiration = moment(new Date()).add(1, 'years').toDate();
                } else {
                  expiration = null;
                }
              }

              merchant.merchantInfo.billing.history.unshift({
                plan: isFirstTime ? 'monthly' : merchantBillingType,
                reference: reference,
                expiration: expiration
              });

              // This is an new addition
              if (merchant.status !== 'completed') {
                merchant.isActive = true;
                merchant.status = 'completed';
                merchant.completedDate = new Date();
              }

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
  },

  verifyTransaction: function () {

  },
};
