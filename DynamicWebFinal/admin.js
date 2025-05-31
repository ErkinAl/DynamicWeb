// DOM Elements
const adminLink = document.getElementById('adminLink');
const adminModal = document.getElementById('adminModal');
const adminLoginForm = document.getElementById('adminLoginForm');

// Admin credentials (in a real application, this would be handled by the backend)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123' // In a real application, this would be hashed
};

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // In a real application, this would set a session token
        localStorage.setItem('adminLoggedIn', 'true');
        window.location.href = '/admin-dashboard.html';
    } else {
        alert('Invalid credentials');
    }
}

// Check if admin is logged in
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        window.location.href = '/admin-dashboard.html';
    }
}

// Event Listeners
adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    adminModal.style.display = 'block';
});

adminLoginForm.addEventListener('submit', handleAdminLogin);

// Check admin login status on page load
document.addEventListener('DOMContentLoaded', checkAdminLogin); 