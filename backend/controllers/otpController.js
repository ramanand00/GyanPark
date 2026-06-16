const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('Sending OTP to email:', email); // Debug log
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Check if user already exists and is verified
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: 'Email already registered and verified' });
        }
        
        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP:', otp); // Debug log
        
        // Save OTP to database
        await OTP.findOneAndDelete({ email });
        await OTP.create({ email, otp });
        
        // Send email
        await sendEmail(email, otp);
        
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in sendOTP:', error);
        res.status(500).json({ message: 'Error sending OTP: ' + error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, name, mobileNumber, password, role } = req.body;
        
        console.log('Verifying OTP for email:', email); // Debug log
        
        // Find OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        
        // Check if user already exists
        let user = await User.findOne({ email });
        
        if (user) {
            // Update existing unverified user
            user.name = name;
            user.mobileNumber = mobileNumber;
            user.password = password;
            user.role = role;
            user.isVerified = true;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                mobileNumber,
                password,
                role,
                isVerified: true
            });
        }
        
        // Delete OTP
        await OTP.findOneAndDelete({ email, otp });
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(200).json({
            message: 'Account verified and created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in verifyOTP:', error);
        res.status(500).json({ message: 'Error verifying OTP: ' + error.message });
    }
};