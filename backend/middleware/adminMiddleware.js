// middleware/adminMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if admin exists
        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated' 
            });
        }

        // Set admin info in request
        req.admin = admin;
        req.adminId = decoded.adminId;
        req.adminRole = decoded.role;
        req.permissions = decoded.permissions || {};
        
        console.log('✅ Admin authenticated:', admin.email, 'ID:', req.adminId);
        
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

// Permission check middleware
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.permissions || !req.permissions[permission]) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to perform this action' 
            });
        }
        next();
    };
};

module.exports = {
    adminMiddleware,
    checkPermission
};