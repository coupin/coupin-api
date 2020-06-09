'use strict';
var _ = require('lodash');
var moment = require('moment');
var shortCode = require('shortid32');
var mongoose = require('mongoose');

var Raven = require('./../../config/config').Raven;
var Booking = require('./../models/bookings');
var Reward = require('./../models/reward');
var User = require('./../models/users');
var emailer = require('../../config/email');
var messages = require('../../config/messages');

module.exports = {
  /**
   * @api {put} /coupin/:id/activate Generate coupin for saved rewards
   * @apiName activate
   * @apiGroup Coupin
   * @apiExample {curl} Example usage:
   *  curl -i http://localhost:5030/api/v1/coupin/2
   * 
   * @apiHeader {String} x-access-token Users unique token
   * 
   * @apiParam {String} id id of saved rewards booking
   * 
   * @apiSuccess {String} userId The customer's id 
   * @apiSuccess {String} merchantId The merchant's id 
   * @apiSuccess {Object[]} rewardId Array containing objects with properties id (reward id) {String}, status {String}, usedOn {Date}
   * @apiSuccess {String} shortCode The generated coupin
   * @apiSuccess {Boolean} useNow To determine whether it is in use
   * @apiSuccess {Boolean} isActive To determine if it has expired
   * 
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *      "userId": "5b7ab4ce24688b0adcb9f54b",
   *      "merchantId": "4b7ab4ce24688b0adcb9f54v",
   *      "rewardId": [{
   *        "id": "2b7ab4ce24688b0adcb9f44v",
   *        "status": "pending"
   *        "usedOn": "2018-08-20T13:24:14Z"
   *      }],
   *      "shortCode": "GH43C78T",
   *      "useNow": "true",
   *      "isActive": "true"
   *  }
   * 
   * @apiError Unauthorized Invalid token.
   * 
   * @apiErrorExample Unauthorized:
   *  HTTP/1.1 401 Unauthorized
   *  {
   *      "message": "Unauthorized."
   *  }
   * 
   * @apiError BookingNotFound no such booking exists..
   * 
   * @apiErrorExample UserNotFound:
   *  HTTP/1.1 404 UserNotFound
   *  {
   *      "message": "No such booking exists."
   *  }
   * 
   * @apiError (Error 5xx) ServerError an error occured on the server.
   * 
   * @apiErrorExample ServerError:
   *  HTTP/1.1 500 ServerError
   *  {
   *      "message": "Server Error."
   *  }
   */
  activate: function(req, res) {
    var blacklist = req.user.blacklist;
    var id = req.body.id || req.params.id || req.query.id;

    Booking.findById(id, function (err, booking) {
      if (err) {
        res.status(500).send(err);
        Raven.captureException(err);
      } else if (!booking) {
        res.status(404).send({ message: 'No such booking exists' });
      } else {
        booking.rewardId.forEach(function(reward) {
          if (blacklist.indexOf(reward.id) > -1) {
            reward.status = 'used';
          }
        });
        booking.shortCode = shortCode.generate();
        booking.useNow = true;

        booking.save(function(err, booking) {
          if (err) {
              res.status(500).send(err);
              Raven.captureException(err);
          } else {
              res.status(200).send(booking);
          }
        });
      }
    });
  },
  
  /**
   * @api {post} /coupin Generate coupin
   * @apiName create
   * @apiGroup Coupin
   * 
   * @apiHeader {String} x-access-token Users unique token
   * 
   * @apiParam {String} saved should be either ('true') or ('false'). If ('true') it generates the code immediately, if false it saves it for later.
   * @apiParam {String[]} rewardId ids of selected rewards booking
   * 
   * @apiSuccess {String} userId The customer's id 
   * @apiSuccess {String} merchantId The merchant's id 
   * @apiSuccess {String[]} rewardId Array containing the reward ids
   * 
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *      "userId": "5b7ab4ce24688b0adcb9f54b",
   *      "merchantId": "4b7ab4ce24688b0adcb9f54v",
   *      "rewardId": [{
   *        "id": "2b7ab4ce24688b0adcb9f44v",
   *        "status": "pending"
   *        "usedOn": "2018-08-20T13:24:14Z"
   *      }],
   *      "shortCode": "GH43C78T",
   *      "useNow": "true",
   *      "isActive": "true"
   *  }
   * 
   * @apiError Unauthorized Invalid token.
   * 
   * @apiErrorExample Unauthorized:
   *  HTTP/1.1 401 Unauthorized
   *  {
   *      "message": "Unauthorized."
   *  }
   * 
   * @apiError (Error 5xx) ServerError an error occured on the server.
   * 
   * @apiErrorExample ServerError:
   *  HTTP/1.1 500 ServerError
   *  {
   *      "message": "Server Error."
   *  }
   */
  create: function(req, res) {
    var blacklist, rewardId;
    var save = false;
    var rewards = [];
    if (Array.isArray(req.body.rewardId)) {
      rewardId = req.body.rewardId;
    } else {
      var rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
      rewardId = rewardString.split(" ");
      rewardId = _.without(rewardId, "");
    }

    if (Array.isArray(req.body.blacklist)) {
      blacklist = req.body.blacklist;
    } else if (!req.body.blacklist) {
      blacklist = [];
    } else {
      var blacklistString = req.body.blacklist.replace(/[^a-z0-9]+/g," ");
      blacklist = blacklistString.split(" ");
      blacklist = _.without(blacklist, "");
    }

    save = blacklist.length > 0;
    
    rewardId.forEach(function(reward) {
        rewards.push({
          id: reward,
          singleUse: blacklist.indexOf(reward) > -1,
          status: 'pending'
        });
    });

    var saved = req.body.saved || req.params.saved || req.query.saved || 'false';
    var useNow = (saved === 'false' || saved === false) ? true : false;
    var code = useNow ? shortCode.generate() : null;
    var expires = new Date(req.body.expiryDate);

    var booking = new Booking({
        userId: req.user._id,
        merchantId: req.body.merchantId,
        rewardId: rewards,
        shortCode: code,
        useNow: useNow,
        expiryDate: expires
    });

    booking.save(function (err) {
      if (err) {
        res.status(500).send(err);
        Raven.captureException(err);
      } else {
        Reward
        .populate(booking, { 
            path: 'rewardId.id'
        }, function (err, booking) {
          if (err) {
            res.status(500).send(err);
            Raven.captureException(err);
          } else {
            res.status(200).send(booking);
            if (save) {
              req.user.blacklist = blacklist;
              req.user.save();
            }
            User.findById(req.body.merchantId)
            .select('merchantInfo.companyName email')
            .exec(function(err, merchant) {
              if (useNow) {
                emailer.sendEmail(
                  req.user.email,
                  'Coupin Created for ' + merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() }), 
                  messages.coupinCreated(booking, req.user.name.replace(/\b(\w)/g, function (p) { return p.toUpperCase() })), 
                  function(response) {
                    console.log(response);
                  }
                );

                // get rewards for email sent to merchant
                Reward.find({ 
                  _id: {
                    $in: rewards.map(function (reward) { return mongoose.Types.ObjectId(reward.id)})
                  }
                 }, 'name', function (err, _rewards) {
                    var rewardNameString = rewards.reduce(function (agg, reward, index, arr) {
                      agg += reward.name;
                      if (index < arr.length - 1) {
                        agg += (agg + ', ');
                      }

                      return agg;
                    }, '');

                    emailer.sendEmail(
                      merchant.email,
                      "Customer Code Generated: " + rewardNameString,
                      messages.coupinCreatedForMerchant(
                        merchant.merchantInfo.companyName.replace(/\b(\w)/g, function (p) { return p.toUpperCase() }),
                        _rewards
                      ),
                      function(response) {
                        console.log(response);
                      }
                    )
                 });
              }
            })
          }
        });
      }
    });
  },
  
  /**
   * @api {get} /coupin Get saved or generated coupins
   * @apiName read
   * @apiGroup Coupin
   * 
   * @apiHeader {String} x-access-token Users unique token
   * 
   * @apiParam {Number} page for pagination
   * @apiParam {String} saved should be ('true') or ('false') as written. To get back rewards being used or those that were saved.
   * @apiParam {String} userId id of the customer
   * 
   * @apiSuccess {String} userId The customer's id 
   * @apiSuccess {String} merchantId The merchant's id 
   * @apiSuccess {Object[]} rewardId Array containing objects with properties id (reward id) {String}, status {String}, usedOn {Date}
   * @apiSuccess {String} shortCode The generated coupin
   * @apiSuccess {Boolean} useNow To determine whether it is in use
   * @apiSuccess {Boolean} isActive To determine if it has expired
   * @apiSuccess {Boolean} favourite To determine if it is a favourite
   * @apiSuccess {Boolean} visited To determine if the place has been visited by the user
   * @apiSuccess {Boolean} favourite To determine if it is a favourite
   * 
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *      "userId": "5b7ab4ce24688b0adcb9f54b",
   *      "merchantId": "{
   *        _id: "5b7ab4ce24688b0adcb9fhge",
   *        merchantInfo: {
   *          Merchant Info
   *        }
   *      }",
   *      "rewardId": [{
   *        "id": "2b7ab4ce24688b0adcb9f44v",
   *        "status": "pending"
   *        "usedOn": "2018-08-20T13:24:14Z"
   *      }],
   *      "shortCode": "GH43C78T",
   *      "useNow": "true",
   *      "isActive": "true",
   *      "visited": true,
   *      "favourite": false
   *  }
   * 
   * @apiError Unauthorized Invalid token.
   * 
   * @apiErrorExample Unauthorized:
   *  HTTP/1.1 401 Unauthorized
   *  {
   *      "message": "Unauthorized."
   *  }
   * 
   * @apiError BookingNotFound no such booking exists..
   * 
   * @apiErrorExample UserNotFound:
   *  HTTP/1.1 404 UserNotFound
   *  {
   *      "message": "No active bookings."
   *  }
   * 
   * @apiError (Error 5xx) ServerError an error occured on the server.
   * 
   * @apiErrorExample ServerError:
   *  HTTP/1.1 500 ServerError
   *  {
   *      "message": "Server Error."
   *  }
   */
  read: function(req, res) {
    var active = req.body.active || req.params.active || req.query.active || true;
    var page = req.body.page || req.params.page || req.query.page || 0;
    var saved = req.body.saved || req.params.saved || req.query.saved || 'false';
    var useNow = (saved === 'false' || saved === false) ? true : false;

    var currentUser = req.user;

    var query = {
      isActive: active,
      useNow: useNow
    };
    
    if (req.user.role === 3) {
      query['userId'] = req.user._id;
      query['expiryDate'] = {
        $gte: new Date()
      }
    }

    if (req.user.role === 2) {
      query['merchantId'] = req.user._id;
    }

    Booking.find(query)
    .populate('userId', 'name email mobileNumber')
    .populate('merchantId', 'merchantInfo _id')
    .populate('rewardId.id')
      .limit(7)
      .skip(page * 10)
      .sort({
        createdAt: 'desc'
      })
      .exec(function(err, bookings) {
        if (err) {
          res.status(500).send(err);
          Raven.captureException(err);
        } else if (bookings.length === 0) {
            res.status(404).send({message: 'No active bookings.'});
        } else {
          var info = bookings.map(function(booking) {
            return {
              _id: booking._id,
              userId: booking.userId,
              merchantId: booking.merchantId,
              rewardId: booking.rewardId,
              shortCode: booking.shortCode,
              useNow: booking.useNow,
              expiryDate: booking.expiryDate,
              isActive: booking.isActive,
              favourite: currentUser.favourites.indexOf(booking.merchantId._id) > -1,
              visited: currentUser.visited.indexOf(booking.merchantId._id) > -1,
              createdAt: booking.createdAt
            };
          });

          res.status(200).send(info);
        }
      });
  },
  // Redeem a reward
  redeem: function(req, res) {
    var blacklist = req.user.blacklist || [];
    var id = req.body.id || req.params.id || req.query.id;
    var rewards = req.body.rewards;

    Booking.findById(id)
    .populate('rewardId.id', 'multiple')
    .exec(function (err, booking) {
      if (err) {
        res.status(500).send(err);
        Raven.captureException(err);
      } else if (!booking) {
        res.status(404).send({ message: 'Coupin deos not exist.' });
      } else {
        rewards.forEach(function(index) {
          if (booking.rewardId[index].id.multiple.status) {
            blacklist.push(booking.rewardId[index].id);
          }
          booking.rewardId[index].status = 'used';
          booking.rewardId[index].usedOn = new Date();
        });

        var acitveReward = _.find(booking.rewardId, function(object) {
          return object.status === 'pending';
        });

        if (!acitveReward) {
          booking.isActive = false;
        }

        booking.save(function(err) {
          if (err) {
            res.status(500).send(err);
            Raven.captureException(err);
          } else {
            res.status(200).send(booking);

            User.findById(booking.userId, function(err, user) {
              if (err) {
                Raven.captureException(err);
              } else {
                if (!user.visited) {
                  user['visited'] = [];
                }

                if(blacklist.length > 0) {
                  if (!Array.isArray(user.blacklist)) {
                    user.blacklist = [];
                  }

                  user.blacklist = _.union(user.blacklist, blacklist);
                }

                user.visited = _.union(user.visited, [booking.merchantId]);
                user.save();
              }
            });
          }
        });
      }
    });
  },
  // Verify Short Code and return booking details for merchant
  verify: function(req, res) {
    var pin = req.params.pin.toUpperCase();

    Booking.findOne({
      shortCode: pin,
      merchantId: req.user.id,
      useNow: true,
      isActive: true
    })
    .populate('rewardId.id', 'applicableDays description endDate isActive name multiple picture')
    .populate('userId', 'name email mobileNumber')
    .exec(function(err, booking) {
      if (err) {
        res.status(500).send(error);
        Raven.captureException(err);
      } else if (!booking) {
        res.status(404).send({ error: 'Coupin does not exist.'});
      } else {
        var change = false;

        booking.rewardId.forEach(function(object) {
          if(moment(object.id.endDate).isBefore(new Date()) && object.status === 'pending') {
            change = true;
            object.status = 'expired'
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