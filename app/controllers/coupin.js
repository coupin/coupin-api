const shortCode = require('shortid32');

const Booking = require('./../models/bookings');

module.exports = {
  // Use a saved coupin
  activate: function(req, res) {
    const id = req.body.id || req.params.id || req.query.id;
      Booking.findById(id, function (err, booking) {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else if (!booking) {
          res.status(404).send({ message: 'No such booking exists' });
        } else {
          booking.shortCode = shortCode.generate();
          booking.useNow = true;

          booking.save(function(err, booking) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(booking);
            }
          });
        }
      });
  },
  // Create Coupin
  create: function(req, res) {
    let rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
    let rewardId = rewardString.split(" ");
    rewardId = _.without(rewardId, "");
    const useNow = req.body.useNow || true;
    const code = useNow ? shortCode.generate() : null;

    Booking.findOne({rewardId: rewardId}, function (err, booking) {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } if (booking) {
        res.status(409).send({ message: 'Coupin already exists.' });
      } else {
        const booking = new Booking({
            userId: req.user._id,
            merchantId: req.body.merchantId,
            rewardId: rewardId,
            shortCode: code,
            useNow: useNow
        });

        booking.save(function (err) {
          if (err) {
            console.log(err);
            res.status(500).send(err);
          } else {
            Booking
            .populate(booking, { 
                path: 'rewardId'
            }, function (err, booking) {
              if (err) {
                console.log(err);
                res.status(500).send(err);
              } else {
                res.status(201).send(booking);
              }
            });
          }
        });
      }
    });
  },
  // Read coupins
  read: function(req, res) {
    const active = req.body.active || req.params.active || req.query.active || true;
    const page = req.body.page || req.params.page || req.query.page || 1;
    const saved = req.body.saved || req.params.saved || req.query.saved || false;
    let query = {
      isActive: active,
      useNow: saved
    };
    
    if (req.user.role === 3) {
      query['userId'] = req.user._id;
    }

    if (req.user.role === 2) {
      query['merchantId'] = req.user._id;
    }

    Booking.find(query)
      .populate('rewardId')
      .populate('userId', 'name email mobileNumber')
      .populate('merchantId', 'merchantInfo _id')
      .limit(10)
      .skip(page * 10)
      .exec(function(err, bookings) {
        if (err) {
          console.log(err);
          res.status(500).send(err);
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
    console.log(rewards);

    Booking.findById(id, function (err, booking) {
      console.log(booking);
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else if (!booking) {
        res.status(404).send({ message: 'Coupin deos not exist.' });
      } else {
        rewards.forEach((element) => {
          const position = booking.rewardId.indexOf(element);
          booking.used.push(position);
        });

        if (booking.used.length === booking.rewardId.length) {
          booking.isActive = false;
        }

        booking.save(function(err) {
          console.log(err);
          if (err) {
            res.status(500).send(err);
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
    .populate('rewardId', 'applicableDays description endDate isActive name multiple picture')
    .populate('userId', 'name email mobileNumber')
    .exec((err, booking) => {
      if (err) {
        res.status(500).send(error);
      } else if (!booking) {
        res.status(404).send({ error: 'Coupin does not exist.'});
      } else {
        res.status(200).send(booking);
      }
    });
  }
};