// Controller
var PaymentCtrl = require('./../controllers/payment');

// Middleware
var auth = require('./../middleware/auth');

module.exports = function (router) {
  router
    .post('/initiatepayment', auth.authenticate, auth.isMerchant, PaymentCtrl.initiatePayment);

  router
    .route('/paystackhook').post(PaymentCtrl.paymentSuccess)
};
