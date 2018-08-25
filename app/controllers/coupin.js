'use strict';
var _ = require('lodash');
var moment = require('moment');
var shortCode = require('shortid32');

var Booking = require('./../models/bookings');
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
    var id = req.body.id || req.params.id || req.query.id;
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
  
  /**
   * @api {post} /coupin Generate coupin
   * @apiName create
   * @apiGroup Coupin
   * 
   * @apiHeader {String} x-access-token Users unique token
   * 
   * @apiParam {String} saved should be either ('true') or ('false'). If ('true') it generates the code immediately, if false it saves it for later.
   * @apiParam {String} id id of saved rewards booking
   * @apiParam {String} id id of saved rewards booking
   * @apiParam {String} id id of saved rewards booking
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
    var rewards = [];
    var rewardString = req.body.rewardId.replace(/[^a-z0-9]+/g," ");
    var rewardId = rewardString.split(" ");
    rewardId = _.without(rewardId, "");
    rewardId.forEach(function(reward) {
      // if (req.user.blacklist.indexOf(reward) === -1) {
        rewards.push({
          id: reward,
          status: 'pending'
        });
      // }
    });

    var saved = req.body.saved || req.params.saved || req.query.saved || 'false';
    var useNow = (saved === 'false' || saved === false) ? true : false;
    var code = useNow ? shortCode.generate() : null;

    var booking = new Booking({
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
            res.status(200).send(booking);
            // emailer.sendEmail(merchant.email, 'Coupin Created', messages.approved(merchant._id), function(response) {
            emailer.sendEmail('abiso_lawal@yahoo.com', 'Coupin Created', messages.coupinCreated(booking), function(response) {
                console.log(response);
            });
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

    var query = {
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
      .limit(7)
      .skip(page * 10)
      .sort({
        createdAt: 'desc'
      })
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
    var id = req.body.id || req.params.id || req.query.id;
    var rewards = req.body.rewards;

    Booking.findById(id, function (err, booking) {
      if (err) {
        res.status(500).send(err);
        throw new Error(err);
      } else if (!booking) {
        res.status(404).send({ message: 'Coupin deos not exist.' });
      } else {
        rewards.forEach(function(index) {
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
    var pin = req.params.pin;

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
        throw new Error(err);
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