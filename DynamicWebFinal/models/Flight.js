const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    from_city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    to_city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    departure_time: {
        type: Date,
        required: true
    },
    arrival_time: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    seats_total: {
        type: Number,
        required: true,
        min: 1
    },
    seats_available: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Index for flight scheduling rules
flightSchema.index({ from_city: 1, departure_time: 1 }, { unique: true });
flightSchema.index({ to_city: 1, arrival_time: 1 }, { unique: true });

module.exports = mongoose.model('Flight', flightSchema); 