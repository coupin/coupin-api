// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the customer schema

var schema = mongoose.Schema;

var customerSchema = new schema({
    local: {
        username: String, 
        password: String,
        email: String,
        admin: {
            type: Boolean,
            default: false
            }
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    // TODO: Remove twitter
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    info : {
        name: {
          type: String
          //default: ''
      },
      email: {
        type: String
      },
    //   TODO: leave for analytics
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
      dateOfBirth: {
        typo: Date
      }
    }
});
// module.exports allows is to pass this to other files when it is called
module.exports = mongoose.model('Customer', customerSchema);

module.exports.getCustomerByNumber = function(number, callback){
	Customer.findById(number, callback);
}

module.exports.getCustomerByEmail = function(email, callback){
	var query = {email: email};
	Customer.findOne(query, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	callback(null, isMatch);
	});
}

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newUser.password, salt, function(err, hash) {
   			newUser.password = hash;
   			newUser.save(callback);
    	});
	});
}
