const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['historical', 'natural', 'cultural'],
        required: true
    },
    notes: {
        type: String,
        required: false // Optional field
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Landmark', landmarkSchema); 