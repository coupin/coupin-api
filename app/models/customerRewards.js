// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the customer schema

var schema = mongoose.Schema;

var customerRewardSchema = new schema({

      customerId: {
        type: String
      },
      token{
        type: String
      },
      createdDate: {
        type: Date
      }
});
// module.exports allows is to pass this to other files when it is called
var CustomerReward = module.exports = mongoose.model('CustomerReward', customerRewardSchema);

module.exports.getCustomerRewardById = function(id, callback){
	CustomerReward.findById(id, callback);
}

module.exports.getCustomerRewardByCustomerId = function(customerId, callback){
  var query = {customerId: customerId};
	CustomerReward.findOne(query, callback);
}

module.exports.createCustomerRewards = function(newCustomerReward, callback){
   			newCustomerReward.save(callback);
}
