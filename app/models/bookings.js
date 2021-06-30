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
        singleUse: {
            type: Boolean,
            default: false
        },
        usedOn: {
            type: Date,
            default: null
        }
    }],
    shortCode: {
        type: String,
        default: null
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
    },
    status: {
        type: String,
        enum: ['awaiting_payment', 'paid', 'order_picked', 'delivered', 'fulfilled'],
        default: 'awaiting_payment'
    },
    transactions: [{
        reference: {
            type: String,
            required: true,
        },
        paymentReference: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'failed', 'success'],
            default: 'pending'
        }
    }],
    isDeliverable: {
        type: Boolean,
        default: false,
    },
    deliveryAddress: {
        type: String,
        ref: 'Address',
    }
});

var Bookings = mongoose.model('Booking', bookingSchema);

module.exports = Bookings;