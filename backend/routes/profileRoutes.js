// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
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
    // Accept all file types
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

// Validate chapter ID
const validateChapter = async (req, res, next) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId);
        if (!chapter) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chapter not found' 
            });
        }
        req.chapter = chapter;
        next();
    } catch (error) {
        console.error('Chapter validation error:', error);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid chapter ID format' 
        });
    }
};

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

// Create course
router.post('/courses', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, level, price, thumbnail } = req.body;

        const user = await User.findById(req.user.userId);
        if (user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: 'Only teachers can create courses' });
        }

        const course = new Course({
            title,
            description,
            category,
            level,
            price: price || 0,
            thumbnail: thumbnail || '',
            teacher: req.user.userId,
            isPublished: false
        });

        await course.save();

        await User.findByIdAndUpdate(req.user.userId, {
            $push: { createdCourses: course._id }
        });

        res.status(201).json({ success: true, course });
    } catch (error) {
        console.error('Course creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get teacher's courses
router.get('/teacher/courses', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: 'Only teachers can access this' });
        }

        const courses = await Course.find({ teacher: req.user.userId })
            .populate({
                path: 'chapters',
                populate: {
                    path: 'notes'
                }
            })
            .sort('-createdAt');

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Teacher courses fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update course
router.put('/courses/:courseId', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this course' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.courseId,
            req.body,
            { new: true, runValidators: true }
        ).populate('chapters');

        res.json({ success: true, course: updatedCourse });
    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete course
router.delete('/courses/:courseId', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
        }

        // Get all chapters and delete their files
        const chapters = await Chapter.find({ course: course._id });
        for (const chapter of chapters) {
            const notes = await Note.find({ chapter: chapter._id });
            for (const note of notes) {
                if (note.url && note.url.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, '..', note.url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        }

        await Chapter.deleteMany({ course: course._id });
        await Note.deleteMany({ course: course._id });
        await Course.findByIdAndDelete(req.params.courseId);

        await User.findByIdAndUpdate(req.user.userId, {
            $pull: { createdCourses: course._id }
        });

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Course deletion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== CHAPTER ROUTES ==============

// Create chapter
router.post('/courses/:courseId/chapters', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;
        const { title, description, order } = req.body;

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const chapter = new Chapter({
            title,
            description: description || '',
            order: order || course.chapters.length + 1,
            course: course._id,
        });

        await chapter.save();

        await Course.findByIdAndUpdate(course._id, {
            $push: { chapters: chapter._id }
        });

        // Populate the chapter with notes
        await chapter.populate('notes');

        res.status(201).json({ success: true, chapter });
    } catch (error) {
        console.error('Chapter creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update chapter
router.put('/chapters/:chapterId', authMiddleware, validateChapter, async (req, res) => {
    try {
        const chapter = req.chapter;
        const course = await Course.findById(chapter.course);

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updatedChapter = await Chapter.findByIdAndUpdate(
            req.params.chapterId,
            req.body,
            { new: true }
        );

        res.json({ success: true, chapter: updatedChapter });
    } catch (error) {
        console.error('Chapter update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete chapter
router.delete('/chapters/:chapterId', authMiddleware, validateChapter, async (req, res) => {
    try {
        const chapter = req.chapter;
        const course = await Course.findById(chapter.course);

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Delete all note files
        const notes = await Note.find({ chapter: chapter._id });
        for (const note of notes) {
            if (note.url && note.url.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '..', note.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        await Note.deleteMany({ chapter: chapter._id });
        await Course.findByIdAndUpdate(course._id, {
            $pull: { chapters: chapter._id }
        });
        await Chapter.findByIdAndDelete(req.params.chapterId);

        res.json({ success: true, message: 'Chapter deleted successfully' });
    } catch (error) {
        console.error('Chapter deletion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== NOTE ROUTES ==============

// Upload note to chapter
router.post('/chapters/:chapterId/notes', authMiddleware, validateChapter, uploadNote.single('file'), async (req, res) => {
    try {
        console.log('📤 Uploading note to chapter:', req.params.chapterId);
        
        const chapter = req.chapter;
        const course = await Course.findById(chapter.course);

        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log('📄 File:', req.file.originalname);
        console.log('📝 Body:', req.body);

        const { title, description, type, isFree } = req.body;

        const fileUrl = `/uploads/notes/${req.file.filename}`;

        const note = new Note({
            title: title || req.file.originalname || 'Untitled',
            description: description || '',
            type: type || 'file',
            url: fileUrl,
            publicId: req.file.filename,
            fileSize: req.file.size || 0,
            chapter: chapter._id,
            teacher: req.user.userId,
            isFree: isFree === 'true' || isFree === true,
            downloads: 0
        });

        await note.save();

        await Chapter.findByIdAndUpdate(chapter._id, {
            $push: { notes: note._id }
        });

        await note.populate('teacher', 'name email');

        console.log('✅ Note uploaded successfully:', note._id);
        res.status(201).json({ success: true, note });
    } catch (error) {
        console.error('❌ Note upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading note: ' + error.message 
        });
    }
});

// Get notes for chapter
router.get('/chapters/:chapterId/notes', authMiddleware, validateChapter, async (req, res) => {
    try {
        const chapter = req.chapter;
        const notes = await Note.find({ chapter: chapter._id })
            .populate('teacher', 'name email');

        res.json({ success: true, notes });
    } catch (error) {
        console.error('Notes fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Download note
router.post('/notes/:noteId/download', authMiddleware, async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        note.downloads += 1;
        await note.save();

        // Check if user is enrolled or note is free
        if (!note.isFree) {
            const course = await Course.findById(note.course);
            if (!course.students.includes(req.user.userId)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You must be enrolled in this course to download this note' 
                });
            }
        }

        res.json({ 
            success: true, 
            downloadUrl: note.url,
            note: note
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete note
router.delete('/notes/:noteId', authMiddleware, async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        const course = await Course.findById(note.course);
        if (course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Delete file
        if (note.url && note.url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', note.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Chapter.findByIdAndUpdate(note.chapter, {
            $pull: { notes: note._id }
        });
        await Note.findByIdAndDelete(req.params.noteId);

        res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Note deletion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== STUDENT ROUTES ==============

// Enroll in course
router.post('/courses/:courseId/enroll', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;

        if (course.students.includes(req.user.userId)) {
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

// Get all courses
router.get('/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate('teacher', 'name email profilePicture')
            .populate({
                path: 'chapters',
                populate: {
                    path: 'notes'
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
            .populate({
                path: 'chapters',
                populate: {
                    path: 'notes',
                    populate: {
                        path: 'teacher',
                        select: 'name email'
                    }
                }
            });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const isEnrolled = course.students.includes(req.user.userId);

        res.json({ success: true, course, isEnrolled });
    } catch (error) {
        console.error('Course fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add to profileRoutes.js

// Get enrolled course content (with chapters and notes)
router.get('/courses/:courseId/learn', authMiddleware, validateCourse, async (req, res) => {
    try {
        const course = req.course;
        
        // Check if user is enrolled
        if (!course.students.includes(req.user.userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be enrolled in this course to access the content' 
            });
        }

        const fullCourse = await Course.findById(course._id)
            .populate({
                path: 'chapters',
                populate: {
                    path: 'notes',
                    populate: {
                        path: 'teacher',
                        select: 'name email'
                    }
                }
            })
            .populate('teacher', 'name email profilePicture');

        res.json({ success: true, course: fullCourse });
    } catch (error) {
        console.error('Course content fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit review
router.post('/courses/:courseId/reviews', authMiddleware, validateCourse, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const course = req.course;

        // Check if user is enrolled
        if (!course.students.includes(req.user.userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be enrolled to review this course' 
            });
        }

        // In a real app, you'd have a Review model
        // For now, we'll just update the course rating
        const totalReviews = course.totalReviews + 1;
        const newRating = ((course.rating * course.totalReviews) + rating) / totalReviews;
        
        await Course.findByIdAndUpdate(course._id, {
            rating: newRating,
            totalReviews: totalReviews
        });

        res.json({ 
            success: true, 
            message: 'Review submitted successfully',
            rating: newRating,
            totalReviews: totalReviews
        });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get course reviews
router.get('/courses/:courseId/reviews', authMiddleware, validateCourse, async (req, res) => {
    try {
        // In a real app, you'd fetch from a Review model
        // For now, return mock data
        const mockReviews = [
            {
                _id: '1',
                user: { name: 'John Doe', profilePicture: '' },
                rating: 5,
                comment: 'Excellent course! Very well structured and easy to follow.',
                createdAt: new Date('2024-01-15')
            },
            {
                _id: '2',
                user: { name: 'Jane Smith', profilePicture: '' },
                rating: 4,
                comment: 'Great content, but could use more practical examples.',
                createdAt: new Date('2024-01-20')
            }
        ];
        res.json({ success: true, reviews: mockReviews });
    } catch (error) {
        console.error('Reviews fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Add to profileRoutes.js

// ============== REVIEW ROUTES ==============

// Submit review
router.post('/courses/:courseId/reviews', authMiddleware, validateCourse, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const course = req.course;

        // Check if user is enrolled
        if (!course.students.includes(req.user.userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be enrolled to review this course' 
            });
        }

        // Check if user already reviewed
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

        // Create new review (you need to create a Review model)
        const review = new Review({
            course: course._id,
            user: req.user.userId,
            rating: parseInt(rating),
            comment: comment.trim()
        });

        await review.save();

        // Update course rating
        const allReviews = await Review.find({ course: course._id });
        const totalReviews = allReviews.length;
        const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

        await Course.findByIdAndUpdate(course._id, {
            rating: averageRating,
            totalReviews: totalReviews
        });

        // Populate user info
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

module.exports = router;

