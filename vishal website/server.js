const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: 'password.env' }); // Load from password.env

const app = express();
let isAdminLOggedIn=false;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barbershop';

// Define models BEFORE connecting
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    services: [{ type: String, required: true }],
    price: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, default: 'confirmed' },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Admin = mongoose.model('Admin', adminSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        try {
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || '1234';
            
            let existingAdmin = await Admin.findOne({ username: adminUsername });
            if (!existingAdmin) {
                // Create new admin if doesn't exist
                await Admin.create({ username: adminUsername, password: adminPassword });
                console.log(`✅ Admin created (user: ${adminUsername}, pass: ${adminPassword})`);
            } else if (existingAdmin.password !== adminPassword) {
                // Update password if it doesn't match
                existingAdmin.password = adminPassword;
                await existingAdmin.save();
                console.log(`✅ Admin password updated (user: ${adminUsername}, pass: ${adminPassword})`);
            } else {
                console.log('✅ Admin verified:', existingAdmin.username);
            }
        } catch (adminErr) {
            console.error('Admin setup error:', adminErr.message);
        }
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️ Running without database - bookings will not persist');
    });

// Routes

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const { date } = req.query;
        const query = date ? { date } : {};
        const bookings = await Booking.find(query).sort({ date: 1, time: 1 });
        console.log('📋 Found bookings:', bookings.length);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error.message);
        // Return empty array instead of error
        res.json([]);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});


// Create booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, phone, services, date, time } = req.body;
        
        // Validate required fields
        if (!name || !phone || !services || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check slot availability
        const existingBookings = await Booking.find({ date, time });
        if (existingBookings.length >= 5) {
            return res.status(400).json({ error: 'This time slot is full' });
        }
        
        // Calculate total price from services
        const servicesPriceMap = {
            "Garnier colour": 249,
            "Herbal gel colour": 349,
            "Streax colour": 299,
            "Loreal majirel colour": 499,
            "Loreal Inoa colour": 599,
            "Hair cut": 299,
            "Shave": 99,
            "Scrub": 249,
            "Oil massage": 299,
            "Detan": 449,
            "Face massage": 299,
            "O3+ Detan": 499,
            "Hair spa": 499,
            "Facial O3+": 999,
            "Facial VLCC": 899,
            "Facial Lotus": 799,
            "Fruit facial": 849
        };
        
        let totalPrice = 0;
        if (Array.isArray(services)) {
            services.forEach(serviceName => {
                totalPrice += servicesPriceMap[serviceName] || 0;
            });
        }
        
        const booking = new Booking({ 
            name, 
            phone, 
            services,
            price: totalPrice,
            date, 
            time 
        });
        
        const savedBooking = await booking.save();
        console.log('✅ Booking created:', savedBooking._id);
        res.status(201).json(savedBooking);
    } catch (error) {
        console.error('Booking error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin login 
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 Login attempt - Username:', username);

        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            console.log('❌ Username not found:', username);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (admin.password === password) {
            console.log('✅ Login successful for:', username);
            res.json({ success: true });
        } else {
            console.log('❌ Password mismatch for user:', username);
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: error.message });
    }
});
 
app.post('/api/admin/change', async (req, res) => {
    try {
        const { newUsername, newPassword } = req.body;

        let admin = await Admin.findOne();

        if (!admin) {
            admin = new Admin({
                username: newUsername,
                password: newPassword
            });
        } else {
            admin.username = newUsername;
            admin.password = newPassword;
        }

        await admin.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/create-admin', async (req, res) => {
    // Security: require a secret token to prevent unauthorized resets
    const ADMIN_RESET_TOKEN = process.env.ADMIN_RESET_TOKEN || 'your-secret-token-here';
    
    if (!req.query.token || req.query.token !== ADMIN_RESET_TOKEN) {
        return res.status(403).json({ error: 'Unauthorized - Invalid or missing token' });
    }
    
    try {
        await Admin.deleteMany({}); // reset
        await Admin.create({
            username: 'admin',
            password: '1234'
        });
        res.json({ success: true, message: 'Admin credentials reset to admin/1234' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Serve frontend

app.post('/api/admin/logout', (req, res) => {
    isAdminLoggedIn = false;
    res.json({ success: true });
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
