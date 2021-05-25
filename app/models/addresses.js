// module
var mongoose = require('mongoose');
var shortid = require('shortid');

// define the user schema
var schema = mongoose.Schema;

/**
 * Roles
 * ------
 * 0 - superadmin, 1 - admin, 2 - merchant and 3 - customer
 */

var addressSchema = new schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  streetLine1: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  location: {
    longitude: {
      type: Number,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    }
  },
  mobileNumber: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    ref: 'User'
  }
}, {
  usePushEach: true
});

module.exports = mongoose.model('Address', addressSchema);