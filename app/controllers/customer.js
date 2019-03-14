var Customer = require('../models/users');
var Reward = require('../models/reward');

// Coupin App Messages
var config = require('../../config/config');
var emailer = require('../../config/email');
var messages = require('../../config/messages');

var Raven = config.Raven;

function getVisited(id) {
    return new Promise(function(res, rej) {
        Customer.findById(id).select('favourites visited').exec(function(err, user) {
            res(user);
        });
    });
}

module.exports = {
    /**
     * @api {post} /customer/favourites Add a merchant to favourites
     * @apiName addToFavourites
     * @apiGroup Customer
     * 
     * @apiExample {curl} Example usage:
     * curl -i http://localhost:5030/api/v1/customer/45
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} merchantId id of the merchant
     * 
     * @apiSuccess {String} message 'Added Successfully' 
     * @apiSuccess {Object} user an object holding the user's information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "message": "Added Successfully",
     *      "user": {
     *          "_id": "5b7ab4ce24688b0adcb9f54b",
     *          "email": "test@email.com"
     *          "name": "Test User",
     *          "isActive": true,
     *          "dateOfBirth": "2018-08-22",
     *          "ageRange": "15 - 25",
     *          "sex": "male",
     *          "blacklist": [],
     *          "favourites": [],
     *          "interests": [],
     *          "city": "lagos",
     *          "picture": {
     *              "url": null
     *          },
     *          "notification": {
     *              "token": null
     *              "days": "weekdays"
     *          }
     *       }
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
    addToFavourites : function (req, res) {
        var body = req.body;
        var user = req.user;

        if (!user.favourites) {
            user.favourites = [];
        }

        req.user.favourites.push(body.merchantId);
        req.user.save(function(err) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                var data = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    dateOfBirth: user.dateOfBirth,
                    ageRange: user.ageRange,
                    sex: user.sex,
                    isActive: user.isActive,
                    blacklist: user.blacklist || [],
                    favourites: user.favourites,
                    interests: user.interests,
                    city: user.city,
                    picture: user.picture,
                    notification: user.notification
                };

                res.status(200).send({ 
                    message: 'Added Successfully',
                    user: data
                });
            }
        });
    },
    
    /**
     * @api {post} /customer/category Add a customer's interests
     * @apiName createInterests
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String[]} interests An array containing the users interests
     * 
     * @apiSuccess {User} data Updated user information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "data": 
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
    createInterests : function (req, res) {
        req.user.interests = JSON.parse(req.body.interests);

        req.user.save(function (err) {
        if (err) {
            res.status(500).send(err);
            Raven.captureException(err);
        } else {
            var user = req.user;
            var data = {
                _id: user._id,
                email: user.email,
                name: user.name,
                dateOfBirth: user.dateOfBirth,
                ageRange: user.ageRange,
                sex: user.sex,
                isActive: user.isActive,
                blacklist: user.blacklist || [],
                favourites: user.favourites,
                interests: user.interests,
                city: user.city,
                picture: {
                    url: user.picture
                },
                notification: user.notification
            };
            res.status(200).send(data);
        }
        });
    },

    /**
     * @api {post} /customer/feedback Send admin customers feedback
     * @apiName feedback
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} coupinCode Optional String
     * @apiParam {String} merchantName Optional String
     * @apiParam {String} message Required. Message to us
     * 
     * @apiSuccess {String} message A message saying the email has been queued.
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "message": "Queued. Thank You."
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
    requestSupport: function (req, res) {
        var data = {
            coupinCode: req.body.coupinCode || 'N/A',
            customer: {
                email: req.user.email,
                name: req.user.name
            },
            merchantName: req.body.merchantName || 'N/A',
            message: req.body.message
        };

        emailer.sendEmail(process.env.ADMINEMAIL, 'FeedBack/Suggestions ', messages.feedback(data), function(response) {
            if (response.success) {
                res.status(200).send(response.message.message);
            } else {
                Raven.captureException(response.message.message);
                res.status(500).send(response.message.message);
            }
        });
    },

    /**
     * @api {put} /customer/:id Remove a merchant from favourites
     * @apiName removeFavourites
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} merchantId id of the merchant
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The full name of the user
     * @apiSuccess {Date} dateOfBirth The user's date of birth
     * @apiSuccess {String} ageRange The user's ageRange
     * @apiSuccess {String} sex The user's gender
     * @apiSuccess {Boolean} isActive Tells you if a user is active or not
     * @apiSuccess {String[]} blacklist String array of blacklisted rewards
     * @apiSuccess {String[]} favourites String array of favourites
     * @apiSuccess {String[]} interests String array of interests
     * @apiSuccess {String} city The city of the user
     * @apiSuccess {Object} picture An object containing url {String} url of image
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "_id": "5b7ab4ce24688b0adcb9f54b",
     *     "email": "test@email.com"
     *     "name": "Test User",
     *     "dateOfBirth": "2018-08-22",
     *     "ageRange": "15 - 25",
     *     "sex": "male",
     *     "isActive": true,
     *     "blacklist": [],
     *     "favourites": [],
     *     "interests": [],
     *     "city": "lagos",
     *     "picture": {
     *         "url": null
     *     },
     *     "notification": {
     *         "token": "k3kkjh34",
     *         "days": "weekdays"
     *     }
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
     * @apiError FavouriteNotFound Invalid token.
     * 
     * @apiErrorExample FavouriteNotFound:
     *  HTTP/1.1 404 FavouriteNotFound
     *  {
     *      "message": "Favourite does not exist.."
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
    removeFavourites : function (req, res) {
        var index = req.user.favourites.indexOf(req.body.merchantId);
        var user = req.user;
        
        if (index === -1) {
        res.status(404).send({ message: 'Favourite does not exist.' });
        } else {
        req.user.favourites.splice(index, 1);
        req.user.save(function (err) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                var data = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    dateOfBirth: user.dateOfBirth,
                    ageRange: user.ageRange,
                    sex: user.sex,
                    isActive: user.isActive,
                    blacklist: user.blacklist || [],
                    favourites: user.favourites,
                    interests: user.interests,
                    city: user.city,
                    picture: {
                        url: user.picture
                    },
                    notification: user.notification
                };

                res.status(200).send(data);
            }
        });
        }
    },
    
    /**
     * @api {get} /customer/favourites Retrieve user's favourite merchants
     * @apiName retrieveFavourites
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} merchantId id of the merchant
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The company's name
     * @apiSuccess {String} mobile The merchant's mobile number
     * @apiSuccess {String} details The merchant's company details
     * @apiSuccess {Object} logo An object containing url {String} url of image
     * @apiSuccess {Object} banner An object containing url {String} url of image
     * @apiSuccess {String} address The company's address
     * @apiSuccess {Object} location The company's geolocation. long {Number} longitude and lat {Number} latitude.
     * @apiSuccess {Object} reward The company's first reward
     * @apiSuccess {String[]} reward Array containing ids of the rewards
     * @apiSuccess {String} category A random category the company falls under
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  [{
     *     "_id": 5b7ab4ce24688b0adcb9f54b,
     *     "name": "The Palms",
     *     "email": "thepalms@email.com",
     *     "mobile": "09045673289",
     *     "details": "A mall full of many surprises.",
     *     "logo": {
     *          "id": "coupin/palms-logo",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-logo.png"
     *     },
     *     "banner": {
     *          "id": "coupin/palms-banner",
     *          "url": "https://www.example.com/folder/4567/coupin/palms-banner.png"
     *     },
     *     "address": "25A Adeola Odeku Street, V.I, Lagos",
     *     "location": {
     *         "long": 3.467894,
     *         "lat": 6.455654
     *     },
     *     "rating": 5,
     *     "reward": {
     *          Refer to Reward Model
     *     },
     *     "rewards": ["5b7ab4ce24688b0adcb9f542", "5b7ab4ce24688b0adcb9f541"],
     *     "category": "foodndrink"
     *  }]
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
    retrieveFavourites : function (req, res ) {
        var currentUser = req.user;

        Customer.findById(currentUser._id).select('favourites').populate({
            path: 'favourites',
            model: 'User',
            populate: {
                path: 'merchantInfo.rewards',
                model: 'Reward'
            }
        }).exec(function (err, userPop) {
            if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
            } else {
                var response = [];
                for (var i = 0; i < userPop.favourites.length; i++) {
                    var merchant = userPop.favourites[i];
                    response.push({
                        _id: merchant._id,
                        name: merchant.merchantInfo.companyName,
                        email: merchant.email,
                        mobile: merchant.merchantInfo.mobileNumber,
                        details: merchant.merchantInfo.companyDetails,
                        logo: merchant.merchantInfo.logo,
                        banner: merchant.merchantInfo.banner,
                        address: merchant.merchantInfo.address + ', ' + merchant.merchantInfo.city,
                        location: {
                            long: merchant.merchantInfo.location[0],
                            lat: merchant.merchantInfo.location[1]
                        },
                        rating: merchant.merchantInfo.rating.value,
                        reward: merchant.merchantInfo.rewards[0],
                        rewards: merchant.merchantInfo.rewards,
                        category: merchant.merchantInfo.categories[Math.floor(Math.random() * merchant.merchantInfo.categories.length)],
                        visited: currentUser.visited.indexOf(merchant._id) > -1
                    });
                }

                res.status(200).send(response);
            }
        });
    },

    setToken : function (req, res) {
        var id = req.params.id || req.query.id || req.body.id;
        var body = req.body;
        console.log(body.token);

        if (!body.token) {
            res.status(400).send({
                message: 'Token cannot be empty.'
            })
        } else {
            Customer.findById(id, function (err, user) {
                if (err) {
                    res.status(500).send(err);
                    Raven.captureException(err);
                } else if (!user) {
                    res.status(404).send({ message: 'User does not exist.' });
                } else {
                    user.notification.token = body.token;
                    user.modifiedDate = new Date();

                    user.save(function(err) {
                        if (err) {
                            res.status(500).send(err);
                            Raven.captureException(err);
                        } else {
                            res.status(200).send({ message: 'Token updated.' });
                        }
                    });
                }
            });
        }
    },
    
    /**
     * @api {put} /customer/category Update the user's interests/categories
     * @apiName updateInterests
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String[]} interests An array of interests
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The full name of the user
     * @apiSuccess {Date} dateOfBirth The user's date of birth
     * @apiSuccess {String} ageRange The user's ageRange
     * @apiSuccess {String} sex The user's gender
     * @apiSuccess {Boolean} isActive Tells you if a user is active or not
     * @apiSuccess {String[]} blacklist String array of blacklisted rewards
     * @apiSuccess {String[]} favourites String array of favourites
     * @apiSuccess {String[]} interests String array of interests
     * @apiSuccess {String} city The city of the user
     * @apiSuccess {Object} picture An object containing url {String} url of image
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "_id": "5b7ab4ce24688b0adcb9f54b",
     *     "email": "test@email.com"
     *     "name": "Test User",
     *     "dateOfBirth": "2018-08-22",
     *     "ageRange": "15 - 25",
     *     "sex": "male",
     *     "isActive": true,
     *     "blacklist": [],
     *     "favourites": [],
     *     "interests": [],
     *     "city": "lagos",
     *     "picture": {
     *         "url": null
     *     }
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
    updateInterests : function (req, res) {
        req.user.interests = JSON.parse(req.body.interests);
        if (!req.user.interests) {
            req.user.interests = [];
        }

        req.user.save(function (err) {
        if (err) {
            res.status(500).send(err);
            Raven.captureException(err);
        } else {
            var user = req.user;
            var data = {
                _id: user._id,
                email: user.email,
                name: user.name,
                dateOfBirth: user.dateOfBirth,
                ageRange: user.ageRange,
                sex: user.sex,
                isActive: user.isActive,
                blacklist: user.blacklist || [],
                favourites: user.favourites,
                interests: user.interests,
                city: user.city,
                picture: {
                    url: user.picture
                }
            };
            res.status(200).send(data);
        }
        });
    },
    
    /**
     * @api {put} /customer/:id Update the user's information
     * @apiName updateUser
     * @apiGroup Customer
     * 
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} _id The id of customer (Optional)
     * @apiParam {String} email The email of the  (Optional)
     * @apiParam {String} name The full name of the user (Optional)
     * @apiParam {Date} dateOfBirth The user's date of birth (Optional)
     * @apiParam {String} ageRange The user's ageRange (Optional)
     * @apiParam {String} sex The user's gender (Optional)
     * @apiParam {Boolean} isActive Tells you if a user is active or not (Optional)
     * @apiParam {String[]} favourites String array of favourites (Optional)
     * @apiParam {String[]} interests String array of interests (Optional)
     * @apiParam {String} city The city of the user (Optional)
     * @apiParam {Object} picture An object containing url {String} url of image (Optional)
     * 
     * @apiSuccess {String} _id The id of customer
     * @apiSuccess {String} email The email of the 
     * @apiSuccess {String} name The full name of the user
     * @apiSuccess {Date} dateOfBirth The user's date of birth
     * @apiSuccess {String} ageRange The user's ageRange
     * @apiSuccess {String} sex The user's gender
     * @apiSuccess {Boolean} isActive Tells you if a user is active or not
     * @apiSuccess {String[]} blacklist String array of blacklisted rewards
     * @apiSuccess {String[]} favourites String array of favourites
     * @apiSuccess {String[]} interests String array of interests
     * @apiSuccess {String} city The city of the user
     * @apiSuccess {Object} picture An object containing url {String} url of image
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *     "_id": "5b7ab4ce24688b0adcb9f54b",
     *     "email": "test@email.com"
     *     "name": "Test User",
     *     "dateOfBirth": "2018-08-22",
     *     "ageRange": "15 - 25",
     *     "sex": "male",
     *     "isActive": true,
     *     "blacklist": [],
     *     "favourites": [],
     *     "interests": [],
     *     "city": "lagos",
     *     "picture": {
     *         "url": null
     *     },
     *     "notification": {
     *         "token": "33iu2hiu3h2",
     *         "days": "weekday"
     *     }
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
    updateUser : function (req, res) {
      var id = req.params.id || req.query.id || req.body.id;
      var body = req.body;
      var deletePicture = false;
      var formerPicture = '';
  
      Customer.findById(id, function (err, user) {
        if (err) {
          res.status(500).send(err);
          Raven.captureException(err);
        } else if (!user) {
          res.status(404).send({ message: 'User does not exist.' });
        } else {
            if (!user.notification) {
                user.notification = {
                    token: '',
                    notify: true,
                    days: 'weekdays'
                }
            }

          ['name', 'email', 'address', 'mobileNumber', 'network', 'dateOfBirth', 'sex', 'ageRange', 'notify', 'days'].forEach(
            function (key) {
              if (body[key]) {
                  if (key === 'notify' || key === 'days') {
                    user.notification[key] = body[key];
                  } else {
                    user[key] = body[key];
                  }
              }
            });

          if (body.picture) {
              if (user.picture.url) {
                  deletePicture = true;
                  formerPicture = user.picture.id;
              }
              var picture = JSON.parse(body.picture);
              user.picture = {
                id: picture.id,
                url: picture.url
              };
          }
  
          user.modifiedDate = new Date();
  
          user.save(function(err) {
            if (err) {
              res.status(500).send(err);
              Raven.captureException(err);
            } else {
                var data = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    dateOfBirth: user.dateOfBirth,
                    ageRange: user.ageRange,
                    sex: user.sex,
                    isActive: user.isActive,
                    blacklist: user.blacklist || [],
                    favourites: user.favourites,
                    interests: user.interests,
                    city: user.city,
                    mobileNumber: user.mobileNumber,
                    picture: user.picture,
                    notification: user.notification
                };
              res.status(200).send(data);
            }
          });
        }
      });
    }
}
