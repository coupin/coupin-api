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
        id: {
            type: String,
            required: true,
            ref: 'Reward'
        },
        status: {
            type: String,
            enum: ['pending', 'used', 'expired'],
            default: 'pending'
        },
        usedOn: {
            type: Date,
            default: null
        }
    }],
    shortCode: {
        type: String,
        unique: true,
        sparse: true
    },
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