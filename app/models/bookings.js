//@ts-check
const mongoose = require('mongoose');
const schema = mongoose.Schema;

let bookingSchema = new schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    merchantId: {
        type: String,
        required: true,
        ref: 'User'
    },
    rewardId: [{
        type: String,
        required: true,
        ref: 'Reward'
    }],
    shortCode: {
        type: String,
        unique: true,
        sparse: true
    },
    used: [{
        type: Number,
        default: null
    }],
    useNow: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

let Bookings = mongoose.model('Booking', bookingSchema);

module.exports = Bookings;