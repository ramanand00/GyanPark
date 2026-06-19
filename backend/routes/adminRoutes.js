// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Admin = require('../models/Admin');

// Public routes
router.post('/login', adminAuthController.adminLogin);

// Protected routes - Profile Management
router.get('/profile', adminMiddleware, adminAuthController.getAdminProfile);
router.put('/profile', adminMiddleware, adminAuthController.updateAdminProfile);
router.put('/change-password', adminMiddleware, adminAuthController.changePassword);

// Admin profile picture upload
const adminProfileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = path.join(__dirname, '../uploads/admin-profiles');
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
	}
});

const uploadAdminProfile = multer({
	storage: adminProfileStorage,
	limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/profile/picture', adminMiddleware, uploadAdminProfile.single('profilePicture'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded' });
		}

		const imageUrl = `/uploads/admin-profiles/${req.file.filename}`;
		const admin = await Admin.findByIdAndUpdate(
			req.adminId,
			{ profilePicture: imageUrl },
			{ new: true }
		).select('-password');

		res.json({ 
			success: true, 
			message: 'Profile picture updated successfully',
			admin 
		});
	} catch (error) {
		console.error('Profile picture upload error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
});

// ============== USER MANAGEMENT ==============
router.get('/users', adminMiddleware, adminController.getAllUsers);
router.get('/users/:userId', adminMiddleware, adminController.getUserDetails);
router.put('/users/:userId', adminMiddleware, adminController.updateUser);
router.delete('/users/:userId', adminMiddleware, adminController.deleteUser);
router.put('/users/:userId/toggle-status', adminMiddleware, adminController.toggleUserStatus);

// ============== COURSE MANAGEMENT ==============
router.get('/courses', adminMiddleware, adminController.getAllCourses);
router.get('/courses/:courseId', adminMiddleware, adminController.getCourseDetails);
router.put('/courses/:courseId', adminMiddleware, adminController.updateCourse);
router.delete('/courses/:courseId', adminMiddleware, adminController.deleteCourse);
router.put('/courses/:courseId/toggle-publish', adminMiddleware, adminController.toggleCoursePublish);

// ============== CHAPTER MANAGEMENT ==============
router.get('/chapters', adminMiddleware, adminController.getAllChapters);
router.get('/chapters/:chapterId', adminMiddleware, adminController.getChapterDetails);
router.put('/chapters/:chapterId', adminMiddleware, adminController.updateChapter);
router.delete('/chapters/:chapterId', adminMiddleware, adminController.deleteChapter);

// ============== NOTE MANAGEMENT ==============
router.get('/notes', adminMiddleware, adminController.getAllNotes);
router.get('/notes/:noteId', adminMiddleware, adminController.getNoteDetails);
router.delete('/notes/:noteId', adminMiddleware, adminController.deleteNote);

// ============== REVIEW MANAGEMENT ==============
router.get('/reviews', adminMiddleware, adminController.getAllReviews);
router.delete('/reviews/:reviewId', adminMiddleware, adminController.deleteReview);

// ============== ADMIN MANAGEMENT ==============
router.get('/admins', adminMiddleware, adminController.getAllAdmins);
router.get('/admins/:adminId', adminMiddleware, adminController.getAdminDetails);
router.post('/admins', adminMiddleware, adminController.createAdmin);
router.put('/admins/:adminId', adminMiddleware, adminController.updateAdmin);
router.delete('/admins/:adminId', adminMiddleware, adminController.deleteAdmin);
router.put('/admins/:adminId/toggle-status', adminMiddleware, adminController.toggleAdminStatus);

// ============== DASHBOARD STATISTICS ==============
router.get('/dashboard/stats', adminMiddleware, adminController.getDashboardStats);

module.exports = router;