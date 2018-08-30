//@ts-check
var mongoose = require('mongoose');
var schema = mongoose.Schema;

var bookingSchema = new schema({
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
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: new Date
    }
});

var Bookings = mongoose.model('Booking', bookingSchema);

module.exports = Bookings;