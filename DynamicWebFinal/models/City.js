const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    city_name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('City', citySchema); 