const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: 'password.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL Connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/barbershop';

const sequelize = new Sequelize(DATABASE_URL, {
    logging: false,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

// Define Models
const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    services: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'confirmed',
    },
}, {
    timestamps: true,
});

const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
});

// Connect to Database and Sync
sequelize.authenticate()
    .then(async () => {
        console.log('✅ PostgreSQL Connected');
        try {
            await sequelize.sync();
            console.log('✅ Database synced');

            // Create default admin if doesn't exist
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || '1234';

            const [admin, created] = await Admin.findOrCreate({
                where: { username: adminUsername },
                defaults: { password: adminPassword }
            });

            if (created) {
                console.log(`✅ Admin created (user: ${adminUsername}, pass: ${adminPassword})`);
            } else {
                // Update password if env changed
                if (admin.password !== adminPassword) {
                    admin.password = adminPassword;
                    await admin.save();
                    console.log(`✅ Admin password updated (user: ${adminUsername})`);
                } else {
                    console.log(`✅ Admin verified: ${adminUsername}`);
                }
            }
        } catch (err) {
            console.error('❌ Admin setup error:', err.message);
            console.error('❌ Stack:', err.stack);
        }
    })
    .catch(err => {
        console.error('❌ PostgreSQL connection error:', err.message);
        console.error('❌ Full error:', err);
        console.log('⚠️ Server will not function without database');
    });

// Routes

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const { date } = req.query;
        const where = date ? { date } : {};
        const bookings = await Booking.findAll({
            where,
            order: [['date', 'ASC'], ['time', 'ASC']],
        });
        console.log('📋 Found bookings:', bookings.length);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error.message);
        res.json([]);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = sequelize.connection ? '✅ Connected' : '❌ Disconnected';
    res.json({
        status: 'ok',
        timestamp: new Date(),
        database: dbStatus,
    });
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
        const existingBookings = await Booking.count({
            where: { date, time },
        });

        if (existingBookings >= 5) {
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

        const booking = await Booking.create({
            name,
            phone,
            services,
            price: totalPrice,
            date,
            time,
        });

        console.log('✅ Booking created:', booking.id);
        res.status(201).json(booking);
    } catch (error) {
        console.error('Booking error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await Booking.destroy({
            where: { id: req.params.id },
        });
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

        const admin = await Admin.findOne({ where: { username } });

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
        console.error('❌ Login error:', error.message);
        console.error('❌ Login error stack:', error.stack);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Change admin credentials
app.post('/api/admin/change', async (req, res) => {
    try {
        const { newUsername, newPassword } = req.body;

        let admin = await Admin.findOne({});

        if (!admin) {
            admin = await Admin.create({
                username: newUsername,
                password: newPassword,
            });
        } else {
            admin.username = newUsername;
            admin.password = newPassword;
            await admin.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset admin (with token protection)
app.get('/create-admin', async (req, res) => {
    try {
        const ADMIN_RESET_TOKEN = process.env.ADMIN_RESET_TOKEN || 'your-secret-token-here';

        if (!req.query.token || req.query.token !== ADMIN_RESET_TOKEN) {
            return res.status(403).json({ error: 'Unauthorized - Invalid or missing token' });
        }

        await Admin.destroy({ where: {} });
        await Admin.create({
            username: 'admin',
            password: '1234',
        });

        res.json({ success: true, message: 'Admin credentials reset to admin/1234' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    res.json({ success: true });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
