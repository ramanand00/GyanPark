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

dotenv.config();

const app = express();

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ================= CORS =================

const allowedOrigins = [
    'https://gyan-park.vercel.app',
    'https://gyan-park-vqx8.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
            allowedOrigins.includes(origin) ||
            process.env.NODE_ENV === 'development'
        ) {
            return callback(null, true);
        }

        console.log('Blocked Origin:', origin);

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept'
    ]
}));

// DON'T USE app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FILES =================

app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// ================= DATABASE =================

connectDB();

setTimeout(() => {
    createSuperAdmin();
}, 2000);

// ================= LOGGER =================

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    console.log('Origin:', req.headers.origin);
    next();
});

// ================= HOME PAGE =================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= API ROUTES =================

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/admin', adminRoutes);

// ================= TEST ROUTE =================

app.get('/api/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>GyanPark Backend Status</title>
        <style>
            body{
                margin:0;
                height:100vh;
                display:flex;
                justify-content:center;
                align-items:center;
                background:linear-gradient(135deg,#4f46e5,#7c3aed);
                font-family:Arial,sans-serif;
            }

            .card{
                background:white;
                padding:40px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 30px rgba(0,0,0,.2);
            }

            .status{
                width:100px;
                height:100px;
                background:#22c55e;
                border-radius:50%;
                margin:auto;
                animation:pulse 1.5s infinite;
            }

            @keyframes pulse{
                0%{transform:scale(1);}
                50%{transform:scale(1.1);}
                100%{transform:scale(1);}
            }

            h1{
                margin-top:20px;
                color:#333;
            }

            p{
                color:#666;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status"></div>
            <h1>🚀 GyanPark Backend Running</h1>
            <p>Server is online and working perfectly.</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
    </body>
    </html>
    `);
});

// ================= HEALTH =================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        nodeVersion: process.version
    });
});

// ================= 404 =================

app.use((req, res) => {

    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found',
            path: req.originalUrl
        });
    }

    return res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error:
            process.env.NODE_ENV === 'development'
                ? err.message
                : undefined
    });
});

// ================= EXPORT =================

module.exports = app;

// ================= LOCAL SERVER =================

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Home: http://localhost:${PORT}`);
        console.log(`📡 API Test: http://localhost:${PORT}/api/test`);
    });
}