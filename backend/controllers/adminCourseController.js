// controllers/adminCourseController.js
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const Admin = require('../models/Admin');
const fs = require('fs');
const path = require('path');

// ============== COURSE MANAGEMENT ==============

// Create Course
const createCourse = async (req, res) => {
    try {
        console.log('📚 Creating course with admin ID:', req.adminId);
        
        const { title, description, category, level, price, thumbnail } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        // Check if admin exists
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const course = new Course({
            title,
            description,
            category: category || 'Other',
            level: level || 'Beginner',
            price: price || 0,
            thumbnail: thumbnail || '',
            admin: req.adminId,
            createdBy: req.adminId,
            isPublished: false,
        });

        await course.save();

        console.log('✅ Course created successfully:', course._id);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('❌ Create course error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// Get All Courses (Admin)
const getAllAdminCourses = async (req, res) => {
    try {
        console.log('📚 Fetching courses for admin:', req.adminId);
        
        // First check if admin exists
        const admin = await Admin.findById(req.adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Get courses for this admin
        const courses = await Course.find({ admin: req.adminId })
            .populate('semesters')
            .sort('-createdAt');

        console.log(`✅ Found ${courses.length} courses for admin`);

        res.json({
            success: true,
            courses: courses || []
        });
    } catch (error) {
        console.error('❌ Get courses error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// Get All Courses (Super Admin - all courses)
const getAllCoursesAdmin = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('admin', 'name email')
            .populate('semesters')
            .sort('-createdAt');

        res.json({
            success: true,
            courses
        });
    } catch (error) {
        console.error('Get all courses admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Course Details
const getCourseDetails = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
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
            });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Course
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if admin owns this course
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this course'
            });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.courseId,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Course updated successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Course
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if admin owns this course
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this course'
            });
        }

        // Delete all associated data
        const semesters = await Semester.find({ course: course._id });
        for (const semester of semesters) {
            const books = await Book.find({ semester: semester._id });
            for (const book of books) {
                const chapters = await Chapter.find({ book: book._id });
                for (const chapter of chapters) {
                    await Note.deleteMany({ chapter: chapter._id });
                }
                await Chapter.deleteMany({ book: book._id });
            }
            await Book.deleteMany({ semester: semester._id });
        }
        await Semester.deleteMany({ course: course._id });

        await Course.findByIdAndDelete(req.params.courseId);

        res.json({
            success: true,
            message: 'Course and all associated content deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Toggle Course Publish
const toggleCoursePublish = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if admin owns this course
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this course'
            });
        }

        course.isPublished = !course.isPublished;
        await course.save();

        res.json({
            success: true,
            message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
            isPublished: course.isPublished
        });
    } catch (error) {
        console.error('Toggle course publish error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============== SEMESTER MANAGEMENT ==============

// Create Semester
const createSemester = async (req, res) => {
    try {
        const { name, number, description, order } = req.body;
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if admin owns this course
        if (course.admin.toString() !== req.adminId) {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Semesters
const getSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find({ course: req.params.courseId })
            .populate('books')
            .sort('order');

        res.json({
            success: true,
            semesters
        });
    } catch (error) {
        console.error('Get semesters error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Semester
const updateSemester = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.semesterId);
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Check if admin owns this semester
        const course = await Course.findById(semester.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this semester'
            });
        }

        const updatedSemester = await Semester.findByIdAndUpdate(
            req.params.semesterId,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Semester updated successfully',
            semester: updatedSemester
        });
    } catch (error) {
        console.error('Update semester error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Semester
const deleteSemester = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.semesterId);
        
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Check if admin owns this semester
        const course = await Course.findById(semester.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this semester'
            });
        }

        // Delete associated books, chapters, and notes
        const books = await Book.find({ semester: semester._id });
        for (const book of books) {
            const chapters = await Chapter.find({ book: book._id });
            for (const chapter of chapters) {
                await Note.deleteMany({ chapter: chapter._id });
            }
            await Chapter.deleteMany({ book: book._id });
        }
        await Book.deleteMany({ semester: semester._id });

        await Course.findByIdAndUpdate(semester.course, {
            $pull: { semesters: semester._id }
        });

        await Semester.findByIdAndDelete(req.params.semesterId);

        res.json({
            success: true,
            message: 'Semester and all associated content deleted successfully'
        });
    } catch (error) {
        console.error('Delete semester error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============== BOOK MANAGEMENT ==============

// Create Book
const createBook = async (req, res) => {
    try {
        const { title, description, author, order, coverImage } = req.body;
        const semester = await Semester.findById(req.params.semesterId);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Check if admin owns this book
        const course = await Course.findById(semester.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this book'
            });
        }

        const book = new Book({
            title,
            description: description || '',
            author: author || '',
            semester: semester._id,
            course: semester.course,
            order: order || 1,
            coverImage: coverImage || '',
        });

        await book.save();

        await Semester.findByIdAndUpdate(semester._id, {
            $push: { books: book._id }
        });

        res.status(201).json({
            success: true,
            message: 'Book created successfully',
            book
        });
    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Books
const getBooks = async (req, res) => {
    try {
        const books = await Book.find({ semester: req.params.semesterId })
            .populate('chapters')
            .sort('order');

        res.json({
            success: true,
            books
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Book
const updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if admin owns this book
        const course = await Course.findById(book.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this book'
            });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.bookId,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Book updated successfully',
            book: updatedBook
        });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Book
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if admin owns this book
        const course = await Course.findById(book.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this book'
            });
        }

        // Delete associated chapters and notes
        const chapters = await Chapter.find({ book: book._id });
        for (const chapter of chapters) {
            await Note.deleteMany({ chapter: chapter._id });
        }
        await Chapter.deleteMany({ book: book._id });

        await Semester.findByIdAndUpdate(book.semester, {
            $pull: { books: book._id }
        });

        await Book.findByIdAndDelete(req.params.bookId);

        res.json({
            success: true,
            message: 'Book and all associated content deleted successfully'
        });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============== CHAPTER MANAGEMENT ==============

// Create Chapter
const createChapter = async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if admin owns this chapter
        const course = await Course.findById(book.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this chapter'
            });
        }

        const chapter = new Chapter({
            title,
            description: description || '',
            order: order || 1,
            book: book._id,
            course: book.course,
            semester: book.semester,
        });

        await chapter.save();

        await Book.findByIdAndUpdate(book._id, {
            $push: { chapters: chapter._id }
        });

        res.status(201).json({
            success: true,
            message: 'Chapter created successfully',
            chapter
        });
    } catch (error) {
        console.error('Create chapter error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Chapters
const getChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find({ book: req.params.bookId })
            .populate('notes')
            .sort('order');

        res.json({
            success: true,
            chapters
        });
    } catch (error) {
        console.error('Get chapters error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Chapter
const updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId);
        
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Chapter not found'
            });
        }

        // Check if admin owns this chapter
        const course = await Course.findById(chapter.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to modify this chapter'
            });
        }

        const updatedChapter = await Chapter.findByIdAndUpdate(
            req.params.chapterId,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Chapter updated successfully',
            chapter: updatedChapter
        });
    } catch (error) {
        console.error('Update chapter error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Chapter
const deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId);
        
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Chapter not found'
            });
        }

        // Check if admin owns this chapter
        const course = await Course.findById(chapter.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this chapter'
            });
        }

        await Note.deleteMany({ chapter: chapter._id });

        await Book.findByIdAndUpdate(chapter.book, {
            $pull: { chapters: chapter._id }
        });

        await Chapter.findByIdAndDelete(req.params.chapterId);

        res.json({
            success: true,
            message: 'Chapter and all associated notes deleted successfully'
        });
    } catch (error) {
        console.error('Delete chapter error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============== NOTE/MEDIA MANAGEMENT ==============

// Upload Note/Media
const uploadNote = async (req, res) => {
    try {
        const { title, description, type, isFree } = req.body;
        const chapter = await Chapter.findById(req.params.chapterId);

        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Chapter not found'
            });
        }

        // Check if admin owns this note
        const course = await Course.findById(chapter.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to upload notes to this chapter'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/notes/${req.file.filename}`;

        const note = new Note({
            title: title || req.file.originalname || 'Untitled',
            description: description || '',
            type: type || 'file',
            url: fileUrl,
            publicId: req.file.filename,
            fileSize: req.file.size || 0,
            chapter: chapter._id,
            book: chapter.book,
            semester: chapter.semester,
            course: chapter.course,
            createdBy: req.adminId,
            isFree: isFree === 'true' || isFree === true,
            downloads: 0,
            views: 0,
        });

        await note.save();

        await Chapter.findByIdAndUpdate(chapter._id, {
            $push: { notes: note._id }
        });

        res.status(201).json({
            success: true,
            message: 'Note uploaded successfully',
            note
        });
    } catch (error) {
        console.error('Upload note error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Notes
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ chapter: req.params.chapterId })
            .populate('createdBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Note
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check if admin owns this note
        const course = await Course.findById(note.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this note'
            });
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

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Note
const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check if admin owns this note
        const course = await Course.findById(note.course);
        if (course.admin.toString() !== req.adminId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this note'
            });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.noteId,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Note updated successfully',
            note: updatedNote
        });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    // Course
    createCourse,
    getAllAdminCourses,
    getAllCoursesAdmin,
    getCourseDetails,
    updateCourse,
    deleteCourse,
    toggleCoursePublish,

    // Semester
    createSemester,
    getSemesters,
    updateSemester,
    deleteSemester,

    // Book
    createBook,
    getBooks,
    updateBook,
    deleteBook,

    // Chapter
    createChapter,
    getChapters,
    updateChapter,
    deleteChapter,

    // Note
    uploadNote,
    getNotes,
    deleteNote,
    updateNote,
};