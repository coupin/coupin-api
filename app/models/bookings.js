const mongoose = require('mongoose');
const schema = mongoose.Schema;

let bookingSchema = new schema({
    userId: {
        type: String,
        required: true
    },
    rewardId: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        unique: true,
        required: true
    },
    useNow: {
        type: Boolean,
        default: true
    }
});

let Bookings = mongoose.model('Booking', bookingSchema);

module.exports = Bookings;