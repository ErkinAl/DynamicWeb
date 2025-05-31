require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../models/City');

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flyticket');
        console.log('Connected to MongoDB');

        const cities = await City.find({});
        console.log('\nCities in database:', cities.length);
        console.log('First few cities:', cities.slice(0, 5).map(city => city.city_name));

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkDatabase(); 