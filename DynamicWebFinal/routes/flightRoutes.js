const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const City = require('../models/City');
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');

// Get all flights
router.get('/', async (req, res) => {
    try {
        const { from, to, date } = req.query;
        let query = {};

        if (from) {
            const fromCity = await City.findOne({ city_name: from });
            if (fromCity) query.from_city = fromCity._id;
        }

        if (to) {
            const toCity = await City.findOne({ city_name: to });
            if (toCity) query.to_city = toCity._id;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.departure_time = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const flights = await Flight.find(query)
            .populate('from_city', 'city_name')
            .populate('to_city', 'city_name')
            .select('from_city to_city departure_time arrival_time price seats_total seats_available')
            .sort({ departure_time: 1 });

        res.json(flights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new flight (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const { from_city, to_city, departure_time, arrival_time, price, seats_total } = req.body;

        // Check if cities are the same
        if (from_city === to_city) {
            return res.status(400).json({ message: 'Departure and arrival cities cannot be the same' });
        }

        // Validate departure and arrival times
        const departureDate = new Date(departure_time);
        const arrivalDate = new Date(arrival_time);
        const currentDate = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

        // Check if departure time is in the past
        if (departureDate < currentDate) {
            return res.status(400).json({ message: 'Departure time cannot be in the past' });
        }

        // Check if departure time is too far in the future
        if (departureDate > oneYearFromNow) {
            return res.status(400).json({ message: 'Flights cannot be scheduled more than one year in advance' });
        }

        if (departureDate >= arrivalDate) {
            return res.status(400).json({ message: 'Departure time must be before arrival time' });
        }

        // Check if cities exist
        const fromCity = await City.findOne({ city_name: from_city });
        const toCity = await City.findOne({ city_name: to_city });

        if (!fromCity || !toCity) {
            return res.status(400).json({ message: 'Invalid city names' });
        }

        // Check flight scheduling rules
        const existingDeparture = await Flight.findOne({
            from_city: fromCity._id,
            departure_time: new Date(departure_time)
        });

        const existingArrival = await Flight.findOne({
            to_city: toCity._id,
            arrival_time: new Date(arrival_time)
        });

        if (existingDeparture) {
            return res.status(400).json({ message: 'Another flight is already departing from this city at the same time' });
        }

        if (existingArrival) {
            return res.status(400).json({ message: 'Another flight is already arriving at this city at the same time' });
        }

        const flight = new Flight({
            from_city: fromCity._id,
            to_city: toCity._id,
            departure_time,
            arrival_time,
            price,
            seats_total,
            seats_available: seats_total
        });

        const newFlight = await flight.save();
        res.status(201).json(newFlight);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update flight (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Check if cities are the same when updating
        if (req.body.from_city && req.body.to_city && req.body.from_city === req.body.to_city) {
            return res.status(400).json({ message: 'Departure and arrival cities cannot be the same' });
        }

        // Validate departure and arrival times if they are being updated
        if (req.body.departure_time && req.body.arrival_time) {
            const departureDate = new Date(req.body.departure_time);
            const arrivalDate = new Date(req.body.arrival_time);
            const currentDate = new Date();
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

            // Check if departure time is in the past
            if (departureDate < currentDate) {
                return res.status(400).json({ message: 'Departure time cannot be in the past' });
            }

            // Check if departure time is too far in the future
            if (departureDate > oneYearFromNow) {
                return res.status(400).json({ message: 'Flights cannot be scheduled more than one year in advance' });
            }

            if (departureDate >= arrivalDate) {
                return res.status(400).json({ message: 'Departure time must be before arrival time' });
            }
        }

        const { seats_total, seats_available } = req.body;

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'seats_available' && key !== 'seats_total') {
                flight[key] = req.body[key];
            }
        });

        // Handle seat updates
        if (seats_total !== undefined) {
            const seatDifference = seats_total - flight.seats_total;
            flight.seats_total = seats_total;
            flight.seats_available = seats_available;
        }

        const updatedFlight = await flight.save();
        res.json(updatedFlight);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete flight (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Delete all tickets for this flight
        await Ticket.deleteMany({ flight: flight._id });

        // Delete the flight using deleteOne
        await Flight.deleteOne({ _id: flight._id });
        res.json({ message: 'Flight and related tickets deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all cities
router.get('/cities', async (req, res) => {
    try {
        const cities = await City.find().sort('city_name');
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: 'Error fetching cities' });
    }
});

// Get a single flight by ID
router.get('/:id', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id)
            .populate('from_city', 'city_name')
            .populate('to_city', 'city_name');
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }
        res.json(flight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 