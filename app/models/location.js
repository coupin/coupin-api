// module
var mongoose = require('mongoose');

// define the location model
// module.exports allows is to pass this to other files when it is called
module.exports = mongoose.model('Location', {
    name: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: 'Homeless'
    },
    phone: {
        type: Number,
        default: 0
    },
    geopoint: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    isActive: {
        type: Boolean
    }
});