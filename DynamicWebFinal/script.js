// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Turkish cities array
const turkishCities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

// DOM Elements
const fromCitySelect = document.getElementById('fromCity');
const toCitySelect = document.getElementById('toCity');
const departureDateInput = document.getElementById('departureDate');
const searchForm = document.getElementById('searchForm');
const flightsList = document.getElementById('flightsList');
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const closeButtons = document.querySelectorAll('.close');

// Initialize city dropdowns
async function initializeCityDropdowns() {
    try {
        const response = await fetch(`${API_BASE_URL}/flights/cities`);
        const cities = await response.json();
        
        cities.forEach(city => {
            const fromOption = document.createElement('option');
            fromOption.value = city.city_name;
            fromOption.textContent = city.city_name;
            fromCitySelect.appendChild(fromOption);

            const toOption = document.createElement('option');
            toOption.value = city.city_name;
            toOption.textContent = city.city_name;
            toCitySelect.appendChild(toOption);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities. Please refresh the page.');
    }
}

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    departureDateInput.min = today;
}

// Handle flight search
async function handleFlightSearch(e) {
    e.preventDefault();
    
    const fromCity = fromCitySelect.value;
    const toCity = toCitySelect.value;
    const date = departureDateInput.value;

    if (!fromCity || !toCity || !date) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/flights?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}&date=${date}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch flights');
        }

        const flights = await response.json();
        displayFlights(flights);
    } catch (error) {
        console.error('Error fetching flights:', error);
        alert('Failed to fetch flights. Please try again.');
    }
}

// Display flights in the grid
function displayFlights(flights) {
    flightsList.innerHTML = '';
    
    if (flights.length === 0) {
        flightsList.innerHTML = '<p class="no-flights">No flights found for the selected criteria.</p>';
        return;
    }
    
    flights.forEach(flight => {
        const flightCard = document.createElement('div');
        flightCard.className = 'flight-card';
        flightCard.innerHTML = `
            <h3>${flight.from_city.city_name} → ${flight.to_city.city_name}</h3>
            <p>Departure: ${new Date(flight.departure_time).toLocaleString()}</p>
            <p>Arrival: ${new Date(flight.arrival_time).toLocaleString()}</p>
            <p>Price: ₺${flight.price}</p>
            <p>Total Seats: ${flight.seats_total}</p>
            <p>Available Seats: ${flight.seats_available} / ${flight.seats_total}</p>
            <button onclick="openBookingModal('${flight._id}')" class="search-btn" ${flight.seats_available <= 0 ? 'disabled' : ''}>
                ${flight.seats_available <= 0 ? 'No Seats Available' : 'Book Now'}
            </button>
        `;
        flightsList.appendChild(flightCard);
    });
}

// Open booking modal
async function openBookingModal(flightId) {
    try {
        // Fetch flight details to get total seats
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch flight details');
        }
        const flight = await response.json();

        // Fetch booked seats for this flight
        const ticketsResponse = await fetch(`${API_BASE_URL}/tickets/flight/${flightId}`);
        if (!ticketsResponse.ok) {
            throw new Error('Failed to fetch booked seats');
        }
        const tickets = await ticketsResponse.json();
        const bookedSeats = tickets.map(ticket => ticket.seat_number);

        // Generate seat grid
        const seatGrid = document.getElementById('seatGrid');
        seatGrid.innerHTML = '';
        
        for (let i = 1; i <= flight.seats_total; i++) {
            const seat = document.createElement('div');
            seat.className = `seat ${bookedSeats.includes(i.toString()) ? 'occupied' : 'available'}`;
            seat.textContent = i;
            
            if (!bookedSeats.includes(i.toString())) {
                seat.addEventListener('click', () => {
                    // Remove selected class from all seats
                    document.querySelectorAll('.seat').forEach(s => s.classList.remove('selected'));
                    // Add selected class to clicked seat
                    seat.classList.add('selected');
                    // Update hidden input
                    document.getElementById('seatNumber').value = i;
                });
            }
            
            seatGrid.appendChild(seat);
        }

        bookingModal.style.display = 'block';
        bookingForm.dataset.flightId = flightId;
    } catch (error) {
        console.error('Error opening booking modal:', error);
        alert('Failed to load seat selection. Please try again.');
    }
}

// Handle booking submission
async function handleBooking(e) {
    e.preventDefault();
    
    const flightId = bookingForm.dataset.flightId;
    const passengerName = document.getElementById('passengerName').value;
    const passengerSurname = document.getElementById('passengerSurname').value;
    const passengerEmail = document.getElementById('passengerEmail').value;
    const seatNumber = document.getElementById('seatNumber').value;

    if (!seatNumber) {
        alert('Please select a seat');
        return;
    }

    const bookingData = {
        flightId,
        passengerName,
        passengerSurname,
        passengerEmail,
        seatNumber
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Booking failed');
        }

        const result = await response.json();
        alert('Booking successful! Check your email for the ticket.');
        bookingModal.style.display = 'none';
        bookingForm.reset();
        
        // Refresh flight list to update available seats
        handleFlightSearch(new Event('submit'));
    } catch (error) {
        console.error('Error booking flight:', error);
        alert(error.message || 'Failed to book flight. Please try again.');
    }
}

// Close modal when clicking the close button or outside the modal
function closeModal(modal) {
    modal.style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeCityDropdowns();
    setMinDate();
});

searchForm.addEventListener('submit', handleFlightSearch);
bookingForm.addEventListener('submit', handleBooking);

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        closeModal(modal);
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
}); 