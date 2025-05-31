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
function initializeCityDropdowns() {
    turkishCities.forEach(city => {
        const fromOption = document.createElement('option');
        fromOption.value = city;
        fromOption.textContent = city;
        fromCitySelect.appendChild(fromOption);

        const toOption = document.createElement('option');
        toOption.value = city;
        toOption.textContent = city;
        toCitySelect.appendChild(toOption);
    });
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
        // In a real application, this would be an API call
        const response = await fetch(`/api/flights?from=${fromCity}&to=${toCity}&date=${date}`);
        const flights = await response.json();
        
        displayFlights(flights);
    } catch (error) {
        console.error('Error fetching flights:', error);
        // For demo purposes, show mock data
        displayMockFlights(fromCity, toCity, date);
    }
}

// Display flights in the grid
function displayFlights(flights) {
    flightsList.innerHTML = '';
    
    flights.forEach(flight => {
        const flightCard = document.createElement('div');
        flightCard.className = 'flight-card';
        flightCard.innerHTML = `
            <h3>${flight.from} → ${flight.to}</h3>
            <p>Departure: ${new Date(flight.departureTime).toLocaleString()}</p>
            <p>Arrival: ${new Date(flight.arrivalTime).toLocaleString()}</p>
            <p>Price: ₺${flight.price}</p>
            <p>Available Seats: ${flight.seatsAvailable}</p>
            <button onclick="openBookingModal('${flight.id}')" class="search-btn">Book Now</button>
        `;
        flightsList.appendChild(flightCard);
    });
}

// Display mock flights for demo
function displayMockFlights(fromCity, toCity, date) {
    const mockFlights = [
        {
            id: '1',
            from: fromCity,
            to: toCity,
            departureTime: new Date(date + 'T10:00:00'),
            arrivalTime: new Date(date + 'T12:00:00'),
            price: 1500,
            seatsAvailable: 45
        },
        {
            id: '2',
            from: fromCity,
            to: toCity,
            departureTime: new Date(date + 'T14:00:00'),
            arrivalTime: new Date(date + 'T16:00:00'),
            price: 1800,
            seatsAvailable: 32
        }
    ];
    
    displayFlights(mockFlights);
}

// Open booking modal
function openBookingModal(flightId) {
    bookingModal.style.display = 'block';
    bookingForm.dataset.flightId = flightId;
}

// Handle booking submission
async function handleBooking(e) {
    e.preventDefault();
    
    const flightId = bookingForm.dataset.flightId;
    const passengerName = document.getElementById('passengerName').value;
    const passengerSurname = document.getElementById('passengerSurname').value;
    const passengerEmail = document.getElementById('passengerEmail').value;
    const seatNumber = document.getElementById('seatNumber').value;

    const bookingData = {
        flightId,
        passengerName,
        passengerSurname,
        passengerEmail,
        seatNumber
    };

    try {
        // In a real application, this would be an API call
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            alert('Booking successful! Check your email for the ticket.');
            bookingModal.style.display = 'none';
            bookingForm.reset();
        } else {
            throw new Error('Booking failed');
        }
    } catch (error) {
        console.error('Error booking flight:', error);
        alert('Failed to book flight. Please try again.');
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