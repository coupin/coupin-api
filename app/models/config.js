// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the config schema
var schema = mongoose.Schema;

var configSchema = new schema({
  trialPeriod: {
    enabled: {
      type: Boolean,
      default: false,
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 1
    }
  }
}, {
    usePushEach: true,
    strict: false,
});

var Config = mongoose.model('Config', configSchema);

module.exports = Config;
