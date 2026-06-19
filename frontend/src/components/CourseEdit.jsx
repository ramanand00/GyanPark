// components/CourseEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CourseEdit = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Programming',
        level: 'Beginner',
        price: 0,
        isPublished: false,
    });
    const [chapters, setChapters] = useState([]);
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [newChapter, setNewChapter] = useState({ title: '', description: '', order: 1 });
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteData, setNoteData] = useState({
        title: '',
        description: '',
        type: 'file',
        isFree: false,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/courses/${courseId}`);
            const data = response.data.course;
            setCourse(data);
            setFormData({
                title: data.title || '',
                description: data.description || '',
                category: data.category || 'Programming',
                level: data.level || 'Beginner',
                price: data.price || 0,
                isPublished: data.isPublished || false,
            });
            setChapters(data.chapters || []);
        } catch (error) {
            console.error('Fetch course error:', error);
            toast.error('Failed to load course');
            navigate('/teacher/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/courses/${courseId}`, formData);
            toast.success('Course updated successfully!');
        } catch (error) {
            console.error('Update course error:', error);
            toast.error('Failed to update course');
        }
    };

    const handleCreateChapter = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/courses/${courseId}/chapters`, newChapter);
            setChapters([...chapters, response.data.chapter]);
            setShowChapterForm(false);
            setNewChapter({ title: '', description: '', order: chapters.length + 1 });
            toast.success('Chapter created successfully!');
            // Refresh course data
            fetchCourse();
        } catch (error) {
            console.error('Create chapter error:', error);
            toast.error(error.response?.data?.message || 'Failed to create chapter');
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm('Delete this chapter and all its notes?')) return;
        try {
            await api.delete(`/chapters/${chapterId}`);
            setChapters(chapters.filter(c => c._id !== chapterId));
            toast.success('Chapter deleted successfully');
            fetchCourse();
        } catch (error) {
            console.error('Delete chapter error:', error);
            toast.error('Failed to delete chapter');
        }
    };

    const handleUploadNote = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        if (!selectedChapter) {
            toast.error('Please select a chapter first');
            return;
        }

        setUploading(true);

        const formDataFile = new FormData();
        formDataFile.append('file', selectedFile);
        formDataFile.append('title', noteData.title || selectedFile.name);
        formDataFile.append('description', noteData.description || '');
        formDataFile.append('type', noteData.type || 'file');
        formDataFile.append('isFree', noteData.isFree ? 'true' : 'false');

        try {
            console.log('Uploading to chapter:', selectedChapter);
            const response = await api.post(`/chapters/${selectedChapter}/notes`, formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('Upload response:', response.data);

            // Update the chapters state with the new note
            const updatedChapters = chapters.map(ch => {
                if (ch._id === selectedChapter) {
                    return {
                        ...ch,
                        notes: [...(ch.notes || []), response.data.note],
                    };
                }
                return ch;
            });
            setChapters(updatedChapters);
            setShowNoteForm(false);
            setNoteData({ title: '', description: '', type: 'file', isFree: false });
            setSelectedFile(null);
            setSelectedChapter(null);
            toast.success('Note uploaded successfully!');
            fetchCourse();
        } catch (error) {
            console.error('Upload note error:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to upload note';
            toast.error(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteNote = async (noteId, chapterId) => {
        if (!confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            const updatedChapters = chapters.map(ch => {
                if (ch._id === chapterId) {
                    return {
                        ...ch,
                        notes: ch.notes.filter(n => n._id !== noteId),
                    };
                }
                return ch;
            });
            setChapters(updatedChapters);
            toast.success('Note deleted successfully');
            fetchCourse();
        } catch (error) {
            console.error('Delete note error:', error);
            toast.error('Failed to delete note');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Course not found</h2>
                    <button
                        onClick={() => navigate('/teacher/dashboard')}
                        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Edit Course</h1>
                    <button
                        onClick={() => navigate('/teacher/dashboard')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {/* Course Info */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Information</h2>
                    <form onSubmit={handleUpdateCourse} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Programming">Programming</option>
                                    <option value="Design">Design</option>
                                    <option value="Business">Business</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Science">Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Languages">Languages</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Level</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Price ($)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPublished"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isPublished" className="ml-2 text-gray-700">Publish Course</label>
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Update Course
                        </button>
                    </form>
                </div>

                {/* Chapters */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Chapters & Content</h2>
                        <button
                            onClick={() => setShowChapterForm(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                        >
                            + Add Chapter
                        </button>
                    </div>

                    {chapters.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No chapters yet. Add your first chapter!</p>
                        </div>
                    ) : (
                        chapters.map((chapter, index) => (
                            <div key={chapter._id} className="border-b last:border-b-0 py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Chapter {index + 1}: {chapter.title}
                                        </h3>
                                        {chapter.description && (
                                            <p className="text-gray-600 text-sm">{chapter.description}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedChapter(chapter._id);
                                                setShowNoteForm(true);
                                            }}
                                            className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm hover:bg-green-100 transition"
                                        >
                                            + Add Note
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChapter(chapter._id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Notes */}
                                {chapter.notes && chapter.notes.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {chapter.notes.map(note => (
                                            <div key={note._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl">
                                                        {note.type === 'pdf' ? '📄' : 
                                                         note.type === 'video' ? '🎬' :
                                                         note.type === 'image' ? '🖼️' : '📁'}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{note.title}</p>
                                                        {note.description && (
                                                            <p className="text-sm text-gray-500">{note.description}</p>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {note.downloads || 0} downloads
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNote(note._id, chapter._id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Chapter Modal */}
            {showChapterForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Chapter</h2>
                        <form onSubmit={handleCreateChapter} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Chapter Title</label>
                                <input
                                    type="text"
                                    value={newChapter.title}
                                    onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description (optional)</label>
                                <textarea
                                    value={newChapter.description}
                                    onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowChapterForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Note Modal */}
            {showNoteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Note</h2>
                        <form onSubmit={handleUploadNote} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={noteData.title}
                                    onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter note title"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={noteData.description}
                                    onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter description"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">File Type</label>
                                <select
                                    value={noteData.type}
                                    onChange={(e) => setNoteData({ ...noteData, type: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="image">Image</option>
                                    <option value="file">File</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    accept={noteData.type === 'pdf' ? '.pdf' : 
                                            noteData.type === 'video' ? 'video/*' :
                                            noteData.type === 'image' ? 'image/*' : '*'}
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isFree"
                                    checked={noteData.isFree}
                                    onChange={(e) => setNoteData({ ...noteData, isFree: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isFree" className="ml-2 text-gray-700">Free (available to everyone)</label>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNoteForm(false);
                                        setSelectedChapter(null);
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseEdit;