// pages/Homepage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Homepage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                GyanPark
                            </h1>
                            <div className="hidden md:flex space-x-4">
                                <Link to="/home" className="text-gray-700 hover:text-indigo-600 transition">
                                    Home
                                </Link>
                                <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition">
                                    Profile
                                </Link>
                                {user?.role === 'teacher' && (
                                    <Link to="/teacher/dashboard" className="text-gray-700 hover:text-indigo-600 transition">
                                        Dashboard
                                    </Link>
                                )}
                                <Link to="/courses" className="text-gray-700 hover:text-indigo-600 transition">
                                    Courses
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, {user?.name}!
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Welcome to GyanPark, {user?.name}!
                        </h1>
                        <p className="text-xl md:text-2xl mb-8">
                            Your {user?.role === 'teacher' ? 'teaching' : 'learning'} journey starts here
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                to="/courses"
                                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Explore Courses
                            </Link>
                            {user?.role === 'teacher' && (
                                <Link
                                    to="/teacher/dashboard"
                                    className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition"
                                >
                                    Create Course
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition"
                            >
                                My Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Courses Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Courses</h2>
                {courses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-700">No courses available yet</h3>
                        <p className="text-gray-500">Check back later for new courses</p>
                        {user?.role === 'teacher' && (
                            <Link
                                to="/teacher/dashboard"
                                className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Create Your First Course
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.slice(0, 6).map(course => (
                            <Link
                                key={course._id}
                                to={`/course/${course._id}`}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                            >
                                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-6xl">📚</span>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-indigo-600 font-semibold">${course.price}</span>
                                        <span className="text-gray-500 text-sm">
                                            👨‍🏫 {course.teacher?.name || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                            {course.category}
                                        </span>
                                        <span className="text-gray-500">
                                            📝 {course.chapters?.length || 0} chapters
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {courses.length > 6 && (
                    <div className="text-center mt-8">
                        <Link
                            to="/courses"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            View All Courses
                        </Link>
                    </div>
                )}
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why GyanPark?</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
                        <p className="text-gray-600">Access high-quality learning materials from expert educators</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold mb-2">Personalized Learning</h3>
                        <p className="text-gray-600">Learn at your own pace with customized learning paths</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="text-xl font-semibold mb-2">Community Support</h3>
                        <p className="text-gray-600">Connect with peers and mentors in our learning community</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600">
                        <p>© 2024 GyanPark. All rights reserved.</p>
                        <p className="text-sm mt-2">Empowering education through technology</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Homepage;