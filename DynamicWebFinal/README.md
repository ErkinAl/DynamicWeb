# FlyTicket - Flight Booking System

A modern flight booking system built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- User-friendly flight search interface
- Real-time seat selection with visual seat map
- Admin panel for flight management
- Secure authentication system
- Email notifications for bookings
- Responsive design for all devices
- Real-time seat availability tracking
- City-based flight search
- Interactive booking process

## Project Structure

```
DynamicWebFinal/
├── index.html          # Main user interface
├── admin.html         # Admin panel interface
├── styles.css         # CSS styles
├── script.js          # Main JavaScript functionality
├── admin.js          # Admin panel functionality
├── server.js         # Express server setup
├── routes/           # API routes
│   ├── flightRoutes.js
│   ├── ticketRoutes.js
│   └── adminRoutes.js
├── models/           # MongoDB models
│   ├── Flight.js
│   ├── Ticket.js
│   ├── City.js
│   └── Admin.js
├── middleware/       # Custom middleware
│   └── auth.js
└── utils/           # Utility functions
    └── email.js
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file
   - Add required environment variables (MongoDB URI, JWT secret, etc.)
4. Start the server:
   ```bash
   npm start
   ```
5. Open `index.html` in your web browser

## Technologies Used

- **Frontend:**
  - HTML5
  - CSS3 (with CSS Variables and Flexbox/Grid)
  - Vanilla JavaScript (ES6+)
  - Google Fonts

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - JWT for authentication
  - Nodemailer for email notifications

## Features in Detail

### Flight Search
- City-based flight search
- Date-based filtering
- Real-time availability checking
- Price display

### Seat Selection
- Interactive seat map
- Real-time seat availability
- Visual feedback for seat selection
- Prevention of double booking

### Admin Panel
- Secure admin authentication
- Flight management (CRUD operations)
- Seat capacity management
- Booking overview

### Booking Process
- User-friendly booking form
- Seat selection interface
- Email confirmation
- Booking validation

### Security Features
- JWT-based authentication
- Secure admin routes
- Input validation
- Error handling

## API Endpoints

### Flights
- `GET /api/flights` - Get all flights
- `GET /api/flights/:id` - Get flight by ID
- `POST /api/flights` - Create new flight (admin)
- `PUT /api/flights/:id` - Update flight (admin)
- `DELETE /api/flights/:id` - Delete flight (admin)

### Tickets
- `POST /api/tickets` - Book a ticket
- `GET /api/tickets/:email` - Get tickets by email
- `GET /api/tickets/flight/:flightId` - Get tickets by flight

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/flights` - Get all flights (admin)

## Contributing

Feel free to fork this project and make your own changes. Pull requests are welcome!
