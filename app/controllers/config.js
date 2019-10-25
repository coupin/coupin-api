var config = require('./../../config/config');
var Raven = config.Raven;

var ConfigModel = require('../models/config');

// there must always be a single config entry in the config table or else
// we risk having invalid application state and behaviour
module.exports = {
  getConfigData: function (req, res) {
    ConfigModel.find({}, function (err, config) {
      if (err) {
        res.status(500).send(err);
        Raven.captureException(err);
      } else {
        if (config.length > 0) {
          res.status(200).send(config[0]);
        } else {
          res.status(200).send({});
        }
      }
    });
  },

  toggleTrialPeriod: function (req, res) {
    var trialPeriodStatus = req.body.status;
    var trialPeriodEndDate = req.body.endDate;
    var trialPeriodDuration = req.body.duration;
    
    if (typeof trialPeriodStatus !== 'boolean') {
      res.status(400).send({
        message: 'Send a valid value for status, true or false',
      });
    } else if (trialPeriodStatus && !trialPeriodEndDate && !trialPeriodDuration && trialPeriodDuration < 1) {
      res.status(400).send({
        message: 'Enter a valid end date and duration if you\'re enabling trial period',
      });
    } else {
      if (trialPeriodStatus === false) {
        trialPeriodDuration = 0;
      }

      ConfigModel.find({}, function (err, config) {
        if (err) {
          res.status(500).send(err);
          Raven.captureException(err);
        } else {
          var configData;
          var configDataId;
          var command;

          if (config.length > 0) {
            configData = config[0];
            configDataId = configData._id;
            ConfigModel.update({ _id: configDataId }, {
              trialPeriod: {
                enabled: trialPeriodStatus,
                endDate: trialPeriodEndDate,
                duration: trialPeriodDuration,
              },
            }, function (err, data) {
              if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
              } else {
                res.status(200).json({
                  message: 'Trial period has been ' + trialPeriodStatus ? 'activated' : 'deactivated',
                });
              }
            });
          } else {
            ConfigModel.create({
              trialPeriod: {
                enabled: trialPeriodStatus,
                endDate: trialPeriodEndDate,
                duration: trialPeriodDuration,
              },
            }, function (err, data) {
              if (err) {
                res.status(500).send(err);
                Raven.captureException(err);
              } else {
                res.status(200).json({
                  message: 'Trial period has been ' + trialPeriodStatus ? 'activated' : 'deactivated',
                });
              }
            });
          }
        }
      });
    }
  }
};
