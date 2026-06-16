import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Homepage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                GyanPark
                            </h1>
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
                        <div className="flex justify-center space-x-4">
                            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                                Explore Courses
                            </button>
                            {user?.role === 'teacher' && (
                                <button className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition">
                                    Create Course
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
                        <p className="text-gray-600">Access high-quality learning materials from expert educators</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold mb-2">Personalized Learning</h3>
                        <p className="text-gray-600">Learn at your own pace with customized learning paths</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="text-xl font-semibold mb-2">Community Support</h3>
                        <p className="text-gray-600">Connect with peers and mentors in our learning community</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Homepage;