// server.js
const app = require('./api/index');

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on port ${PORT}`);
        console.log(`📡 API URL: http://localhost:${PORT}/api/test`);
        console.log(`✅ Ready to accept requests\n`);
    });
}

module.exports = app;