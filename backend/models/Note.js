// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'image', 'file', 'text'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  duration: {
    type: Number,
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  downloads: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Note', noteSchema);