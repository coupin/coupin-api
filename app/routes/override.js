// Middleware
const auth = require('./../middleware/auth');
const booking = require('./../models/bookings');

// ontrollers
const MerchantCtrl = require('./../controllers/merchant');

module.exports = function(router) {
  router.route('/override/merchant')
    .post(MerchantCtrl.adminCreate);

  router.route('/override/code/delete').post(function(req, res) {
    booking.remove({}, function(err) {
      if (err) {
        console.log(err);
      }

      res.status(200).send("Done!");
    });
  });
};