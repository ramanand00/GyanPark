// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin'],
        default: 'admin',
    },
    profilePicture: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        maxlength: 500,
        default: '',
    },
    phone: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    permissions: {
        manageUsers: { type: Boolean, default: true },
        manageCourses: { type: Boolean, default: true },
        manageChapters: { type: Boolean, default: true },
        manageNotes: { type: Boolean, default: true },
        manageReviews: { type: Boolean, default: true },
        manageAdmins: { type: Boolean, default: false },
        viewAnalytics: { type: Boolean, default: true },
    }
}, {
    timestamps: true,
});

// Hash password before saving
adminSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);