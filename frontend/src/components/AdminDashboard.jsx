// components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import DashboardOverview from './admin/DashboardOverview';
import UserManagement from './admin/UserManagement';
import CourseManagement from './admin/CourseManagement';
import AdminCourseManagement from './admin/AdminCourseManagement';
import ReviewManagement from './admin/ReviewManagement';
import AdminManagement from './admin/AdminManagement';
import AdminProfile from './admin/AdminProfile';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        // Check if admin is logged in
        const token = localStorage.getItem('adminToken');
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        
        if (!token) {
            navigate('/admin/login');
        } else {
            setIsAuthenticated(true);
            setPermissions(adminData.permissions || {});
        }
        setLoading(false);
    }, [navigate]);

    // If still loading, show spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" />;
    }

    // Check if user has permission to manage admins
    const canManageAdmins = permissions.manageAdmins === true;

    return (
        <AdminLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard/overview" />} />
                <Route path="overview" element={<DashboardOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="courses" element={<AdminCourseManagement />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="profile" element={<AdminProfile />} />
                
                {/* Only allow access to Admin Management if user has permission */}
                {canManageAdmins ? (
                    <Route path="admins" element={<AdminManagement />} />
                ) : (
                    <Route path="admins" element={<Navigate to="/admin/dashboard/overview" />} />
                )}
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/admin/dashboard/overview" />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminDashboard;