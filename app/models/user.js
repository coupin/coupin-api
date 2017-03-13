// module
var mongoose = require('mongoose');

// For Admin Users
module.exports = mongoose.model('User', {
    username: {
        type: String,
        required: true,
        unique: true,
        dropDups: true 
    }, 
    password: {
        type: String,
        required: true,
        dropDups: true 
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});