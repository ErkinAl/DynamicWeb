const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Flight = require('../models/Flight');
const { sendTicketEmail } = require('../utils/email');

// Book a ticket
router.post('/', async (req, res) => {
    try {
        const { flightId, passengerName, passengerSurname, passengerEmail, seatNumber } = req.body;

        // Check if flight exists and has available seats
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.seats_available <= 0) {
            return res.status(400).json({ message: 'No seats available for this flight' });
        }

        // Create ticket
        const ticket = new Ticket({
            passenger_name: passengerName,
            passenger_surname: passengerSurname,
            passenger_email: passengerEmail,
            flight: flightId,
            seat_number: seatNumber
        });

        // Update flight seats
        flight.seats_available -= 1;
        await flight.save();

        // Save ticket
        const newTicket = await ticket.save();

        // Send email with ticket details
        try {
            await sendTicketEmail(newTicket);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get tickets by email
router.get('/:email', async (req, res) => {
    try {
        const tickets = await Ticket.find({ passenger_email: req.params.email })
            .populate({
                path: 'flight',
                populate: [
                    { path: 'from_city', select: 'city_name' },
                    { path: 'to_city', select: 'city_name' }
                ]
            })
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 