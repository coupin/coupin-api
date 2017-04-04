// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the customer schema

var schema = mongoose.Schema;

var merchantSchema = new schema({

      companyName: {
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
          type: Number
      },
      password: {
          type: String
      },
      activated: {
        type: Boolean
      },
      createdDate: {
        type: Date
      },
      modifiedDate: {
        type: Date
      }


});
// module.exports allows is to pass this to other files when it is called
var Merchant = module.exports = mongoose.model('Merchant', merchantSchema);

module.exports.getMerchantById = function(id, callback){
	Merchant.findById(id, callback);
}

module.exports.getMerchantByEmail = function(email, callback){
	var query = {email: email};
	Merchant.findOne(query, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	callback(null, isMatch);
	});
}

module.exports.createMerchant = function(newMerchant, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newMerchant.password, salt, function(err, hash) {
   			newMerchant.password = hash;
   			newMerchant.save(callback);
    	});
	});
}
