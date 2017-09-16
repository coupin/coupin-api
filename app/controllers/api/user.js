const _ = require('lodash');

module.exports = {
  getArray: function (value) {
    value.replace("")
  }
  ,
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
  updateInterests : function (req, res) {
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