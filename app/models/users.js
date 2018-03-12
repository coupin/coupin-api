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
    googleId: {
        type: String
    },
    facebookId: {
        type: String
    },
    name: {
        type: String,
        lowercase: true
    },
    email: {
        type: String,
        lowercase: true,
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
        type: String,
        enum: ['Etisalat', 'MTN', 'Airtel', 'Glo']
    },
    password: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    ageRange: {
        type: String,
        enum: ['under 15', '15 - 25', '25 - 35', '35 - 45', 'above 45']
    },
    sex: {
        type: String,
        enum: ['male', 'female']
    },
    picture: {
        type: String,
        default: null
    },
    city: {
        type: String
    },
    state: {
        type: String,
        lowercase: true
    },
    role: {
        type: Number,
        default: 3
    },
    interests: [{
        type: String,
        enum: ['entertainment', 'foodndrink', 'gadgets', 'groceries', 'healthnbeauty', 'shopping', 'tickets', 'travel']
    }],
    favourites: [{
        type: String,
        ref: 'User'
    }],
    merchantInfo: {
        companyName: {
            type: String,
            lowercase: true
        },
        companyDetails: {
            type: String,
            lowercase: true
        },
        mobileNumber: {
            type: String,
            index: true
        },
        address: {
            type: String
        },
        city: {
            type: String,
            lowercase: true
        },
        state: {
            type: String
        },
        location: {
            // Longitude must always come first
            type: [Number],
            index: '2d'
        },
        categories: [{
            type: String,
            enum: ['entertainment', 'foodndrinks', 'gadgets', 'groceries', 'healthnbeauty', 'shopping', 'tickets', 'travel']
        }],
        logo: {
            type: String,
            default: null
        },
        banner: {
            type: String,
            default: null
        },
        rewards: [{
            type: String,
            ref: 'Reward'
        }],
        lastAdded: [{
            type: Date,
            default: new Date()
        }],
        hot: {
            status: {
                type: Boolean,
                default: false
            },
            starts: Date,
            expires: Date
        },
        rating: {
            value: {
                default: 0,
                type: Number
            },
            raters: {
                default: 0,
                type: Number
            }
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
        type: Date,
        default: new Date()
    },
    modifiedDate: {
        type: Date
    }
});

userSchema.pre('save', function(next) {
    if ( this.categories && this.categories.length === 0) {
        this.categories.push('foodndrinks')
    }

    next();
});

userSchema.index({'merchantInfo.location': '2dsphere'});

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

User.updatePassword = function (user, password, callback) {
    bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(password, salt, function(err, hash) {
   			user.password = hash;
   			user.save(callback);
    	});
	});
};

User.isValid = function (plainPassword, hashedPassword) {
    const salt = bcrypt.genSalt(10);
    return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = User;