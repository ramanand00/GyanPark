// components/CourseLearn.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CourseLearn = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedNote, setSelectedNote] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/courses/${courseId}`);
            setCourse(response.data.course);
            if (response.data.course.chapters?.length > 0) {
                setSelectedChapter(response.data.course.chapters[0]);
                if (response.data.course.chapters[0].notes?.length > 0) {
                    setSelectedNote(response.data.course.chapters[0].notes[0]);
                }
            }
        } catch (error) {
            console.error('Fetch course error:', error);
            toast.error('Failed to load course content');
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadNote = async (noteId) => {
        setDownloading(true);
        try {
            const response = await api.post(`/notes/${noteId}/download`);
            window.open(response.data.downloadUrl, '_blank');
            toast.success('Download started!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.response?.data?.message || 'Failed to download');
        } finally {
            setDownloading(false);
        }
    };

    const getFileIcon = (type) => {
        switch(type) {
            case 'pdf': return '📄';
            case 'video': return '🎬';
            case 'image': return '🖼️';
            default: return '📁';
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
                    <Link to="/courses" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link to={`/course/${courseId}`} className="text-indigo-600 hover:text-indigo-800">
                                ← Back to Course
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-800 mt-1">{course.title}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                {course.chapters?.length || 0} Chapters
                            </span>
                            <span className="text-sm text-gray-500">
                                {course.chapters?.reduce((acc, ch) => acc + (ch.notes?.length || 0), 0)} Notes
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Chapters List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
                            <h3 className="font-bold text-gray-800 mb-4">Course Content</h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {course.chapters?.map((chapter, index) => (
                                    <button
                                        key={chapter._id}
                                        onClick={() => {
                                            setSelectedChapter(chapter);
                                            setSelectedNote(chapter.notes?.[0] || null);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg transition ${
                                            selectedChapter?._id === chapter._id
                                                ? 'bg-indigo-50 border-indigo-500 border'
                                                : 'hover:bg-gray-50 border-transparent border'
                                        }`}
                                    >
                                        <div className="font-medium text-gray-800 text-sm">
                                            Chapter {index + 1}
                                        </div>
                                        <div className="text-gray-600 text-sm">{chapter.title}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {chapter.notes?.length || 0} notes
                                        </div>
                                    </button>
                                ))}
                                {(!course.chapters || course.chapters.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No chapters available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Notes Display */}
                    <div className="lg:col-span-3">
                        {selectedChapter ? (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {selectedChapter.title}
                                    </h2>
                                    {selectedChapter.description && (
                                        <p className="text-gray-600 mt-2">{selectedChapter.description}</p>
                                    )}
                                </div>

                                {/* Notes List */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Notes & Resources</h3>
                                    {selectedChapter.notes?.length === 0 ? (
                                        <p className="text-gray-500">No notes available for this chapter</p>
                                    ) : (
                                        selectedChapter.notes.map((note) => (
                                            <div
                                                key={note._id}
                                                className={`border rounded-lg p-4 hover:shadow-md transition ${
                                                    selectedNote?._id === note._id ? 'border-indigo-500 bg-indigo-50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl">{getFileIcon(note.type)}</span>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{note.title}</h4>
                                                                {note.description && (
                                                                    <p className="text-sm text-gray-600">{note.description}</p>
                                                                )}
                                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                                    <span>{note.type.toUpperCase()}</span>
                                                                    {note.fileSize && (
                                                                        <span>{(note.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                                    )}
                                                                    {note.isFree && (
                                                                        <span className="text-green-600">🆓 Free</span>
                                                                    )}
                                                                    <span>📥 {note.downloads || 0} downloads</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadNote(note._id)}
                                                        disabled={downloading}
                                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                                    >
                                                        {downloading ? 'Downloading...' : 'Download'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Progress / Navigation */}
                                <div className="mt-8 pt-6 border-t flex justify-between">
                                    <button
                                        onClick={() => {
                                            const currentIndex = course.chapters.findIndex(ch => ch._id === selectedChapter._id);
                                            if (currentIndex > 0) {
                                                setSelectedChapter(course.chapters[currentIndex - 1]);
                                                setSelectedNote(course.chapters[currentIndex - 1].notes?.[0] || null);
                                            }
                                        }}
                                        disabled={course.chapters.findIndex(ch => ch._id === selectedChapter._id) === 0}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex = course.chapters.findIndex(ch => ch._id === selectedChapter._id);
                                            if (currentIndex < course.chapters.length - 1) {
                                                setSelectedChapter(course.chapters[currentIndex + 1]);
                                                setSelectedNote(course.chapters[currentIndex + 1].notes?.[0] || null);
                                            }
                                        }}
                                        disabled={course.chapters.findIndex(ch => ch._id === selectedChapter._id) === course.chapters.length - 1}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                                <p className="text-gray-500">Select a chapter to view its content</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseLearn;