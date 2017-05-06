// module
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// define the user schema
var schema = mongoose.Schema;

/**
 * Roles
 * ------
 * 0 - superadmin, 1 - admin, 2 - merchant and 3 - customer
 */

var userSchema = new schema({

      name: {
          type: String
      },
      email: {
        type: String,
        required: true,
        unique: true
      },
      address: {
          type: String
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
      role: {
          type: Number,
          default: 3
      },
      merchantInfo: {
          companyName: {
              type: String
          },
          companyDetails: {
              type: String
          },
          mobileNumber: {
              type: String,
              index: true
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
          location: {
              lat: Number,
              long: Number
          },
          logo: {
              type: String
          }
      },
      isActive: {
          type: Boolean,
          default: true
      },
      activated: {
            type: Boolean,
            default: false
      },
      isPending: {
            type: Boolean,
            default: false
      },
      rejected: {
          type: Boolean
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

// module.exports allows is to pass this to other files when it is called
const User = mongoose.model('User', userSchema);

User.getCustomerById = function(id, callback) {
	User.findById(id, callback);
};

User.getCustomerByNumber = function(mobileNumber, callback) {
  var query = {mobileNumber: mobileNumber};
	User.findOne(query, callback);
};

User.getCustomerByEmail = function(email, callback) {
	var query = {email: email};
	User.findOne(query, callback);
};

User.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	callback(null, isMatch);
	});
};

User.createCustomer = function (newCustomer, callback) {
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newCustomer.password, salt, function(err, hash) {
   			newCustomer.password = hash;
   			newCustomer.save(callback);
    	});
	});
};

User.isValid = function (plainPassword, hashedPassword, callback) {
    const salt = bcrypt.genSalt(10);
    return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = User;