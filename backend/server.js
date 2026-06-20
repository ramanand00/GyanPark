// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { createSuperAdmin } = require('./controllers/adminAuthController');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

dotenv.config();

const app = express();

// ============== CORS CONFIGURATION ==============
const allowedOrigins = [
    'https://gyan-park.vercel.app',
    'https://gyan-park-vqx8.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Create super admin after database connection
setTimeout(() => {
    createSuperAdmin();
}, 2000);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    next();
});

// ============== ROUTES ==============
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'GyanPark Backend is working!', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check route for Vercel
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// ============== ERROR HANDLING ==============

// 404 handler - Must be after all routes
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Export for Vercel
module.exports = app;

// Only start server if not in Vercel environment
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on port ${PORT}`);
        console.log(`📡 API URL: http://localhost:${PORT}/api/test`);
        console.log(`📁 Uploads directory: ${uploadsDir}`);
        console.log(`✅ Ready to accept requests\n`);
    });
}