// models/Chapter.js
const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Chapter title is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        required: true,
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true,
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Chapter', chapterSchema);