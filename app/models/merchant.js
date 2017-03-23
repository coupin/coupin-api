// module
var mongoose = require('mongoose');

// define the customer schema

var schema = mongoose.Schema;

var merchantSchema = new schema({

      name: {
          type: String
          //default: ''
      },
      email: {
        type: String
      },
      address: {
          type: String
          //default: ''
      },
      mobileNumber: {
          type: Number,
          index: true
      },
      network: {
          type: String
      },
      password: {
          type: String
      },
      isActive: {
          type: Boolean
      },
      token: {
          type: String
      }
});
// module.exports allows is to pass this to other files when it is called
module.exports = mongoose.model('Customer', customerSchema);
