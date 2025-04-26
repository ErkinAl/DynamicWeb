const mongoose = require('mongoose');

const visitedLandmarkSchema = new mongoose.Schema({
    landmark_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landmark',
        required: true
    },
    visited_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    visitor_name: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: false,
        default: ''
    },
    plan_name: {
        type: String,
        required: false
    },
    plan_description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VisitedLandmark', visitedLandmarkSchema); 