// routes/adminCourseRoutes.js
const express = require('express');
const router = express.Router();
const adminCourseController = require('../controllers/adminCourseController');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const uploadDir = path.join(__dirname, '../uploads/notes');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// ============== COURSE ROUTES ==============
router.post('/courses', adminMiddleware, adminCourseController.createCourse);
router.get('/courses', adminMiddleware, adminCourseController.getAllAdminCourses);
router.get('/courses/all', adminMiddleware, adminCourseController.getAllCoursesAdmin);
router.get('/courses/:courseId', adminMiddleware, adminCourseController.getCourseDetails);
router.put('/courses/:courseId', adminMiddleware, adminCourseController.updateCourse);
router.delete('/courses/:courseId', adminMiddleware, adminCourseController.deleteCourse);
router.put('/courses/:courseId/toggle-publish', adminMiddleware, adminCourseController.toggleCoursePublish);

// ============== SEMESTER ROUTES ==============
router.post('/courses/:courseId/semesters', adminMiddleware, adminCourseController.createSemester);
router.get('/courses/:courseId/semesters', adminMiddleware, adminCourseController.getSemesters);
router.put('/semesters/:semesterId', adminMiddleware, adminCourseController.updateSemester);
router.delete('/semesters/:semesterId', adminMiddleware, adminCourseController.deleteSemester);

// ============== BOOK ROUTES ==============
router.post('/semesters/:semesterId/books', adminMiddleware, adminCourseController.createBook);
router.get('/semesters/:semesterId/books', adminMiddleware, adminCourseController.getBooks);
router.put('/books/:bookId', adminMiddleware, adminCourseController.updateBook);
router.delete('/books/:bookId', adminMiddleware, adminCourseController.deleteBook);

// ============== CHAPTER ROUTES ==============
router.post('/books/:bookId/chapters', adminMiddleware, adminCourseController.createChapter);
router.get('/books/:bookId/chapters', adminMiddleware, adminCourseController.getChapters);
router.put('/chapters/:chapterId', adminMiddleware, adminCourseController.updateChapter);
router.delete('/chapters/:chapterId', adminMiddleware, adminCourseController.deleteChapter);

// ============== NOTE ROUTES ==============
router.post('/chapters/:chapterId/notes', adminMiddleware, upload.single('file'), adminCourseController.uploadNote);
router.get('/chapters/:chapterId/notes', adminMiddleware, adminCourseController.getNotes);
router.put('/notes/:noteId', adminMiddleware, adminCourseController.updateNote);
router.delete('/notes/:noteId', adminMiddleware, adminCourseController.deleteNote);

module.exports = router;