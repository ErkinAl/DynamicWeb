(function() {
// API base URL
const API_BASE_URL = 'http://localhost:3000/api';
console.log('API Base URL:', API_BASE_URL);

// DOM Elements
console.log('Initializing DOM elements...');
const adminLink = document.getElementById('adminLink');
const loginForm = document.getElementById('adminLoginForm');
const adminPanel = document.getElementById('adminPanel');
const flightsList = document.getElementById('flightsList');
const addFlightForm = document.getElementById('addFlightForm');
const editFlightForm = document.getElementById('editFlightForm');
const logoutBtn = document.getElementById('logoutBtn');
const adminModal = document.getElementById('adminModal');

// Log the state of each DOM element
console.log('DOM Elements Status:', {
    adminLink: adminLink ? 'Found' : 'Not Found',
    loginForm: loginForm ? 'Found' : 'Not Found',
    adminPanel: adminPanel ? 'Found' : 'Not Found',
    flightsList: flightsList ? 'Found' : 'Not Found',
    addFlightForm: addFlightForm ? 'Found' : 'Not Found',
    editFlightForm: editFlightForm ? 'Found' : 'Not Found',
    logoutBtn: logoutBtn ? 'Found' : 'Not Found',
    adminModal: adminModal ? 'Found' : 'Not Found'
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing admin functionality');
    
    // Handle admin link click
    if (adminLink) {
        console.log('Admin link found, adding click listener');
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Admin link clicked');
            const token = localStorage.getItem('adminToken');
            console.log('Current admin token:', token ? 'Present' : 'Not Present');
            
            if (token) {
                console.log('Token found, redirecting to admin.html');
                window.location.href = 'admin.html';
            } else {
                if (adminModal) {
                    console.log('No token found, showing admin modal');
                    console.log('Current modal display style:', adminModal.style.display);
                    adminModal.style.display = 'block';
                    console.log('New modal display style:', adminModal.style.display);
                } else {
                    console.error('Admin modal not found in DOM');
                }
            }
        });
    } else {
        console.error('Admin link not found in DOM');
    }

    // Handle login form submission
    if (loginForm) {
        console.log('Login form found, adding submit listener');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found in DOM');
    }

    // Handle modal close buttons
    const closeButtons = document.getElementsByClassName('close');
    console.log('Found close buttons:', closeButtons.length);
    Array.from(closeButtons).forEach((button, index) => {
        console.log(`Adding click listener to close button ${index + 1}`);
        button.addEventListener('click', () => {
            console.log(`Close button ${index + 1} clicked`);
            const modal = button.closest('.modal');
            if (modal) {
                console.log('Closing modal');
                modal.style.display = 'none';
            } else {
                console.error('Could not find parent modal for close button');
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            console.log('Clicked outside modal, closing');
            e.target.style.display = 'none';
        }
    });

    initializeAdminCityDropdowns();
});

// Handle admin login
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log('Login attempt with username:', username);

    try {
        console.log('Sending login request to:', `${API_BASE_URL}/admin/login`);
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Login response status:', response.status);
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        console.log('Login successful, received token');
        localStorage.setItem('adminToken', data.token);
        console.log('Token stored in localStorage');
        window.location.href = 'admin.html';
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    }
}

// Check if admin is logged in
function checkAuth() {
    console.log('Checking admin authentication');
    const token = localStorage.getItem('adminToken');
    console.log('Token status:', token ? 'Present' : 'Not Present');
    
    if (!token) {
        console.log('No token found, redirecting to admin.html');
        window.location.href = 'admin.html';
        return;
    }
    console.log('Token found, loading flights');
    loadFlights();
}

// Load flights
async function loadFlights() {
    console.log('Loading flights...');
    try {
        const response = await fetch(`${API_BASE_URL}/flights`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        console.log('Flights response status:', response.status);
        if (!response.ok) {
            throw new Error('Failed to fetch flights');
        }

        const flights = await response.json();
        console.log('Flights loaded successfully:', flights.length, 'flights found');
        displayFlights(flights);
    } catch (error) {
        console.error('Error loading flights:', error);
        alert('Failed to load flights. Please try again.');
    }
}

// Display flights in the table
function displayFlights(flights) {
    flightsList.innerHTML = '';
    
    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.from_city.city_name}</td>
            <td>${flight.to_city.city_name}</td>
            <td>${new Date(flight.departure_time).toLocaleString()}</td>
            <td>${new Date(flight.arrival_time).toLocaleString()}</td>
            <td>₺${flight.price}</td>
            <td>${flight.seats_available}</td>
            <td>
                <button onclick="editFlight('${flight._id}')" class="edit-btn">Edit</button>
                <button onclick="deleteFlight('${flight._id}')" class="delete-btn">Delete</button>
            </td>
        `;
        flightsList.appendChild(row);
    });
}

// Add new flight
async function handleAddFlight(e) {
    e.preventDefault();
    
    const seatsTotal = document.getElementById('seatsAvailable').value;
    const flightData = {
        from_city: document.getElementById('fromCity').value,
        to_city: document.getElementById('toCity').value,
        departure_time: document.getElementById('departureTime').value,
        arrival_time: document.getElementById('arrivalTime').value,
        price: document.getElementById('price').value,
        seats_total: seatsTotal,
        seats_available: seatsTotal
    };

    try {
        const response = await fetch(`${API_BASE_URL}/flights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(flightData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add flight');
        }

        alert('Flight added successfully');
        addFlightForm.reset();
        loadFlights();
    } catch (error) {
        console.error('Error adding flight:', error);
        alert(error.message || 'Failed to add flight. Please try again.');
    }
}

// Edit flight
async function editFlight(flightId) {
    try {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flight details');
        }

        const flight = await response.json();
        
        document.getElementById('editFlightId').value = flight._id;
        document.getElementById('editFromCity').value = flight.from_city.city_name;
        document.getElementById('editToCity').value = flight.to_city.city_name;
        document.getElementById('editDepartureTime').value = flight.departure_time;
        document.getElementById('editArrivalTime').value = flight.arrival_time;
        document.getElementById('editPrice').value = flight.price;
        document.getElementById('editSeatsAvailable').value = flight.seats_available;
        
        document.getElementById('editFlightModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching flight details:', error);
        alert('Failed to load flight details. Please try again.');
    }
}

// Handle flight update
async function handleUpdateFlight(e) {
    e.preventDefault();
    
    const flightId = document.getElementById('editFlightId').value;
    const seatsTotal = document.getElementById('editSeatsAvailable').value;
    const flightData = {
        from_city: document.getElementById('editFromCity').value,
        to_city: document.getElementById('editToCity').value,
        departure_time: document.getElementById('editDepartureTime').value,
        arrival_time: document.getElementById('editArrivalTime').value,
        price: document.getElementById('editPrice').value,
        seats_total: seatsTotal,
        seats_available: seatsTotal
    };

    try {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(flightData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update flight');
        }

        alert('Flight updated successfully');
        document.getElementById('editFlightModal').style.display = 'none';
        loadFlights();
    } catch (error) {
        console.error('Error updating flight:', error);
        alert(error.message || 'Failed to update flight. Please try again.');
    }
}

// Delete flight
async function deleteFlight(flightId) {
    if (!confirm('Are you sure you want to delete this flight?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete flight');
        }

        alert('Flight deleted successfully');
        loadFlights();
    } catch (error) {
        console.error('Error deleting flight:', error);
        alert('Failed to delete flight. Please try again.');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// Event Listeners
if (addFlightForm) {
    addFlightForm.addEventListener('submit', handleAddFlight);
}

if (editFlightForm) {
    editFlightForm.addEventListener('submit', handleUpdateFlight);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

// Initialize admin panel if on admin page
if (adminPanel) {
    console.log('Admin panel found, initializing...');
    checkAuth();
} else {
    console.log('Not on admin panel page');
}

// --- City Dropdown Initialization for Admin Panel ---
async function initializeAdminCityDropdowns() {
    const fromCitySelect = document.getElementById('fromCity');
    const toCitySelect = document.getElementById('toCity');
    const editFromCitySelect = document.getElementById('editFromCity');
    const editToCitySelect = document.getElementById('editToCity');
    if (!fromCitySelect || !toCitySelect) return;
    try {
        const response = await fetch(`${API_BASE_URL}/flights/cities`);
        const cities = await response.json();
        cities.forEach(city => {
            const fromOption = document.createElement('option');
            fromOption.value = city.city_name;
            fromOption.textContent = city.city_name;
            fromCitySelect.appendChild(fromOption);
            if (editFromCitySelect) {
                const editFromOption = document.createElement('option');
                editFromOption.value = city.city_name;
                editFromOption.textContent = city.city_name;
                editFromCitySelect.appendChild(editFromOption);
            }
            const toOption = document.createElement('option');
            toOption.value = city.city_name;
            toOption.textContent = city.city_name;
            toCitySelect.appendChild(toOption);
            if (editToCitySelect) {
                const editToOption = document.createElement('option');
                editToOption.value = city.city_name;
                editToOption.textContent = city.city_name;
                editToCitySelect.appendChild(editToOption);
            }
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities. Please refresh the page.');
    }
}

window.editFlight = editFlight;
window.deleteFlight = deleteFlight;
})(); 