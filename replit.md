# BT Life Style Salon - Barbershop Booking System

## Project Overview
A full-stack salon/barbershop appointment booking web application for BT Life Style Salon in Bengaluru, India.

## Architecture
- **Backend**: Node.js + Express.js (server running in `vishal website/server.js`)
- **Frontend**: Vanilla HTML/CSS/JavaScript (served as static files from `vishal website/public/`)
- **Database**: PostgreSQL via Sequelize ORM (Replit's built-in PostgreSQL)
- **Port**: 5000 (bound to 0.0.0.0)

## Project Structure
```
vishal website/
├── server.js         # Main Express server (entry point)
├── password.env      # Environment config (dotenv)
├── public/
│   ├── index.html    # Single-page app with all views
│   ├── script.js     # Frontend logic (API calls, view switching)
│   └── styles.css    # Styling
└── package.json      # Dependencies
```

## Key Features
- Customer booking form (name, phone, services, date, time)
- 5 bookings max per time slot
- Admin dashboard (login required) to view/delete bookings
- Admin credential management
- Pricing calculated from service selection

## Default Admin Credentials
- Username: `admin`
- Password: `1234`
(Set via ADMIN_USERNAME / ADMIN_PASSWORD environment variables)

## Running the App
The workflow command is: `cd 'vishal website' && node server.js`

## Database
Uses Replit's built-in PostgreSQL. Tables are auto-created via Sequelize sync on startup.
- `Bookings` table - appointment records
- `Admins` table - admin credentials
