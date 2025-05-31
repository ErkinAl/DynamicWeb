const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    passenger_name: {
        type: String,
        required: true,
        trim: true
    },
    passenger_surname: {
        type: String,
        required: true,
        trim: true
    },
    passenger_email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    seat_number: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema); 