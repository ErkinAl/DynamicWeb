const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/landmarks-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Rotaları ekle
const landmarksRouter = require('./routes/landmarks');
const visitedRouter = require('./routes/visited');

app.use('/api/landmarks', landmarksRouter);
app.use('/api/visited', visitedRouter);

// Ana route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Port ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 