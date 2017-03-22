// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the customer schema

var schema = mongoose.Schema;

var customerSchema = new schema({

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
          type: String,
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
      },
      sex: {
          type: String
      },
      city: {
          type: String
      },
      state: {
          type: String
      },
      createdDate: {
        type: Date
      },
      modifiedDate: {
        type: Date
      }


});
// module.exports allows is to pass this to other files when it is called
var Customer = module.exports = mongoose.model('Customer', customerSchema);


module.exports.getCustomerByNumber = function(mobileNumber, callback){
  var query = {mobileNumber: mobileNumber};
	Customer.findOne(query, callback);
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

module.exports.createCustomer = function(newCustomer, callback){
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newCustomer.password, salt, function(err, hash) {
   			newCustomer.password = hash;
   			newCustomer.save(callback);
    	});
	});
}
