const services = [
    { name: "Garnier colour", price: 249 },
    { name: "Herbal gel colour", price: 349 },
    { name: "Streax colour", price: 299 },
    { name: "Loreal majirel colour", price: 499 },
    { name: "Loreal Inoa colour", price: 599 },
    { name: "Hair cut", price: 299 },
    { name: "Shave", price: 99 },
    { name: "Scrub", price: 249 },
    { name: "Oil massage", price: 299 },
    { name: "Detan", price: 449 },
    { name: "Face massage", price: 299 },
    { name: "O3+ Detan", price: 499 },
    { name: "Hair spa", price: 499 },
    { name: "Facial O3+", price: 999 },
    { name: "Facial VLCC", price: 899 },
    { name: "Facial Lotus", price: 799 },
    { name: "Fruit facial", price: 849 }
];
const API_URL = window.location.origin;
const MAX_SLOTS_PER_HOUR = 5;
let isAdminAuthenticated = false;
let selectedServices = [];

// Debug logging
console.log('🚀 Script loaded at', new Date().toLocaleTimeString());
console.log('🌐 API_URL:', API_URL);
console.log('📍 Current page:', window.location.pathname);

function initializeApp() {
    console.log('🚀 Initializing app...');
    populateServices();
    setupEventListeners();
    setMinDate();
    checkAdminAuth();
    console.log('✅ App initialized. Admin authenticated:', isAdminAuthenticated);
}


function populateServices() {
  const dropdownList = document.getElementById("dropdown-list");

  dropdownList.innerHTML = "";

  services.forEach(service => {
    const label = document.createElement("label");

    label.innerHTML = `
      <input type="checkbox" value="${service.name}">
      ${service.name} - ₹${service.price}
    `;

    dropdownList.appendChild(label);
  });
}

function setupEventListeners() {
    console.log('📌 setupEventListeners called');
    
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        console.log('✅ Found adminLoginForm, attaching listener');
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    } else {
        console.warn('❌ adminLoginForm NOT found - form submission will not work!');
    }
    
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('bookingDate').addEventListener('change', updateTimeSlots);
    document.getElementById('filterDate').addEventListener('change', displayBookings);
    
    // Checkbox service selector
    document.addEventListener("change", function (e) {
      if (e.target.matches("#dropdown-list input[type='checkbox']")) {
        const value = e.target.value;
        if (e.target.checked) {
          selectedServices.push(value);
        } else {
          const index = selectedServices.indexOf(value);
          if (index > -1) selectedServices.splice(index, 1);
        }
        updateDropdownText();
      }
    });
    
    document.addEventListener("DOMContentLoaded", function () {
      initializeApp();
    });
}
function toggleDropdown() {
  const list = document.getElementById("dropdown-list");
  list.style.display = list.style.display === "block";
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').setAttribute('min', today);
    document.getElementById('filterDate').setAttribute('min', today);
}

function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
}

async function updateTimeSlots() {
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('bookingTime');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) return;
    
    timeSelect.innerHTML = '<option value="">Loading...</option>';
    
    try {
        const response = await fetch(`${API_URL}/api/bookings?date=${selectedDate}`);
        const bookings = await response.json();
        const allSlots = generateTimeSlots();
        
        timeSelect.innerHTML = '<option value="">Select a time</option>';
        
        allSlots.forEach(slot => {
            const bookedCount = bookings.filter(b => b.time === slot).length;
            
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = `${slot} (${bookedCount}/${MAX_SLOTS_PER_HOUR} booked)`;
            
            if (bookedCount >= MAX_SLOTS_PER_HOUR) {
                option.disabled = true;
                option.textContent += ' - FULL';
            }
            
            timeSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading time slots', 'error');
        timeSelect.innerHTML = '<option value="">Error loading slots</option>';
    }
}

async function handleBooking(e) {
  e.preventDefault();

  const nameEl = document.getElementById("customerName");
  const phoneEl = document.getElementById("customerPhone");
  const dateEl = document.getElementById("bookingDate");
  const timeEl = document.getElementById("bookingTime");

  const name = nameEl.value;
  const phone = phoneEl.value;
  const date = dateEl.value;
  const time = timeEl.value;

  // Use the global selectedServices array
  const booking = {
    name,
    phone,
    services: selectedServices,
    date,
    time
  };

  try {
    const response = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Booking failed');
    }
    
    const result = await response.json();
    showMessage(`✅ Booking confirmed for ${name} on ${date} at ${time}!`, 'success');
    document.getElementById('bookingForm').reset();
    updateTimeSlots();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function updateDropdownText() {
  const btn = document.querySelector(".checkbox-group");

  if (!btn) return; // Exit if button doesn't exist

  if (selectedServices.length === 0) {
    btn.textContent = "Select Services";
  } else {
    btn.textContent = selectedServices.join(", ");
  }
}

async function displayBookings() {
    console.log('📥 displayBookings called');
    const bookingsList = document.getElementById('bookingsList');
    
    if (!bookingsList) {
        console.error('❌ #bookingsList not found in DOM');
        return;
    }
    
    try {
        const url = `${API_URL}/api/bookings`;
        console.log('🔗 Fetching:', url);
        
        const response = await fetch(url);
        console.log('📬 Response:', response.status);
        
        const bookings = await response.json();
        console.log('✅ Bookings:', bookings);
        
        if (!Array.isArray(bookings) || bookings.length === 0) {
            bookingsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">No bookings found. Create one to see it here.</p>';
            return;
        }
        
        let html = '<div>';
        bookings.forEach(b => {
            const svc = Array.isArray(b.services) ? b.services.join(', ') : 'N/A';
            html += `<div style="padding: 10px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #3b2a1a;">
                <strong>${b.name}</strong> | 📞 ${b.phone}<br/>
                📅 ${b.date} at ${b.time}<br/>
                ✂️ ${svc} | 💰 ₹${b.price || 0}
            </div>`;
        });
        html += '</div>';
        bookingsList.innerHTML = html;
        console.log('✅ Rendered', bookings.length, 'bookings');
    } catch (error) {
        console.error('❌ Error:', error);
        bookingsList.innerHTML = `<div style="padding: 15px; background: #ffebee; border-radius: 4px; color: #c62828;">
            <strong>Error:</strong> ${error.message}
        </div>`;
    }
}

async function deleteBooking(id) {
    if (!confirm('Delete this booking?')) return;
    
    try {
        await fetch(`${API_URL}/api/bookings/${id}`, { method: 'DELETE' });
        showMessage('Booking deleted', 'success');
        displayBookings();
    } catch (error) {
        showMessage('Error deleting booking', 'error');
    }
}

function checkAdminAuth() {
    isAdminAuthenticated = sessionStorage.getItem("adminAuth") === "true";
    console.log('🔐 checkAdminAuth: isAdminAuthenticated =', isAdminAuthenticated);
}

async function logout() {
    sessionStorage.removeItem("adminAuth");
    isAdminAuthenticated = false;
    showHomeView();
}
function showHomeView() {
    ['homeView', 'customerView', 'adminView', 'adminLoginView'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    ['homeBtn', 'customerBtn', 'adminBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const homeViewEl = document.getElementById('homeView');
    if (homeViewEl) {
        homeViewEl.classList.add('active');
        homeViewEl.style.display = 'block';
    }
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) homeBtn.classList.add('active');
    window.scrollTo(0, 0);
}

function showCustomerView() {
    ['homeView', 'customerView', 'adminView', 'adminLoginView'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    ['homeBtn', 'customerBtn', 'adminBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const customerViewEl = document.getElementById('customerView');
    if (customerViewEl) {
        customerViewEl.classList.add('active');
        customerViewEl.style.display = 'block';
    }
    const customerBtn = document.getElementById('customerBtn');
    if (customerBtn) customerBtn.classList.add('active');
    window.scrollTo(0, 0);
}

function showAdminView() {
    
    console.log('📋 showAdminView called. isAdminAuthenticated:', isAdminAuthenticated);
    if (!isAdminAuthenticated) {
        console.log('❌ Not authenticated, showing login page');
        showAdminLogin();
        return;
    }
    console.log('✅ Authenticated, showing admin dashboard');
    ['homeView', 'customerView', 'adminView', 'adminLoginView'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    ['homeBtn', 'customerBtn', 'adminBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const adminViewEl = document.getElementById('adminView');
    if (adminViewEl) {
        adminViewEl.classList.add('active');
        adminViewEl.style.display = 'block'; // Force visible
    }
    const adminBtnEl = document.getElementById('adminBtn');
    if (adminBtnEl) {
        adminBtnEl.classList.add('active');
    }
    window.scrollTo(0, 0);
    setTimeout(() => {
        console.log('✅ Showing admin view and loading bookings');
        displayBookings();
    }, 100);
}

function showAdminLogin() {
    console.log('📍 showAdminLogin called');
    ['homeView', 'customerView', 'adminView', 'adminLoginView'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    ['homeBtn', 'customerBtn', 'adminBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const loginViewEl = document.getElementById('adminLoginView');
    console.log('adminLoginView element:', loginViewEl ? '✅ Found' : '❌ Not found');
    if (loginViewEl) {
        loginViewEl.classList.add('active');
        loginViewEl.style.display = 'block'; // Force visible
        console.log('✅ Added active class and forced display:block to adminLoginView');
        console.log('adminLoginView computed style display:', window.getComputedStyle(loginViewEl).display);
    }
    const adminBtnEl = document.getElementById('adminBtn');
    if (adminBtnEl) {
        adminBtnEl.classList.add('active');
    }
    window.scrollTo(0, 0);
}

async function handleAdminLogin(e) {
    e.preventDefault();
    console.log('🔐 handleAdminLogin: Form submitted');
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    console.log('📝 Credentials entered - Username:', username);
    
    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('🔗 Login response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Login failed with status:', response.status);
            throw new Error('Invalid credentials');
        }
        
        console.log('✅ Login successful');
        isAdminAuthenticated = true;
        sessionStorage.setItem('adminAuth', 'true');
        showAdminView();
    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage('Invalid username or password', 'error');
    }
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    const form = document.getElementById('bookingForm');
    form.parentNode.insertBefore(messageDiv, form);
    window.scrollTo(0, 0);
    setTimeout(() => messageDiv.remove(), 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("changeAdminForm");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const newUsername = document.getElementById("newUsername").value;
            const newPassword = document.getElementById("newPassword").value;

            const res = await fetch('/api/admin/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newUsername, newPassword })
            });

            const data = await res.json();

            if (data.success) {
                alert("Credentials updated! Login again.");
                logout();
            } else {
                alert("Error updating credentials");
            }
        });
    }
});

// Health check
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            console.log('✅ Server is running');
            return true;
        }
    } catch (e) {
        console.warn('⚠️ Server might not be running:', e.message);
    }
    return false;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('🎬 DOM loaded,initializing...');
    checkServerHealth();
    initializeApp();
});