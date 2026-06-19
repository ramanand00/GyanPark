// components/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Programming',
        level: 'Beginner',
        price: 0,
    });
    const [chapterData, setChapterData] = useState({
        title: '',
        description: '',
        order: 1
    });
    const [noteData, setNoteData] = useState({
        title: '',
        description: '',
        type: 'file',
        isFree: false
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id || user?._id) {
            fetchCourses();
        }
    }, [user]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/teacher/courses');
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error('Fetch courses error:', error);
            toast.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/courses', formData);
            setCourses([response.data.course, ...courses]);
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                category: 'Programming',
                level: 'Beginner',
                price: 0,
            });
            toast.success('Course created successfully!');
        } catch (error) {
            console.error('Create course error:', error);
            toast.error(error.response?.data?.message || 'Failed to create course');
        }
    };

    const handleCreateChapter = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/courses/${selectedCourse._id}/chapters`, chapterData);
            const updatedCourses = courses.map(course => {
                if (course._id === selectedCourse._id) {
                    return {
                        ...course,
                        chapters: [...(course.chapters || []), response.data.chapter]
                    };
                }
                return course;
            });
            setCourses(updatedCourses);
            setShowChapterModal(false);
            setChapterData({ title: '', description: '', order: 1 });
            toast.success('Chapter created successfully!');
        } catch (error) {
            console.error('Create chapter error:', error);
            toast.error(error.response?.data?.message || 'Failed to create chapter');
        }
    };

    const handleUploadNote = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        const formDataFile = new FormData();
        formDataFile.append('file', selectedFile);
        formDataFile.append('title', noteData.title);
        formDataFile.append('description', noteData.description);
        formDataFile.append('type', noteData.type);
        formDataFile.append('isFree', noteData.isFree);

        try {
            const response = await api.post(`/chapters/${selectedChapter}/notes`, formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const updatedCourses = courses.map(course => {
                if (course._id === selectedCourse._id) {
                    const updatedChapters = course.chapters.map(ch => {
                        if (ch._id === selectedChapter) {
                            return {
                                ...ch,
                                notes: [...(ch.notes || []), response.data.note]
                            };
                        }
                        return ch;
                    });
                    return {
                        ...course,
                        chapters: updatedChapters
                    };
                }
                return course;
            });
            setCourses(updatedCourses);
            setShowNoteModal(false);
            setNoteData({ title: '', description: '', type: 'file', isFree: false });
            setSelectedFile(null);
            toast.success('Note uploaded successfully!');
        } catch (error) {
            console.error('Upload note error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload note');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course and all its content?')) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(courses.filter(c => c._id !== courseId));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete course error:', error);
            toast.error('Failed to delete course');
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm('Delete this chapter and all its notes?')) return;
        try {
            await api.delete(`/chapters/${chapterId}`);
            const updatedCourses = courses.map(course => {
                if (course._id === selectedCourse._id) {
                    return {
                        ...course,
                        chapters: course.chapters.filter(c => c._id !== chapterId)
                    };
                }
                return course;
            });
            setCourses(updatedCourses);
            toast.success('Chapter deleted successfully');
        } catch (error) {
            console.error('Delete chapter error:', error);
            toast.error('Failed to delete chapter');
        }
    };

    const handleDeleteNote = async (noteId, chapterId) => {
        if (!confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            const updatedCourses = courses.map(course => {
                if (course._id === selectedCourse._id) {
                    const updatedChapters = course.chapters.map(ch => {
                        if (ch._id === chapterId) {
                            return {
                                ...ch,
                                notes: ch.notes.filter(n => n._id !== noteId)
                            };
                        }
                        return ch;
                    });
                    return {
                        ...course,
                        chapters: updatedChapters
                    };
                }
                return course;
            });
            setCourses(updatedCourses);
            toast.success('Note deleted successfully');
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

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
                        <p className="text-gray-600">Manage your courses, chapters, and content</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Course
                    </button>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold text-gray-700">No courses yet</h3>
                            <p className="text-gray-500">Start creating your first course!</p>
                        </div>
                    ) : (
                        courses.map(course => (
                            <div key={course._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-6xl">📘</span>
                                    )}
                                    <span className={`absolute top-4 right-4 text-xs px-2 py-1 rounded-full ${
                                        course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-indigo-600 font-semibold">${course.price}</span>
                                        <span className="text-gray-500">{course.chapters?.length || 0} chapters</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setShowChapterModal(true);
                                            }}
                                            className="flex-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-100 transition"
                                        >
                                            + Chapter
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                navigate(`/course/edit/${course._id}`);
                                            }}
                                            className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-100 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => navigate(`/course/${course._id}`)}
                                            className="flex-1 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(course._id)}
                                            className="flex-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Show chapters and notes for selected course */}
                {selectedCourse && !showChapterModal && !showNoteModal && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Chapters: {selectedCourse.title}
                            </h2>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                        {selectedCourse.chapters?.length === 0 ? (
                            <p className="text-gray-500">No chapters yet. Add your first chapter!</p>
                        ) : (
                            selectedCourse.chapters.map((chapter, index) => (
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
                                                    setShowNoteModal(true);
                                                }}
                                                className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm hover:bg-green-100 transition"
                                            >
                                                + Note
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
                )}
            </div>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Course</h2>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Course Title</label>
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
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Create Course
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Chapter Modal */}
            {showChapterModal && selectedCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Chapter to {selectedCourse.title}</h2>
                        <form onSubmit={handleCreateChapter} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Chapter Title</label>
                                <input
                                    type="text"
                                    value={chapterData.title}
                                    onChange={(e) => setChapterData({ ...chapterData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description (optional)</label>
                                <textarea
                                    value={chapterData.description}
                                    onChange={(e) => setChapterData({ ...chapterData, description: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Create Chapter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChapterModal(false);
                                        setSelectedCourse(null);
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

            {/* Upload Note Modal */}
            {showNoteModal && selectedCourse && (
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
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={noteData.description}
                                    onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNoteModal(false);
                                        setSelectedCourse(null);
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

export default TeacherDashboard;