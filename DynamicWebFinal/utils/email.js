const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send ticket email
async function sendTicketEmail(ticket) {
    const populatedTicket = await ticket.populate({
        path: 'flight',
        populate: [
            { path: 'from_city', select: 'city_name' },
            { path: 'to_city', select: 'city_name' }
        ]
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: ticket.passenger_email,
        subject: 'Your Flight Ticket - FlyTicket',
        html: `
            <h1>Flight Ticket Confirmation</h1>
            <p>Dear ${ticket.passenger_name} ${ticket.passenger_surname},</p>
            <p>Your flight has been booked successfully. Here are your ticket details:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                <h2>Flight Details</h2>
                <p><strong>From:</strong> ${populatedTicket.flight.from_city.city_name}</p>
                <p><strong>To:</strong> ${populatedTicket.flight.to_city.city_name}</p>
                <p><strong>Departure:</strong> ${new Date(populatedTicket.flight.departure_time).toLocaleString()}</p>
                <p><strong>Arrival:</strong> ${new Date(populatedTicket.flight.arrival_time).toLocaleString()}</p>
                <p><strong>Seat Number:</strong> ${ticket.seat_number || 'Not assigned'}</p>
                <p><strong>Ticket ID:</strong> ${ticket._id}</p>
            </div>
            <p>Thank you for choosing FlyTicket!</p>
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendTicketEmail
}; 