var config = require('../config/env').module;
var crypto = require('crypto-js');

exports.module = {
    encryptPassword: function(password) {
        return crypto.AES.encrypt(password, config.secret).toString();
    },
    decryptPassword: function(password) {
        return crypto.AES.decrypt(password, config.secret).toString(crypto.enc.Utf8);
    },
    isEmpty: function(aString) {
        if(aString === null || aString === undefined || aString.length < 5){
            return true;
        }

        return false;
    }
};