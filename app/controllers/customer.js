const Customer = require('../models/users');
const Reward = require('../models/reward');

// Coupin App Messages
const config = require('../../config/config');
const emailer = require('../../config/email');
const messages = require('../../config/messages');

const cloudinary = config.cloudinary;

module.exports = {
    /**
     * Add merchant to favourites
     */
    addToFavourites : function (req, res) {
        if (!req.user.favourites) {
        req.user.favourites = [];
        }

        req.user.favourites.push(req.body.merchantId);
        req.user.save(function(err) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                res.status(200).send({ 
                message: 'Added Successfully',
                user: req.user
                });
            }
        });
    },
    
    /**
     * Create user interests
     */
    createInterests : function (req, res) {
        req.user.interests = JSON.parse(req.body.interests);

        req.user.save(function (err) {
        if (err) {
            res.status(500).send(err);
            throw new Error(err);
        } else {
            res.status(200).send({ message: 'Interests Created' });
        }
        });
    },
    /**
     * Remove favourites
     */
    removeFavourites : function (req, res) {
        const index = req.user.favourites.indexOf(req.body.merchantId);
        
        if (index === -1) {
        res.status(404).send({ message: 'Favourite does not exist.' });
        } else {
        req.user.favourites.splice(index, 1);
        req.user.save(function (err) {
            if (err) {
            res.status(500).send(err);
            throw new Error(err);
            } else {
            res.status(200).send(req.user);
            }
        });
        }
    },
    /**
     * Retrieve users favourites
     */
    retrieveFavourites : function (req, res ) {
        let user = req.user;
        Customer.populate(user, {
        path: 'favourites',
        model: 'User',
        populate: {
            path: 'merchantInfo.rewards',
            model: 'Reward'
        }
        }, function (err, userPop) {
            if (err) {
                res.status(500).send(err);
                throw new Error(err);
            } else {
                var response = [];
                for (let i = 0; i < userPop.favourites.length; i++) {
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
                        category: merchant.merchantInfo.categories[Math.floor(Math.random() * merchant.merchantInfo.categories.length)]
                    });
                }

                res.status(200).send(response);
            }
        });
    },
    /**
     * Update user interests
     */
    updateInterests : function (req, res) {
        req.user.interests = JSON.parse(req.body.interests);
        if (!req.user.interests) {
        req.user.interests = [];
        }

        req.user.save(function (err) {
        if (err) {
            res.status(500).send(err);
            throw new Error(err);
        } else {
            res.status(200).send(req.user);
        }
        });
    },
    /**
     * Update users
     */
    updateUser : function (req, res) {
      const id = req.params.id || req.query.id || req.body.id;
      const body = req.body;
      let deletePicture = false;
      let formerPicture = '';
  
      Customer.findById(id, function (err, user) {
        if (err) {
          res.status(500).send(err);
          throw new Error(err);
        } else if (!user) {
          res.status(404).send({ message: 'User does not exist.' });
        } else {
          ['name', 'email', 'address', 'mobileNumber', 'network', 'dateOfBirth', 'sex', 'ageRange'].forEach(
            function (value) {
              if (body[value]) {
                user[value] = body[value];
              }
            });

          if (body.picture) {
              if (user.picture.url) {
                  deletePicture = true;
                  formerPicture = user.picture.id;
              }
              const picture = JSON.parse(body.picture);
              user.picture = {
                id: picture.id,
                url: picture.url
              };
          }
  
          user.modifiedDate = new Date();
  
          user.save(function(err) {
            if (err) {
              res.status(500).send(err);
              throw new Error(err);
            } else {
              res.status(200).send(user);
              if (deletePicture) {
                cloudinary.v2.uploader.destroy(formerPicture, {
                    invalidate: true
                }, function(err, result) {
                    if (err) {
                    console.log(err);
                    throw new Error(err);
                    }
                });
              }
            }
          });
        }
      });
    }
}
