// components/admin/AdminLayout.jsx
import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get admin data from localStorage
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const permissions = adminData?.permissions || {};

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    // Check if user has permission to manage admins
    const canManageAdmins = permissions.manageAdmins === true;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg overflow-y-auto z-50">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        GyanPark Admin
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {adminData?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Role: {adminData?.role || 'admin'}
                    </p>
                </div>
                
                <nav className="mt-4">
                    <Link
                        to="/admin/dashboard/overview"
                        className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                            isActive('/admin/dashboard/overview') 
                                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <span>📊</span>
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        to="/admin/dashboard/profile"
                        className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                            isActive('/admin/dashboard/profile') 
                                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <span>👤</span>
                        <span>My Profile</span>
                    </Link>

                    <Link
                        to="/admin/dashboard/users"
                        className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                            isActive('/admin/dashboard/users') 
                                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <span>👥</span>
                        <span>Users</span>
                    </Link>

                    <Link
                        to="/admin/dashboard/courses"
                        className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                            isActive('/admin/dashboard/courses') 
                                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <span>📚</span>
                        <span>Course Management</span>
                    </Link>

                    <Link
                        to="/admin/dashboard/reviews"
                        className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                            isActive('/admin/dashboard/reviews') 
                                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        <span>⭐</span>
                        <span>Reviews</span>
                    </Link>

                    {/* Only show Admin Management if user has permission */}
                    {canManageAdmins && (
                        <Link
                            to="/admin/dashboard/admins"
                            className={`w-full text-left px-6 py-3 transition flex items-center space-x-2 ${
                                isActive('/admin/dashboard/admins') 
                                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                                    : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <span>🛡️</span>
                            <span>Admin Management</span>
                        </Link>
                    )}

                    <div className="border-t mt-4 pt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                        >
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8 min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;