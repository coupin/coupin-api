// module
var mongoose = require('mongoose');

// define the customer schema

var schema = mongoose.Schema;

var merchantSchema = new schema({

      companyName: {
          type: String
          //default: ''
      },
      categories: {
        type: [String]
      }
      ,
      email: {
        type: String
      },
      companyDetails: {
        type: String
      },
      address: {
          type: String
      },
      mobileNumber: {
          type: Number
      },
      password: {
          type: String
      },
      activated: {
        type: Boolean,
        default: false
      },
      createdDate: {
        type: Date
      },
      modifiedDate: {
        type: Date
      }
});

merchantSchema.methods.getMerchantById = function(id, callback){
	Merchant.findById(id, callback);
}

merchantSchema.methods.getMerchantByEmail = function(email, callback){
	var query = {email: email};
	Merchant.findOne(query, callback);
}

merchantSchema.methods.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	callback(null, isMatch);
	});
}

merchantSchema.methods.createMerchant = function(newMerchant, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newMerchant.password, salt, function(err, hash) {
   			newMerchant.password = hash;
   			newMerchant.save(callback);
    	});
	});
}

// module.exports allows is to pass this to other files when it is called
module.exports = mongoose.model('Merchant', merchantSchema);