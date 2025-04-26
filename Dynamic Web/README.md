# Landmarks App

Bu proje, kullanıcıların önemli yerleri kaydedebileceği ve ziyaret geçmişlerini takip edebileceği bir web uygulamasıdır.

## Özellikler

- Landmark ekleme, görüntüleme, güncelleme ve silme
- Ziyaret geçmişi kaydetme ve görüntüleme
- Not ekleme özelliği
- Kategorilere göre landmark filtreleme

## Kurulum

1. Projeyi klonlayın:
```bash
git clone [repo-url]
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. MongoDB'yi başlatın:
```bash
mongod
```

4. Uygulamayı başlatın:
```bash
npm start
```

## API Endpoints

### Landmarks
- `GET /api/landmarks` - Tüm landmarkları getir
- `POST /api/landmarks` - Yeni landmark ekle
- `GET /api/landmarks/:id` - Belirli bir landmarkı getir
- `PUT /api/landmarks/:id` - Landmark güncelle
- `DELETE /api/landmarks/:id` - Landmark sil

### Visited Landmarks
- `GET /api/visited` - Tüm ziyaretleri getir
- `POST /api/visited` - Yeni ziyaret ekle
- `GET /api/visited/landmark/:id` - Belirli bir landmarkın ziyaret geçmişini getir

## Teknolojiler

- Node.js
- Express.js
- MongoDB
- Mongoose
- JavaScript
- HTML/CSS 