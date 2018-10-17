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
        id: {
            type: String
        },
        url: {
            type: String,
            default: null
        }
    },
    city: {
        type: String,
        default: 'lagos'
    },
    state: {
        type: String,
        lowercase: true
    },
    role: {
        type: Number,
        enum: [3, 2, 1, 0],
        default: 3
    },
    interests: [{
        type: String,
        enum: ['entertainment', 'foodndrink', 'gadgets', 'groceries', 'healthnbeauty', 'shopping', 'tickets', 'travel']
    }],
    blacklist: [{
        type: String,
        ref: 'User'
    }],
    favourites: [{
        type: String,
        ref: 'User'
    }],
    visited: [{
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
            lowercase: true,
            default: 'lagos'
        },
        state: {
            type: String,
            lowercase: true
        },
        location: {
            // Longitude must always come first
            type: [Number],
            index: '2d'
        },
        categories: [{
            type: String,
            enum: ['entertainment', 'foodndrink', 'gadgets', 'groceries', 'healthnbeauty', 'shopping', 'tickets', 'travel']
        }],
        logo: {
            id: {
                type: String
            },
            url: {
                type: String,
                default: null
            }
        },
        banner: {
            id: {
                type: String
            },
            url: {
                type: String,
                default: null
            }
        },
        expiredRewards: [{
            type: String,
            ref: 'Reward'
        }],
        pendingRewards: [{
            type: String,
            ref: 'Reward'
        }], 
        rewards: [{
            type: String,
            ref: 'Reward'
        }],
        rating: {
            value: {
                default: 0,
                type: Number
            },
            raters: {
                default: 1,
                type: Number
            }
        },
        billing: {
            plan: {
                type: String,
                enum: ['payAsYouGo', 'monthly', 'yearly'],
                default: 'payAsYouGo'
            },
            history: [{
                plan: {
                    type: String,
                    enum: ['payAsYouGo', 'monthly', 'yearly'],
                    require: true
                },
                date: {
                    type: Date,
                    default: Date.now
                },
                reference: {
                    type: String,
                    require: true
                },
                expiration: {
                    type: Date
                }
            }]
        }
    },
    isActive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    reason: {
        type: String
    },
    completedDate: {
        type: Date
    },
    createdDate: {
        type: Date,
        default: new Date()
    },
    modifiedDate: {
        type: Date
    }
}, {
    usePushEach: true
});

userSchema.pre('save', function(next) {
    if ( this.categories && this.categories.length === 0) {
        this.categories = [];
    }

    next();
});

userSchema.index({'merchantInfo.location': '2dsphere'});

// module.exports allows is to pass this to other files when it is called
var User = mongoose.model('User', userSchema);

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
    var salt = bcrypt.genSalt(10);
    return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = User;