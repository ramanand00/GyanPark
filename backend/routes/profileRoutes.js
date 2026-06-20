// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const Review = require('../models/Review');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============== FILE STORAGE CONFIGURATION ==============

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const profileDir = path.join(uploadDir, 'profiles');
const notesDir = path.join(uploadDir, 'notes');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure storage for notes
const noteStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, notesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    cb(null, true);
};

// Create upload instances
const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

const uploadNote = multer({
    storage: noteStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: fileFilter
});

// ============== MIDDLEWARE ==============

// Validate course ID
const validateCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }
        req.course = course;
        next();
    } catch (error) {
        console.error('Course validation error:', error);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid course ID format' 
        });
    }
};

// ============== PROFILE ROUTES ==============

// Get user profile
router.get('/profile/:userId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password')
            .populate('enrolledCourses', 'title thumbnail description price category level')
            .populate('createdCourses', 'title thumbnail description price category level isPublished');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            user: {
                ...user.toObject(),
                id: user._id
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, mobileNumber, bio, education, skills, socialLinks } = req.body;
        
        const updatedData = {
            name,
            mobileNumber,
            bio: bio || '',
            education: education || '',
            skills: skills ? (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills) : [],
            socialLinks: socialLinks || {
                website: '',
                linkedin: '',
                github: '',
                twitter: ''
            }
        };

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updatedData,
            { new: true, runValidators: true }
        ).select('-password')
        .populate('enrolledCourses', 'title thumbnail')
        .populate('createdCourses', 'title thumbnail isPublished');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            user: {
                ...user.toObject(),
                id: user._id
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload profile picture
router.post('/profile/picture', authMiddleware, uploadProfile.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Delete old profile picture if exists
        const oldUser = await User.findById(req.user.userId);
        if (oldUser && oldUser.profilePicture) {
            const oldPath = path.join(__dirname, '..', oldUser.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profilePicture: imageUrl },
            { new: true }
        ).select('-password');

        res.json({ 
            success: true, 
            user: {
                ...user.toObject(),
                id: user._id
            },
            imageUrl: imageUrl 
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== COURSE ROUTES ==============

// Get teacher's courses
router.get('/teacher/courses', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: 'Only teachers can access this' });
        }

        const courses = await Course.find({ teacher: req.user.userId })
            .populate('semesters')
            .sort('-createdAt');

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Teacher courses fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create course (Teacher)
router.post('/courses', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, level, price, thumbnail } = req.body;

        // Check if user is a teacher
        const user = await User.findById(req.user.userId);
        if (user.role !== 'teacher') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only teachers can create courses' 
            });
        }

        const course = new Course({
            title,
            description,
            category: category || 'Other',
            level: level || 'Beginner',
            price: price || 0,
            thumbnail: thumbnail || '',
            teacher: req.user.userId,
            createdBy: req.user.userId,
            isPublished: false,
        });

        await course.save();

        // Add course to user's created courses
        await User.findByIdAndUpdate(req.user.userId, {
            $push: { createdCourses: course._id }
        });

        res.status(201).json({ 
            success: true, 
            message: 'Course created successfully',
            course 
        });
    } catch (error) {
        console.error('Course creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get all courses
router.get('/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate('teacher', 'name email profilePicture')
            .populate('admin', 'name email')
            .populate({
                path: 'semesters',
                populate: {
                    path: 'books',
                    populate: {
                        path: 'chapters',
                        populate: {
                            path: 'notes'
                        }
                    }
                }
            })
            .sort('-createdAt');

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Courses fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single course with details
router.get('/courses/:courseId', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate('teacher', 'name email profilePicture bio')
            .populate('admin', 'name email profilePicture bio')
            .populate({
                path: 'semesters',
                populate: {
                    path: 'books',
                    populate: {
                        path: 'chapters',
                        populate: {
                            path: 'notes',
                            populate: {
                                path: 'createdBy',
                                select: 'name email'
                            }
                        }
                    }
                }
            });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const isEnrolled = course.students?.includes(req.user.userId) || false;

        res.json({ success: true, course, isEnrolled });
    } catch (error) {
        console.error('Course fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Enroll in course
router.post('/courses/:courseId/enroll', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;

        if (course.students?.includes(req.user.userId)) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        await Course.findByIdAndUpdate(course._id, {
            $push: { students: req.user.userId }
        });

        await User.findByIdAndUpdate(req.user.userId, {
            $push: { enrolledCourses: course._id }
        });

        res.json({ success: true, message: 'Successfully enrolled in the course' });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get enrolled courses for student
router.get('/student/courses', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'enrolledCourses',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, courses: user.enrolledCourses });
    } catch (error) {
        console.error('Enrolled courses fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== SEMESTER ROUTES ==============

// Create semester
router.post('/courses/:courseId/semesters', authMiddleware, validateCourse, async (req, res) => {
    try {
        const { name, number, description, order } = req.body;
        const course = req.course;

        // Check if user is the teacher of this course
        if (course.teacher && course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to modify this course' 
            });
        }

        const semester = new Semester({
            name,
            number: number || 1,
            description: description || '',
            course: course._id,
            order: order || 1,
        });

        await semester.save();

        await Course.findByIdAndUpdate(course._id, {
            $push: { semesters: semester._id }
        });

        res.status(201).json({
            success: true,
            message: 'Semester created successfully',
            semester
        });
    } catch (error) {
        console.error('Create semester error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== REVIEW ROUTES ==============

// Submit review
router.post('/courses/:courseId/reviews', authMiddleware, validateCourse, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const course = req.course;

        if (!course.students?.includes(req.user.userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be enrolled to review this course' 
            });
        }

        const existingReview = await Review.findOne({
            course: course._id,
            user: req.user.userId
        });

        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this course' 
            });
        }

        const review = new Review({
            course: course._id,
            user: req.user.userId,
            rating: parseInt(rating),
            comment: comment.trim()
        });

        await review.save();

        const allReviews = await Review.find({ course: course._id });
        const totalReviews = allReviews.length;
        const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

        await Course.findByIdAndUpdate(course._id, {
            rating: averageRating,
            totalReviews: totalReviews
        });

        await review.populate('user', 'name email profilePicture');

        res.json({ 
            success: true, 
            message: 'Review submitted successfully',
            review: review
        });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get course reviews
router.get('/courses/:courseId/reviews', authMiddleware, validateCourse, async (req, res) => {
    try {
        const reviews = await Review.find({ course: req.params.courseId })
            .populate('user', 'name email profilePicture')
            .sort('-createdAt')
            .limit(20);

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Reviews fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;