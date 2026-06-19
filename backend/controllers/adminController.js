// controllers/adminController.js
const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const Review = require('../models/Review');
const Admin = require('../models/Admin');

// ============== DASHBOARD STATISTICS ==============
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalTeachers,
            totalStudents,
            totalCourses,
            totalChapters,
            totalNotes,
            totalReviews,
            publishedCourses,
            recentUsers,
            recentCourses,
            totalAdmins
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'student' }),
            Course.countDocuments(),
            Chapter.countDocuments(),
            Note.countDocuments(),
            Review.countDocuments(),
            Course.countDocuments({ isPublished: true }),
            User.find().sort('-createdAt').limit(5).select('name email role createdAt profilePicture'),
            Course.find().sort('-createdAt').limit(5).populate('teacher', 'name email'),
            Admin.countDocuments({ isActive: true })
        ]);

        // Calculate revenue
        const revenueData = await Course.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$price' }
                }
            }
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    teachers: totalTeachers,
                    students: totalStudents,
                },
                courses: {
                    total: totalCourses,
                    published: publishedCourses,
                    draft: totalCourses - publishedCourses,
                },
                content: {
                    chapters: totalChapters,
                    notes: totalNotes,
                    reviews: totalReviews,
                },
                admins: totalAdmins,
                revenue: totalRevenue,
                recentUsers,
                recentCourses,
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== USER MANAGEMENT ==============
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) {
            query.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password')
            .populate('enrolledCourses', 'title thumbnail price')
            .populate('createdCourses', 'title thumbnail price isPublished');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, mobileNumber, role, isVerified } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { name, email, mobileNumber, role, isVerified },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'teacher') {
            await Course.deleteMany({ teacher: user._id });
        }

        await User.findByIdAndDelete(req.params.userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isVerified = !user.isVerified;
        await user.save();

        res.json({ 
            success: true, 
            message: `User ${user.isVerified ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isVerified 
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== COURSE MANAGEMENT ==============
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('teacher', 'name email')
            .populate('chapters')
            .sort('-createdAt');
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCourseDetails = async (req, res) => {
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
            })
            .populate('students', 'name email');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.courseId,
            req.body,
            { new: true, runValidators: true }
        ).populate('teacher', 'name email');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        await Chapter.deleteMany({ course: course._id });
        await Note.deleteMany({ course: course._id });
        await Review.deleteMany({ course: course._id });
        await Course.findByIdAndDelete(req.params.courseId);

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleCoursePublish = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== CHAPTER MANAGEMENT ==============
const getAllChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find()
            .populate('course', 'title')
            .populate('notes')
            .sort('order');
        res.json({ success: true, chapters });
    } catch (error) {
        console.error('Get chapters error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getChapterDetails = async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId)
            .populate('course', 'title teacher')
            .populate({
                path: 'notes',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            });

        if (!chapter) {
            return res.status(404).json({ success: false, message: 'Chapter not found' });
        }

        res.json({ success: true, chapter });
    } catch (error) {
        console.error('Get chapter details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(
            req.params.chapterId,
            req.body,
            { new: true }
        );
        if (!chapter) {
            return res.status(404).json({ success: false, message: 'Chapter not found' });
        }
        res.json({ success: true, chapter });
    } catch (error) {
        console.error('Update chapter error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.chapterId);
        if (!chapter) {
            return res.status(404).json({ success: false, message: 'Chapter not found' });
        }

        await Note.deleteMany({ chapter: chapter._id });
        await Course.findByIdAndUpdate(chapter.course, {
            $pull: { chapters: chapter._id }
        });
        await Chapter.findByIdAndDelete(req.params.chapterId);

        res.json({ success: true, message: 'Chapter deleted successfully' });
    } catch (error) {
        console.error('Delete chapter error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== NOTE MANAGEMENT ==============
const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find()
            .populate('chapter', 'title')
            .populate('teacher', 'name email')
            .sort('-createdAt');
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getNoteDetails = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId)
            .populate('chapter', 'title')
            .populate('teacher', 'name email');

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }
        res.json({ success: true, note });
    } catch (error) {
        console.error('Get note details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        await Chapter.findByIdAndUpdate(note.chapter, {
            $pull: { notes: note._id }
        });
        await Note.findByIdAndDelete(req.params.noteId);

        res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== REVIEW MANAGEMENT ==============
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email profilePicture')
            .populate('course', 'title')
            .sort('-createdAt');
        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        await Review.findByIdAndDelete(req.params.reviewId);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== ADMIN MANAGEMENT ==============
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .select('-password')
            .populate('createdBy', 'name email')
            .sort('-createdAt');
        res.json({ success: true, admins });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminDetails = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.adminId)
            .select('-password')
            .populate('createdBy', 'name email');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, admin });
    } catch (error) {
        console.error('Get admin details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createAdmin = async (req, res) => {
    try {
        // Check if current user has permission to manage admins
        if (!req.permissions?.manageAdmins) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to create admins' 
            });
        }

        const { name, email, password, role, phone, bio, permissions } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and password are required' 
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin with this email already exists' 
            });
        }

        // Create new admin
        const admin = new Admin({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'admin',
            phone: phone || '',
            bio: bio || '',
            createdBy: req.adminId,
            permissions: permissions || {
                manageUsers: true,
                manageCourses: true,
                manageChapters: true,
                manageNotes: true,
                manageReviews: true,
                manageAdmins: false,
                viewAnalytics: true,
            }
        });

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({ 
            success: true, 
            message: 'Admin created successfully',
            admin: adminResponse
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAdmin = async (req, res) => {
    try {
        // Check if current user has permission to manage admins
        if (!req.permissions?.manageAdmins) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update admins' 
            });
        }

        const { name, role, phone, bio, permissions, isActive } = req.body;
        const admin = await Admin.findById(req.params.adminId);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Prevent changing super admin role
        if (admin.role === 'super_admin' && role && role !== 'super_admin') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot change super admin role' 
            });
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            req.params.adminId,
            { name, role, phone, bio, permissions, isActive },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ 
            success: true, 
            message: 'Admin updated successfully',
            admin: updatedAdmin 
        });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        // Check if current user has permission to manage admins
        if (!req.permissions?.manageAdmins) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete admins' 
            });
        }

        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Prevent deleting super admin
        if (admin.role === 'super_admin') {
            const superAdmins = await Admin.countDocuments({ role: 'super_admin' });
            if (superAdmins <= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete the last super admin' 
                });
            }
        }

        // Prevent admin from deleting themselves
        if (admin._id.toString() === req.adminId) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot delete your own account' 
            });
        }

        await Admin.findByIdAndDelete(req.params.adminId);
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleAdminStatus = async (req, res) => {
    try {
        // Check if current user has permission to manage admins
        if (!req.permissions?.manageAdmins) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to manage admin status' 
            });
        }

        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Prevent deactivating super admin
        if (admin.role === 'super_admin') {
            const superAdmins = await Admin.countDocuments({ 
                role: 'super_admin', 
                isActive: true 
            });
            if (superAdmins <= 1 && admin.isActive) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot deactivate the only active super admin' 
                });
            }
        }

        // Prevent admin from deactivating themselves
        if (admin._id.toString() === req.adminId) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot deactivate your own account' 
            });
        }

        admin.isActive = !admin.isActive;
        await admin.save();

        res.json({ 
            success: true, 
            message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: admin.isActive 
        });
    } catch (error) {
        console.error('Toggle admin status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getAllCourses,
    getCourseDetails,
    updateCourse,
    deleteCourse,
    toggleCoursePublish,
    getAllChapters,
    getChapterDetails,
    updateChapter,
    deleteChapter,
    getAllNotes,
    getNoteDetails,
    deleteNote,
    getAllReviews,
    deleteReview,
    getAllAdmins,
    getAdminDetails,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
};