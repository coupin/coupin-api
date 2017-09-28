const _ = require('lodash');

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
    User.populate(req.user, {
      populate: 'favourites',
      path: 'User'
    }, function (err, user) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(user.favourites);
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
    req.body.interests = req.user.interests = JSON.parse(req.body.interests);
    if (!req.user.interests) {
      req.user.interests = [];
    }

    req.user.interests = _.union(req.user.interests, req.body.interests);
    req.user.save(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else {
        res.status(200).send({ message: 'Interests Updated' });
      }
    });
  }
};