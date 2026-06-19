// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test the configuration
const testCloudinary = () => {
    try {
        console.log('✅ Cloudinary configured with:');
        console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing'}`);
        console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing'}`);
    } catch (error) {
        console.error('❌ Cloudinary configuration error:', error);
    }
};

testCloudinary();

module.exports = cloudinary;