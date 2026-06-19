// components/CoursesList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CoursesList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error('Fetch courses error:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             course.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = category === '' || course.category === category;
        return matchesSearch && matchesCategory;
    });

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">All Courses</h1>
                    
                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Categories</option>
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
                </div>

                {/* Course Grid */}
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-700">No courses found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => (
                            <Link
                                key={course._id}
                                to={`/course/${course._id}`}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                            >
                                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-6xl">📚</span>
                                    )}
                                    {course.level && (
                                        <span className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                                            {course.level}
                                        </span>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">{course.title}</h3>
                                        <span className="text-indigo-600 font-bold">${course.price}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            👨‍🏫 {course.teacher?.name || 'Unknown'}
                                        </span>
                                        <span className="text-gray-500">
                                            📝 {course.chapters?.length || 0} chapters
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                            {course.category}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                            ⭐ {course.rating || 0} ({course.totalReviews || 0})
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {course.isPublished ? '✅ Published' : '📝 Draft'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;