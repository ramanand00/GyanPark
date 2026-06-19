// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminCourseRoutes = require('./routes/adminCourseRoutes');
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

// Connect to database
connectDB();

// Create super admin after database connection
setTimeout(() => {
    createSuperAdmin();
}, 2000);

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCourseRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'GyanPark Backend is working!', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:5000/api/test`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`✅ Ready to accept requests\n`);
});