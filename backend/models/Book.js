// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    author: {
        type: String,
        default: '',
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
    }],
    coverImage: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Book', bookSchema);