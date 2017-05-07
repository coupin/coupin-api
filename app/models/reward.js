// module
var mongoose = require('mongoose');



var schema = mongoose.Schema;

var rewardSchema = new schema({

    description: {
        type: String
    },
    merchantID: {
        type: String
    },
    categories: {
      type: String
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    createdDate: {
      type: Date
    },
    modifiedDate: {
      type: Date
    },
    multiple: {
      type: Boolean
    },
    applicableDays: {
      type: String
    },
    isActive: {
        type: Boolean
    }
});
// module.exports allows is to pass this to other files when it is called
var Reward = module.exports = mongoose.model('Reward', rewardSchema);

module.exports.getRewardById = function(id, callback){
	Reward.findById(id, callback);
}


module.exports.getRewardByMerchantId = function(merchantId, callback){
	var query = {merchantId: merchantId};
	Reward.findOne(query, callback);
}

module.exports.getRewardByCustomerId = function(customerId, callback){
	var query = {customerId: customerId};
	Reward.findOne(query, callback);
}

module.exports.getRewardByCategoryId = function(category, callback){
	var query = {category: category};
	Reward.findOne(query, callback);
}

module.exports.createReward = function(newReward, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newReward.password, salt, function(err, hash) {
   			newReward.password = hash;
   			newReward.save(callback);
    	});
	});
}
