var moment = require('moment');
var axios = require('axios');

var Raven = require('./../../config/config').Raven;

// Models
var Reward = require('./../models/reward')
var Merchant = require('./../models/users');

module.exports = {
  verifyTransaction: function (id) {
    var options = {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    };

    return axios.get(`${process.env.FLUTTERWAVE_URL}/transactions/${id}/verify`, options)
      .then(({ data: responseBody }) => {
        var { status, data } = responseBody;

        if (status === 'success' && data.status === 'successful') {
          return {
            status: 'success',
            id: data.id,
            tx_ref: data.tx_ref,
            flw_ref: data.flw_ref,
            customer: data.customer,
            meta: data.meta,
          }
        }

        return {
          status: 'error',
          id,
        };
      })
      .catch((error) => {
        console.error(`problem with request: ${error.message}`);
        Raven.captureException(error);

        return {
          status: 'error',
          message: error.message,
          id,
        };
      })
  },

  initiateTransaction: function ({
    type,
    billingPlan,
    userId,
    companyName,
    reward,
    email,
    amount,
    callbackUrl
  }) {
    /**
     * Flutterwave object
     * 
     * {
     *    "tx_ref":"hooli-tx-1920bbtytty", // transaction reference most likely coupin code
     *    "amount":"100" // in kobo,
     *    "currency":"NGN", // currency
     *    "redirect_url":"https://webhook.site/9d0b00ba-9a69-44fa-a43d-a82c33c36fdc",
     *    "payment_options":"card",
     *    "meta":{
     *        "consumer_id":23,
     *        "consumer_mac":"92a3-912ba-1192a"
     *    },
     *    "customer":{
     *        "email":"user@gmail.com",
     *        "phonenumber":"080****4528",
     *        "name":"Yemi Desola"
     *    },
     *    "customizations":{
     *        "title":"Pied Piper Payments", // payment window title
     *        "description":"Middleout isn't free. Pay the price", // payment window description
     *        "logo":"https://assets.piedpiper.com/logo.png" // logo??
     *    }
     * }
     */

    /**
     * Flutterwave response with payment link & ID
     * 
     * {
     *   "status":"success",
     *   "message":"Hosted Link",
     *   "data":{
     *       "link":"https://api.flutterwave.com/v3/hosted/pay/f524c1196ffda5556341"
     *   }
     * }
     */
    
    var meta = {};
    var referencePrefix = type === 'reward' ? `reward-${reward.id}-${userId}-${companyName.split(' ')[0]}` : `billing-${billingPlan}-${userId}`;

    var date = new Date();
    var reference = `${referencePrefix}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getTime()}`;

    var customizationDescription = type === 'reward' ? 'Payment for reward' : 'Payment for subscription';

    if (type === 'reward') {
      meta.rewardName = reward.name;
      meta.rewardId = reward.id;
    } else if (type === 'billing') {
      meta.plan = `${companyName} - ${billingPlan}-${date.getTime()}`;
      meta.billingPlan = billingPlan;
    }

    var payload = {
      tx_ref: reference,
      amount,
      currency: 'NGN',
      redirect_url: callbackUrl,
      meta: {
        paymentType: type,
        merchantId: userId,
        reference,
        ...meta,
      },
      customer: {
        email,
      },
      customizations: {
        title: "Coupin Payments",
        description: customizationDescription,
        logo: "https://res.cloudinary.com/appleap-limited/image/upload/v1619954281/coupin/logo_2x-fs8_lu5bxk.png"
      }
    };

    var options = {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      }
    };

    return axios.post(`${process.env.FLUTTERWAVE_URL}/payments`, payload, options)
      .then(({ data }) => {
        if (data && data.status === 'success') {
          // successfully created authorization url
          // send the user the authorizationUrl
          return {
            success: true,
            ...data.data,
            authorization_url: data.data.link
          };
        } else {
          // Could not create authorization url
          return {
            success: false,
            message: data.message,
          };
        }
      })
      .catch((error) => {
        console.error(`problem with request: ${error.message}`);
        Raven.captureException(error);
        return {
          message: 'There was a problem initiating payment, please try again later',
        };
      });
  },

/**
 * 
 * @param {Object} body - response body
 * @param {String} hash - hash sent from flutterwave
 */
  processPayment: function (body, hash) {
    var flutterwaveHash = process.env.FLUTTERWAVE_SECRET_HASH;
    // var event = body.event;
    // var eventType = body['event.type'];
    var status = (body.data.status || '').toLowerCase();

    if (hash && hash === flutterwaveHash) {
      if (status === 'successful') {
        var data = body.data;

        var userEmail = data.customer.email;
        // note that transaction reference could either be payment reference or the 
        // shortCode & the id of the coupin
        // e.g transaction reference for coupin => {coupinId}-{coupinShortCode}
        var transactionReference = data.tx_ref; 
        var flutterwaveReference = data.flw_ref;
        var id = data.id;

        /**
         * meta should have the following structure
         * 
         * {
         *   "paymentType": "reward | billing | coupin", // reward and billing are for merchants
         *   "merchantId": "xxxxxx", // merchant id here, should be here if paymentType is reward or billing
         *   "customerId": "xxxxxx", // customer id here, should be here is paymentTtpe is coupin
         *   "rewardId": "xxxxxx", // if paymentType is reward, this will be removed in future
         *   "billingPlan": "xxxxxx", // if paymentType is billing
         *   "coupinId": "xxxxxx", // if paymentType is coupin
         *   "coupinShortCode": "xxxxxx", // if paymentType is coupin
         * }
         */

        //coupin payment details
        

        if (paymentType === 'reward' || paymentType === 'billing') {
          processMerchantPayment(data);
        }

        if (paymentType === 'coupin') {
          processCustomerCoupinPayment(data);
        }
      }
    }
  },
};

// function processMerchantPayment(data) {
//   var paymentType = data.meta.paymentType || '';
//   var merchantId = data.meta.merchantId || '';
//   var rewardId = data.meta.rewardId || '';
//   var billingPlan = data.meta.billingPlan || '';
//   var reference = data.tx_ref;

//   var isFirstTime = false;

//   // Get the billing type so the merchant info can be updated
//   if (paymentType === 'reward') {
//     merchantBillingType = 'payAsYouGo';
//   } else if (paymentType === 'billing') {
//     merchantBillingType = billingPlan;
//   }

//   var merchantPromise = Merchant.findById(merchantId).exec()
//     .then(function (merchant) {
//       merchant.merchantInfo.billing.plan = merchantBillingType;

//       if (!merchant.merchantInfo.billing.history) {
//         merchant.merchantInfo.billing.history = [];
//         isFirstTime = true;
//       }

//       var expiration = null;

//       if (merchantBillingType !== 'payAsYouGo') {
//         if (merchantBillingType === 'monthly') {
//           expiration = moment(new Date()).add(1, 'months').toDate();
//         } else if (merchantBillingType === 'yearly') {
//           expiration = moment(new Date()).add(1, 'years').toDate();
//         } else {
//           expiration = null;
//         }
//       }

//       merchant.merchantInfo.billing.history.unshift({
//         plan: isFirstTime ? 'monthly' : merchantBillingType,
//         reference: reference,
//         expiration: expiration
//       });

//       // This is an new addition
//       if (merchant.status !== 'completed') {
//         merchant.isActive = true;
//         merchant.status = 'completed';
//         merchant.completedDate = new Date();
//       }

//       return merchant.save();
//     }, function (err) {
//       // Handle error while trying to retieve merchant
//       Raven.captureException({
//         error: err, 
//         message: 'Error retrieveing the merchant information during payment processing', 
//         merchantId: merchantId,
//         type: 'Merchant billing update',
//       });
//     });

//   if (paymentType === 'reward') {
//     merchantPromise.then(function (merchant) {
//         if (merchant) {
//           // if type is reward then initiate the reward update
//           return Reward.findById(rewardId).exec();
//         }
//     }, function (err) {
//       // Handle error while trying to save merchant billing and history
//       Raven.captureException({ 
//         err: err,
//         message: 'Error updating Merchant billing history and history', 
//         merchantId: merchantId,
//         type: 'Merchant billing update',
//       });
//     }).then(function (reward) {
//       // do stuff to reward
//       if (!reward) {
//         Raven.captureException({ 
//           err: '',
//           message: 'Reward does not exist.', 
//           rewardId: rewardId,
//           type: 'Reward Payment update',
//         });
//       } else {
//         reward.status = 'isPending';
//         reward.isActive = true;
//         reward.modifiedDate = Date.now();
//         return reward.save();
//       }
//     }, function (err) {
//       // Handle error while to retrieve
//       Raven.captureException({ 
//         err: err,
//         message: 'Error retrieving reward information', 
//         rewardId: rewardId,
//         type: 'Reward Payment update',
//       });
//     }).then(function () {},
//       function (err) {
//         Raven.captureException({ 
//           err: err,
//           message: 'Error updating Reward details', 
//           rewardId: rewardId,
//           type: 'Reward status update',
//         });
//       })
//   }
// }
