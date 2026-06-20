// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Programming', 'Design', 'Business', 'Marketing', 'Science', 'Mathematics', 'Languages', 'Other'],
    },
    level: {
        type: String,
        required: [true, 'Level is required'],
        enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    price: {
        type: Number,
        default: 0,
    },
    thumbnail: {
        type: String,
        default: '',
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        // Remove required: true to allow teacher-created courses
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    semesters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Course', courseSchema);