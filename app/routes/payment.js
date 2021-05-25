// Controller
var PaymentCtrl = require('./../controllers/payment');

// Middleware
var auth = require('./../middleware/auth');

module.exports = function (router) {
  router
    .post('/initiatepayment', PaymentCtrl.initiatePayment);

  router
    .route('/paystackhook').post(PaymentCtrl.paystackPaymentSuccess);

  router
    .post('/flutterwave/hook', PaymentCtrl.flutterwavePaymentSuccess);
};
