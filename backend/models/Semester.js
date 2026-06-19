// models/Semester.js
const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Semester name is required'],
        trim: true,
    },
    number: {
        type: Number,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
    }],
    order: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Semester', semesterSchema);