// components/admin/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DashboardOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data.stats);
        } catch (error) {
            console.error('Fetch stats error:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login';
            }
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Users</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.users?.total || 0}</p>
                        </div>
                        <div className="text-4xl">👥</div>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-blue-600">Teachers: {stats.users?.teachers || 0}</span>
                        <span className="text-green-600">Students: {stats.users?.students || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Courses</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.courses?.total || 0}</p>
                        </div>
                        <div className="text-4xl">📚</div>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-green-600">Published: {stats.courses?.published || 0}</span>
                        <span className="text-yellow-600">Draft: {stats.courses?.draft || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Content</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.content?.notes || 0}</p>
                        </div>
                        <div className="text-4xl">📝</div>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-purple-600">Chapters: {stats.content?.chapters || 0}</span>
                        <span className="text-orange-600">Reviews: {stats.content?.reviews || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Revenue</p>
                            <p className="text-3xl font-bold text-green-600">${stats.revenue?.toFixed(2) || 0}</p>
                        </div>
                        <div className="text-4xl">💰</div>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-gray-600">Active Admins: {stats.admins || 0}</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Users</h3>
                    <div className="space-y-3">
                        {stats.recentUsers?.length > 0 ? (
                            stats.recentUsers.map(user => (
                                <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent users</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Courses</h3>
                    <div className="space-y-3">
                        {stats.recentCourses?.length > 0 ? (
                            stats.recentCourses.map(course => (
                                <div key={course._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800">{course.title}</p>
                                        <p className="text-sm text-gray-500">By {course.teacher?.name}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent courses</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;