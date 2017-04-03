// module
var crypto = require('crypto-js');
var mongoose = require('mongoose');

// config file
var config = require('../../config/env');

// Declare Schema
var schema = mongoose.Schema;

var adminSchema = new schema({
    local: {
        username: String, 
        password: String,
        email: String,
        isActive: {
            type: Boolean,
            default: true
        },
        superAdmin: {
            type: Boolean,
            default: false
        }
    }
});

adminSchema.methods.encryptPassword = function(password) {
        return crypto.AES.encrypt(password, config.secret).toString();
    };

adminSchema.methods.isValidPassword = function(password) {
        if(crypto.AES.decrypt(this.local.password, config.secret).toString(crypto.enc.Utf8) === password)
            return true;

        return false;
    };
    
adminSchema.methods.isEmpty = function(aString) {
        if(aString === null || aString === undefined || aString.length < 5){
            return true;
        }

        return false;
    };

// For Admin Users
module.exports = mongoose.model('Admin', adminSchema);