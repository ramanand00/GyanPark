// api/index.js - For Vercel serverless deployment
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const authRoutes = require('../routes/authRoutes');
const profileRoutes = require('../routes/profileRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { createSuperAdmin } = require('../controllers/adminAuthController');
const path = require('path');

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

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        
        // Allow in development
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Check if origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.log('⚠️ Blocked origin:', origin);
            // Allow anyway for debugging
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
};

app.use(cors(corsOptions));

// Handle preflight requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).end();
    }
    next();
});

// Add CORS headers to all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Create super admin after database connection
setTimeout(() => {
    createSuperAdmin();
}, 2000);

// ============== ROUTES ==============
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'GyanPark Backend is working!', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date(),
        cors: 'enabled'
    });
});

// CORS test route
app.get('/api/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        origin: req.headers.origin || 'No origin',
        environment: process.env.NODE_ENV
    });
});

// 404 handler
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
        message: 'Internal server error'
    });
});

module.exports = app;