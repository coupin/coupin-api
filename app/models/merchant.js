// module
var mongoose = require('mongoose');
var crypto = require('crypto-js');

// config file
var config = require('../../config/env');

// define the schema
var schema = mongoose.Schema;

var merchantSchema = new schema({

      companyName: {
          type: String
          //default: ''
      }
      ,
      email: {
        type: String,
        unique: true
      },
      companyDetails: {
        type: String
      },
      address: {
          type: String
      },
      city: {
          type: String
      },
      state: {
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
      deactivated: {
        type: Boolean,
        default: false
      },
      isPending: {
        type: Boolean,
        default: false
      },
      rejected: {
        type: Boolean,
        default: false
      },
      reason: {
        type: String
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

merchantSchema.methods.isValid = function(candidatePassword, hash, callback){
	if(crypto.AES.decrypt(this.local.password, config.secret).toString(crypto.enc.Utf8) === password)
      return true;

  return false;
}

merchantSchema.methods.createMerchant = function(newMerchant, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newMerchant.password, salt, function(err, hash) {
   			newMerchant.password = hash;
   			newMerchant.save(callback);
    	});
	});
}

merchantSchema.methods.encryptPassword = function(password) {
    return crypto.AES.encrypt(password, config.secret).toString();
};

merchantSchema.methods.isValidPassword = function(password) {
        if(crypto.AES.decrypt(this.local.password, config.secret).toString(crypto.enc.Utf8) === password)
            return true;

        return false;
    };

// module.exports allows is to pass this to other files when it is called
module.exports = mongoose.model('Merchant', merchantSchema);
