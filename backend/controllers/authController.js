// controllers/authController.js
const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('📧 Send OTP request for:', email);
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ success: false, message: 'Email already registered and verified' });
        }
        
        const otp = generateOTP();
        console.log('🔑 Generated OTP:', otp);
        
        await OTP.deleteMany({ email: email.toLowerCase() });
        await OTP.create({ email: email.toLowerCase(), otp });
        
        await sendEmail(email, otp);
        
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('❌ Send OTP Error:', error);
        res.status(500).json({ success: false, message: 'Error sending OTP' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp, name, mobileNumber, password, role } = req.body;
        
        console.log('=========================================');
        console.log('🔐 VERIFY OTP REQUEST');
        console.log('=========================================');
        console.log('Email:', email);
        console.log('OTP:', otp);
        console.log('Name:', name);
        console.log('Mobile:', mobileNumber);
        console.log('Role:', role);
        console.log('=========================================');
        
        if (!email || !otp || !name || !mobileNumber || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
        
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        
        console.log('✅ OTP verified');
        
        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            // Update existing user
            user.name = name;
            user.mobileNumber = mobileNumber;
            user.password = password;
            user.role = role;
            user.isVerified = true;
            await user.save();
            console.log('✅ User updated');
        } else {
            // Create new user
            user = new User({
                name,
                email: email.toLowerCase(),
                mobileNumber,
                password,
                role,
                isVerified: true
            });
            await user.save();
            console.log('✅ User created');
        }
        
        // Delete OTP
        await OTP.deleteMany({ email: email.toLowerCase() });
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user with both _id and id for consistency
        res.status(200).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture || '',
                isVerified: user.isVerified,
                mobileNumber: user.mobileNumber,
                bio: user.bio || '',
                education: user.education || '',
                skills: user.skills || [],
                socialLinks: user.socialLinks || {}
            }
        });
        
    } catch (error) {
        console.error('❌ VERIFY OTP ERROR:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating account: ' + error.message 
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user with both _id and id for consistency
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture || '',
                isVerified: user.isVerified,
                mobileNumber: user.mobileNumber,
                bio: user.bio || '',
                education: user.education || '',
                skills: user.skills || [],
                socialLinks: user.socialLinks || {}
            }
        });
    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('enrolledCourses', 'title thumbnail description price')
            .populate('createdCourses', 'title thumbnail description price isPublished');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Return user with both _id and id for consistency
        res.status(200).json({ 
            success: true, 
            user: {
                ...user.toObject(),
                id: user._id
            }
        });
    } catch (error) {
        console.error('❌ Get Me Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    login,
    getMe
};