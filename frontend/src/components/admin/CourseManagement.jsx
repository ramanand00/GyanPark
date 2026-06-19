// components/admin/CourseManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data.courses);
        } catch (error) {
            toast.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Course deleted successfully');
            fetchCourses();
        } catch (error) {
            toast.error('Failed to delete course');
        }
    };

    const handleTogglePublish = async (courseId) => {
        try {
            const token = localStorage.getItem('adminToken');
            await api.put(`/admin/courses/${courseId}/toggle-publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Course status updated');
            fetchCourses();
        } catch (error) {
            toast.error('Failed to update course status');
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Course Management</h2>
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No courses found
                                </td>
                            </tr>
                        ) : (
                            filteredCourses.map(course => (
                                <tr key={course._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-800">{course.title}</p>
                                            <p className="text-sm text-gray-500">{course.category}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{course.teacher?.name}</td>
                                    <td className="px-6 py-4 font-semibold text-indigo-600">${course.price}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/course/${course._id}`}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                                                target="_blank"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleTogglePublish(course._id)}
                                                className={`text-sm ${
                                                    course.isPublished 
                                                        ? 'text-yellow-600 hover:text-yellow-800' 
                                                        : 'text-green-600 hover:text-green-800'
                                                }`}
                                            >
                                                {course.isPublished ? 'Unpublish' : 'Publish'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCourse(course._id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseManagement;