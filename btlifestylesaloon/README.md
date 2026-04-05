# Barbershop Booking System

A production-ready barbershop booking website with backend database.

## Features
- Customer booking interface
- Real-time slot availability (max 5 per hour)
- Admin dashboard with authentication
- MongoDB database for persistent storage
- Delete bookings functionality
- Responsive design

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up MongoDB
**Option A: Local MongoDB**
- Install MongoDB on your computer
- MongoDB will run on `mongodb://localhost:27017`

**Option B: MongoDB Atlas (Free Cloud Database)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Use it in `.env` file

### 3. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
```

### 4. Run the Application
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Visit: http://localhost:3000

## Default Admin Credentials
- Username: `admin`
- Password: `changeme123`

**⚠️ IMPORTANT: Change these in `.env` before deploying!**

## Deployment

### Deploy to Railway (Free)
1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add MongoDB plugin
5. Add environment variables from `.env`
6. Deploy!

### Deploy to Render (Free)
1. Create account at https://render.com
2. New → Web Service
3. Connect repository
4. Add environment variables
5. Deploy!

## Project Structure
```
barbershop-booking/
├── public/           # Frontend files
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── server.js         # Backend server
├── package.json      # Dependencies
├── .env.example      # Environment template
└── README.md
```

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Hosting: Railway/Render (recommended)

## Support
For issues or questions, check the deployment platform documentation.
