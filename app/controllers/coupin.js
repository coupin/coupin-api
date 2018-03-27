const _ = require('lodash');
const moment = require('moment');
const shortCode = require('shortid32');

const Booking = require('./../models/bookings');
const emailer = require('../../config/email');
const messages = require('../../config/messages');

module.exports = {
  // Use a saved coupin
  activate: function(req, res) {
    console.log('Inside here');
    const id = req.body.id || req.params.id || req.query.id;
      Booking.findById(id, function (err, booking) {
        if (err) {
          res.status(500).send(err);
          throw new Error(err);
        } else if (!booking) {
          res.status(404).send({ message: 'No such booking exists' });
        } else {
          booking.shortCode = shortCode.generate();
          booking.useNow = true;

          booking.save(function(err, booking) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send(booking);
            }
          });
        }
      });
  },
  // Create Coupin
  create: function(req, res) {
    let rewards = [];
    let rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
    let rewardId = rewardString.split(" ");
    rewardId = _.without(rewardId, "");
    rewardId.forEach(function(reward) {
      if (req.user.blacklist.indexOf(reward) === -1) {
        rewards.push({
          id: reward,
          status: 'pending'
        });
      }
    });

    let saved = req.body.saved || req.params.saved || req.query.saved || 'false';
    const useNow = (saved === 'false' || saved === false) ? true : false;
    const code = useNow ? shortCode.generate() : null;

    const booking = new Booking({
        userId: req.user._id,
        merchantId: req.body.merchantId,
        rewardId: rewards,
        shortCode: code,
        useNow: useNow
    });

    booking.save(function (err) {
      if (err) {
        res.status(500).send(err);
        throw new Error(err);
      } else {
        Booking
        .populate(booking, { 
            path: 'rewardId.id'
        }, function (err, booking) {
          if (err) {
            res.status(500).send(err);
            throw new Error(err);
          } else {
            res.status(201).send(booking);
            // emailer.sendEmail(merchant.email, 'Coupin Created', messages.approved(merchant._id), function(response) {
            emailer.sendEmail('abiso_lawal@yahoo.com', 'Coupin Created', messages.coupinCreated(booking), function(response) {
                console.log(response);
            });
          }
        });
      }
    });
  },
  // Read coupins
  read: function(req, res) {
    const active = req.body.active || req.params.active || req.query.active || true;
    const page = req.body.page || req.params.page || req.query.page || 0;
    let saved = req.body.saved || req.params.saved || req.query.saved || 'false';
    const useNow = (saved === 'false' || saved === false) ? true : false;

    let query = {
      isActive: active,
      useNow: useNow
    };
    
    if (req.user.role === 3) {
      query['userId'] = req.user._id;
    }

    if (req.user.role === 2) {
      query['merchantId'] = req.user._id;
    }

    Booking.find(query)
      .populate('rewardId.id')
      .populate('userId', 'name email mobileNumber')
      .populate('merchantId', 'merchantInfo _id')
      .limit(10)
      .skip(page * 10)
      .exec(function(err, bookings) {
        if (err) {
          res.status(500).send(err);
          throw new Error(err);
        } else if (bookings.length === 0) {
            res.status(404).send({message: 'No active bookings.'});
        } else {
            res.status(200).send(bookings);
        }
      });
  },
  // Redeem a reward
  redeem: function(req, res) {
    const id = req.body.id || req.params.id || req.query.id;
    const rewards = req.body.rewards;

    Booking.findById(id, function (err, booking) {
      if (err) {
        res.status(500).send(err);
        throw new Error(err);
      } else if (!booking) {
        res.status(404).send({ message: 'Coupin deos not exist.' });
      } else {
        rewards.forEach((element) => {
          const position = booking.rewardId.indexOf(element);
        });

        if (booking.used.length === booking.rewardId.length) {
          booking.isActive = false;
        }

        booking.save(function(err) {
          if (err) {
            res.status(500).send(err);
            throw new Error(err);
          } else {
            res.status(200).send(booking);
          }
        });
      }
    });
  },
  // Verify Short Code and return booking details for merchant
  verify: function(req, res) {
    const pin = req.params.pin;

    Booking.findOne({
      shortCode: pin,
      merchantId: req.user.id,
      useNow: true,
      isActive: true
    })
    .populate('rewardId.id', 'applicableDays description endDate isActive name multiple picture')
    .populate('userId', 'name email mobileNumber')
    .exec((err, booking) => {
      if (err) {
        res.status(500).send(error);
        throw new Error(err);
      } else if (!booking) {
        res.status(404).send({ error: 'Coupin does not exist.'});
      } else {
        var change = false;

        booking.rewardId.forEach(function(object) {
          if(moment(object.id.endDate).isBefore(new Date()) && object.status === 'pending') {
            change = true;
            object.status = 'expired'
            console.log('Testing');
          }
        });

        res.status(200).send(booking);
        if (change) {
          booking.save();
        }
      }
    });
  }
};