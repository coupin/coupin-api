const _ = require('lodash');

const Reward = require('../../models/reward');
const User = require('../../models/users');

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
        console.log(err);
        res.status(500).send(err);
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
        console.log(err);
        res.status(500).send(err);
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
    User.populate(user, {
      path: 'favourites',
      model: 'User',
      populate: {
        path: 'merchantInfo.rewards',
        model: 'Reward'
      }
    }, function (err, userPop) {
      if (err) {
        res.status(500).send(err);
      } else {
        for (let i = 0; i < userPop.favourites.length; i++) {
          Reward.findById({ merchantID: userPop.favourites[i]._id }, (err, rewards) => {
            userPop.favourites
          });
        }
        
        res.status(200).send(userPop.favourites);
      }
    });
  },

  /**
   * Retrieve user details
   */
  retrieveUser : function (req, res) {
    res.status(200).send({user: req.user});
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
        console.log(err);
        res.status(500).send(err);
      } else {
        res.status(200).send(req.user);
      }
    });
  }
};