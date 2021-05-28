// module
var mongoose = require('mongoose');
var shortid = require('shortid');

// define the user schema
var schema = mongoose.Schema;

var addressSchema = new schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  address: {
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