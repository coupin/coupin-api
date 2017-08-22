const express = require('express');
const expressValidator = require('express-validator');
const router = express.Router();
const passport = require('./../middleware/passport');

// Middleware
const auth = require('./../middleware/auth');
const booking = require('./../models/bookings');

// ontrollers
const MerchantCtrl = require('./../controllers/merchant');

router.route('/merchant').post(MerchantCtrl.adminCreate);

router.route('/code/delete').post(function(req, res) {
  booking.remove({}, function(err) {
    if (err) {
      console.log(err);
    }

    res.status(200).send("Done!");
  });
});

module.exports = router;