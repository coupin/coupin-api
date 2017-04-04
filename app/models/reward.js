// module
var mongoose = require('mongoose');



var schema = mongoose.Schema;

var rewardSchema = new schema({

    name: {
        type: String,
        default: ''
    },
    merchantID: {
        type: String
    },
    geopoint: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    recurring: {
      type: Boolean
    }
    isActive: {
        type: Boolean
    }
});
