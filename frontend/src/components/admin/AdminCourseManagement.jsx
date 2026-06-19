// components/admin/AdminCourseManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminCourseManagement = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Programming',
        level: 'Beginner',
        price: 0,
    });
    const [semesterData, setSemesterData] = useState({
        name: '',
        number: 1,
        description: '',
    });
    const [bookData, setBookData] = useState({
        title: '',
        description: '',
        author: '',
    });
    const [chapterData, setChapterData] = useState({
        title: '',
        description: '',
        order: 1,
    });
    const [noteData, setNoteData] = useState({
        title: '',
        description: '',
        type: 'file',
        isFree: false,
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error('Fetch courses error:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseDetails = async (courseId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get(`/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedCourse(response.data.course);
            setShowCourseDetail(true);
        } catch (error) {
            console.error('Fetch course details error:', error);
            toast.error('Failed to load course details');
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.post('/admin/courses', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    const handleCreateSemester = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.post(`/admin/courses/${selectedCourse._id}/semesters`, semesterData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update the selected course with new semester
            const updatedCourse = { ...selectedCourse };
            updatedCourse.semesters = [...(selectedCourse.semesters || []), response.data.semester];
            setSelectedCourse(updatedCourse);
            
            setShowSemesterModal(false);
            setSemesterData({ name: '', number: 1, description: '' });
            toast.success('Semester created successfully!');
            fetchCourses();
        } catch (error) {
            console.error('Create semester error:', error);
            toast.error(error.response?.data?.message || 'Failed to create semester');
        }
    };

    const handleCreateBook = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.post(`/admin/semesters/${selectedSemester._id}/books`, bookData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update the selected semester with new book
            const updatedSemester = { ...selectedSemester };
            updatedSemester.books = [...(selectedSemester.books || []), response.data.book];
            setSelectedSemester(updatedSemester);
            
            setShowBookModal(false);
            setBookData({ title: '', description: '', author: '' });
            toast.success('Book created successfully!');
            fetchCourses();
        } catch (error) {
            console.error('Create book error:', error);
            toast.error(error.response?.data?.message || 'Failed to create book');
        }
    };

    const handleCreateChapter = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.post(`/admin/books/${selectedBook._id}/chapters`, chapterData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update the selected book with new chapter
            const updatedBook = { ...selectedBook };
            updatedBook.chapters = [...(selectedBook.chapters || []), response.data.chapter];
            setSelectedBook(updatedBook);
            
            setShowChapterModal(false);
            setChapterData({ title: '', description: '', order: 1 });
            toast.success('Chapter created successfully!');
            fetchCourses();
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
            const token = localStorage.getItem('adminToken');
            const response = await api.post(`/admin/chapters/${selectedChapter._id}/notes`, formDataFile, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            // Update the selected chapter with new note
            const updatedChapter = { ...selectedChapter };
            updatedChapter.notes = [...(selectedChapter.notes || []), response.data.note];
            setSelectedChapter(updatedChapter);
            
            setShowNoteModal(false);
            setNoteData({ title: '', description: '', type: 'file', isFree: false });
            setSelectedFile(null);
            toast.success('Note uploaded successfully!');
            fetchCourses();
        } catch (error) {
            console.error('Upload note error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload note');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course and all its content?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(courses.filter(c => c._id !== courseId));
            if (selectedCourse && selectedCourse._id === courseId) {
                setSelectedCourse(null);
                setShowCourseDetail(false);
            }
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete course error:', error);
            toast.error('Failed to delete course');
        }
    };

    const handleDeleteSemester = async (semesterId) => {
        if (!window.confirm('Delete this semester and all its content?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/semesters/${semesterId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedCourse = { ...selectedCourse };
            updatedCourse.semesters = updatedCourse.semesters.filter(s => s._id !== semesterId);
            setSelectedCourse(updatedCourse);
            toast.success('Semester deleted successfully');
            fetchCourses();
        } catch (error) {
            console.error('Delete semester error:', error);
            toast.error('Failed to delete semester');
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm('Delete this book and all its content?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedSemester = { ...selectedSemester };
            updatedSemester.books = updatedSemester.books.filter(b => b._id !== bookId);
            setSelectedSemester(updatedSemester);
            toast.success('Book deleted successfully');
            fetchCourses();
        } catch (error) {
            console.error('Delete book error:', error);
            toast.error('Failed to delete book');
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!window.confirm('Delete this chapter and all its notes?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/chapters/${chapterId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedBook = { ...selectedBook };
            updatedBook.chapters = updatedBook.chapters.filter(c => c._id !== chapterId);
            setSelectedBook(updatedBook);
            toast.success('Chapter deleted successfully');
            fetchCourses();
        } catch (error) {
            console.error('Delete chapter error:', error);
            toast.error('Failed to delete chapter');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/notes/${noteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedChapter = { ...selectedChapter };
            updatedChapter.notes = updatedChapter.notes.filter(n => n._id !== noteId);
            setSelectedChapter(updatedChapter);
            toast.success('Note deleted successfully');
            fetchCourses();
        } catch (error) {
            console.error('Delete note error:', error);
            toast.error('Failed to delete note');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
                        <p className="text-gray-600">Create and manage courses, semesters, books, chapters, and notes</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Course
                    </button>
                </div>

                {/* Course List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-lg">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold text-gray-700">No courses yet</h3>
                            <p className="text-gray-500">Create your first course to get started</p>
                        </div>
                    ) : (
                        courses.map(course => (
                            <div key={course._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
                                    <span className="text-6xl">📘</span>
                                    <span className={`absolute top-4 right-4 text-xs px-2 py-1 rounded-full ${
                                        course.isPublished ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                                    }`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-indigo-600 font-semibold">${course.price}</span>
                                        <span className="text-gray-500">{course.semesters?.length || 0} Semesters</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setShowSemesterModal(true);
                                            }}
                                            className="flex-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-100 transition"
                                        >
                                            + Semester
                                        </button>
                                        <button
                                            onClick={() => fetchCourseDetails(course._id)}
                                            className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-100 transition"
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

                {/* Course Detail View */}
                {showCourseDetail && selectedCourse && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{selectedCourse.title} - Details</h2>
                            <button
                                onClick={() => {
                                    setShowCourseDetail(false);
                                    setSelectedCourse(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Semesters */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-800">Semesters</h3>
                                <button
                                    onClick={() => setShowSemesterModal(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                                >
                                    + Add Semester
                                </button>
                            </div>

                            {selectedCourse.semesters?.length === 0 ? (
                                <p className="text-gray-500">No semesters yet</p>
                            ) : (
                                selectedCourse.semesters.map(semester => (
                                    <div key={semester._id} className="border rounded-lg p-4 hover:shadow-md transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-800">
                                                    Semester {semester.number}: {semester.name}
                                                </h4>
                                                {semester.description && (
                                                    <p className="text-sm text-gray-600">{semester.description}</p>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSemester(semester);
                                                        setShowBookModal(true);
                                                    }}
                                                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-100 transition"
                                                >
                                                    + Book
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSemester(semester._id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Books */}
                                        {semester.books?.length > 0 && (
                                            <div className="mt-4 ml-4 space-y-3">
                                                <p className="font-medium text-gray-700">Books:</p>
                                                {semester.books.map(book => (
                                                    <div key={book._id} className="border-l-4 border-indigo-400 pl-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h5 className="font-semibold text-gray-800">{book.title}</h5>
                                                                {book.author && (
                                                                    <p className="text-sm text-gray-600">By: {book.author}</p>
                                                                )}
                                                                {book.description && (
                                                                    <p className="text-sm text-gray-500">{book.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBook(book);
                                                                        setShowChapterModal(true);
                                                                    }}
                                                                    className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-sm hover:bg-purple-100 transition"
                                                                >
                                                                    + Chapter
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBook(book._id)}
                                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Chapters */}
                                                        {book.chapters?.length > 0 && (
                                                            <div className="mt-3 ml-4 space-y-2">
                                                                <p className="font-medium text-gray-700 text-sm">Chapters:</p>
                                                                {book.chapters.map(chapter => (
                                                                    <div key={chapter._id} className="border-l-2 border-green-300 pl-3">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <h6 className="font-semibold text-gray-800 text-sm">
                                                                                    Chapter {chapter.order}: {chapter.title}
                                                                                </h6>
                                                                                {chapter.description && (
                                                                                    <p className="text-sm text-gray-500">{chapter.description}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex space-x-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedChapter(chapter);
                                                                                        setShowNoteModal(true);
                                                                                    }}
                                                                                    className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg text-sm hover:bg-yellow-100 transition"
                                                                                >
                                                                                    + Note
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteChapter(chapter._id)}
                                                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedChapter(chapter);
                                                                                        // Show notes
                                                                                    }}
                                                                                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                                                                                >
                                                                                    View Notes
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Notes */}
                                                                        {selectedChapter && selectedChapter._id === chapter._id && chapter.notes?.length > 0 && (
                                                                            <div className="mt-2 ml-4 space-y-1">
                                                                                {chapter.notes.map(note => (
                                                                                    <div key={note._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                                                        <div className="flex items-center space-x-2">
                                                                                            <span>
                                                                                                {note.type === 'pdf' ? '📄' :
                                                                                                 note.type === 'video' ? '🎬' :
                                                                                                 note.type === 'image' ? '🖼️' :
                                                                                                 note.type === 'audio' ? '🎵' :
                                                                                                 note.type === 'document' ? '📃' : '📁'}
                                                                                            </span>
                                                                                            <span className="text-sm text-gray-700">{note.title}</span>
                                                                                            {note.isFree && (
                                                                                                <span className="text-xs text-green-600">🆓 Free</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => handleDeleteNote(note._id)}
                                                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                                                        >
                                                                                            Delete
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
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
                                <label className="block text-gray-700 mb-2">Course Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description *</label>
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
                                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    Create Course
                                </button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            {showSemesterModal && selectedCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Semester to {selectedCourse.title}</h2>
                        <form onSubmit={handleCreateSemester} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Semester Name *</label>
                                <input
                                    type="text"
                                    value={semesterData.name}
                                    onChange={(e) => setSemesterData({ ...semesterData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Semester Number</label>
                                <input
                                    type="number"
                                    value={semesterData.number}
                                    onChange={(e) => setSemesterData({ ...semesterData, number: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={semesterData.description}
                                    onChange={(e) => setSemesterData({ ...semesterData, description: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    Create Semester
                                </button>
                                <button type="button" onClick={() => setShowSemesterModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Book Modal */}
            {showBookModal && selectedSemester && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Book to {selectedSemester.name}</h2>
                        <form onSubmit={handleCreateBook} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Book Title *</label>
                                <input
                                    type="text"
                                    value={bookData.title}
                                    onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={bookData.description}
                                    onChange={(e) => setBookData({ ...bookData, description: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Author</label>
                                <input
                                    type="text"
                                    value={bookData.author}
                                    onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    Create Book
                                </button>
                                <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chapter Modal */}
            {showChapterModal && selectedBook && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Chapter to {selectedBook.title}</h2>
                        <form onSubmit={handleCreateChapter} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Chapter Title *</label>
                                <input
                                    type="text"
                                    value={chapterData.title}
                                    onChange={(e) => setChapterData({ ...chapterData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={chapterData.description}
                                    onChange={(e) => setChapterData({ ...chapterData, description: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Order</label>
                                <input
                                    type="number"
                                    value={chapterData.order}
                                    onChange={(e) => setChapterData({ ...chapterData, order: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min="1"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    Create Chapter
                                </button>
                                <button type="button" onClick={() => setShowChapterModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Note Upload Modal */}
            {showNoteModal && selectedChapter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Note to {selectedChapter.title}</h2>
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
                                <textarea
                                    value={noteData.description}
                                    onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
                                    rows="2"
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
                                    <option value="audio">Audio</option>
                                    <option value="document">Document</option>
                                    <option value="file">File</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    Upload
                                </button>
                                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
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

export default AdminCourseManagement;