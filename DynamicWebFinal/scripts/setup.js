require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../models/City');
const Admin = require('../models/Admin');

// Turkish cities array
const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
    'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
    'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
    'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
    'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
    'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
    'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

async function setup() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flyticket');
        console.log('Connected to MongoDB');

        // Clear existing data
        await City.deleteMany({});
        await Admin.deleteMany({});
        console.log('Cleared existing data');

        // Insert cities
        const cities = turkishCities.map(cityName => ({ city_name: cityName }));
        await City.insertMany(cities);
        console.log('Added cities to database');

        // Create admin account
        const admin = new Admin({
            username: 'admin',
            password: 'admin123' // This will be hashed by the pre-save middleware
        });
        await admin.save();
        console.log('Created admin account');

        console.log('\nSetup completed successfully!');
        console.log('\nAdmin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\nPlease change the admin password after first login!');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setup(); 