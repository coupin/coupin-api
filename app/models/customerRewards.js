// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the customer schema

var schema = mongoose.Schema;

var customerRewardSchema = new schema({

      customerId: {
        type: String
      },
      token: {
        type: String
      },
      createdDate: {
        type: Date
      }
});
// module.exports allows is to pass this to other files when it is called
var CustomerReward = mongoose.model('CustomerReward', customerRewardSchema);

CustomerReward.getCustomerRewardById = function(id, callback){
	CustomerReward.findById(id, callback);
}

CustomerReward.getCustomerRewardByCustomerId = function(customerId, callback){
  var query = {customerId: customerId};
	CustomerReward.findOne(query, callback);
}

CustomerReward.createCustomerRewards = function(newCustomerReward, callback){
   			newCustomerReward.save(callback);
}

module.exports = CustomerReward;
