// controllers/adminAuthController.js
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Create default super admin (run this once)
const createSuperAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne({ role: 'super_admin' });
        if (!existingAdmin) {
            const superAdmin = new Admin({
                name: 'Super Admin',
                email: 'admin@gyanpark.com',
                password: 'Admin@123456',
                role: 'super_admin',
                phone: '+1234567890',
                bio: 'Platform Administrator',
                permissions: {
                    manageUsers: true,
                    manageCourses: true,
                    manageChapters: true,
                    manageNotes: true,
                    manageReviews: true,
                    manageAdmins: true,
                    viewAnalytics: true,
                }
            });
            await superAdmin.save();
            console.log('✅ Super Admin created successfully!');
            console.log('📧 Email: admin@gyanpark.com');
            console.log('🔑 Password: Admin@123456');
        }
    } catch (error) {
        console.error('Error creating super admin:', error);
    }
};

// Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated. Please contact super admin.' 
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { 
                adminId: admin._id, 
                email: admin.email, 
                role: admin.role,
                permissions: admin.permissions 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                profilePicture: admin.profilePicture,
                bio: admin.bio,
                phone: admin.phone,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
                createdAt: admin.createdAt,
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
};

// Get Admin Profile
const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Admin Profile
const updateAdminProfile = async (req, res) => {
    try {
        const { name, phone, bio, profilePicture } = req.body;
        const admin = await Admin.findByIdAndUpdate(
            req.adminId,
            { name, phone, bio, profilePicture },
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            admin 
        });
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters' 
            });
        }

        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createSuperAdmin,
    adminLogin,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
};