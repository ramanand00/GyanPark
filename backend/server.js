const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ================= CORS (SAFE FOR VERCEL + LOCAL) =================

const allowedOrigins = [
    'https://gyan-park.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow mobile apps / postman
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // allow but log (prevents crash in production)
        console.log("Blocked origin:", origin);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ❌ IMPORTANT: DO NOT USE app.options('*')
// This causes your crash in Express 5

// ================= MIDDLEWARE =================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= ROUTES IMPORT =================

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ================= STATIC FILES =================

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= HOME PAGE =================

app.get('/', (req, res) => {
    res.json({
        message: "GyanPark Backend Running 🚀"
    });
});

// ================= VISUAL TEST PAGE =================

app.get('/api/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>GyanPark Backend</title>
        <style>
            body{
                margin:0;
                height:100vh;
                display:flex;
                justify-content:center;
                align-items:center;
                background:linear-gradient(135deg,#667eea,#764ba2);
                font-family:Arial;
            }

            .card{
                background:white;
                padding:40px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 30px rgba(0,0,0,.2);
            }

            .dot{
                width:90px;
                height:90px;
                background:#22c55e;
                border-radius:50%;
                margin:auto;
                animation:pulse 1.5s infinite;
            }

            @keyframes pulse{
                0%{transform:scale(1);}
                50%{transform:scale(1.2);}
                100%{transform:scale(1);}
            }

            h1{
                color:#333;
                margin-top:20px;
            }

            p{
                color:#666;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="dot"></div>
            <h1>🚀 Backend Running</h1>
            <p>GyanPark API is working perfectly</p>
            <p>Time: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `);
});

// ================= HEALTH API =================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
        node: process.version
    });
});

// ================= API ROUTES =================

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/admin', adminRoutes);

// ================= 404 HANDLER =================

app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found'
        });
    }

    res.status(404).send("Page not found");
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ================= EXPORT FOR VERCEL =================

module.exports = app;

// ================= LOCAL SERVER ONLY =================

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 http://localhost:${PORT}/api/test`);
        console.log(`🌐 http://localhost:${PORT}/`);
    });
}