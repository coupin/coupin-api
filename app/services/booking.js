var _ = require('lodash');
var moment = require('moment');
var shortCode = require('shortid32');

var Raven = require('./../../config/config').Raven;
var Booking = require('./../models/bookings');
var Reward = require('./../models/reward');
var User = require('./../models/users');

module.exports = {
  handleCoupinPayment: function (bookingId, reference, paymentReference) {
    // get user information
    // get coupin based on id
    // update transaction reference information
    // check if transaction has been successful
    // redeem the coupin

    Booking.findById(bookingId)
      .populate('rewardId.id', 'multiple')
      .exec(function (_err, booking) {
        if (_err) {
          Raven.captureException(_err);
        } else if (!booking) {
          Raven.captureException({ 
            err: '',
            message: 'coupin does not exist.', 
            bookingId: bookingId,
            type: 'redeem_coupin_webhook_service',
          });
        } else {
          var transactionObjectIndex = booking.transactions.findIndex(function (transaction) {
            transaction.reference === reference;
          });

          // update transaction info
          var transactionObject = booking.transactions[transactionObjectIndex];

          if (transactionObject.status === 'pending') {
            transactionObject.paymentReference = paymentReference;
            transactionObject.status = 'success';
            booking.transactions[transactionObjectIndex] = transactionObject;

            booking.status = 'paid';
    
            booking.save(function(err) {
              if (err) {
                Raven.captureException(err);
              } else {
                // TODO: what to do here
              }
            });
          }
        }
      });
  }
}