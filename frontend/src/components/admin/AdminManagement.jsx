// components/admin/AdminManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminManagement = () => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        phone: '',
        bio: '',
        permissions: {
            manageUsers: true,
            manageCourses: true,
            manageChapters: true,
            manageNotes: true,
            manageReviews: true,
            manageAdmins: false,
            viewAnalytics: true,
        }
    });

    useEffect(() => {
        // Check permissions
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const userPermissions = adminData.permissions || {};
        setPermissions(userPermissions);

        // If user doesn't have permission to manage admins, redirect
        if (!userPermissions.manageAdmins) {
            toast.error('You do not have permission to manage admins');
            navigate('/admin/dashboard/overview');
            return;
        }

        fetchAdmins();
    }, [navigate]);

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/admins', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(response.data.admins);
        } catch (error) {
            console.error('Fetch admins error:', error);
            toast.error('Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    // Rest of the component code remains the same...
    // (The handleCreateAdmin, handleUpdateAdmin, handleDeleteAdmin, 
    // handleToggleStatus, handleEditClick, resetForm, handlePermissionChange functions)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // If user doesn't have permission, show access denied
    if (!permissions.manageAdmins) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-600 mt-2">You don't have permission to manage admins.</p>
                <button
                    onClick={() => navigate('/admin/dashboard/overview')}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
                        <p className="text-gray-600">Manage administrators and their permissions</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Admin
                    </button>
                </div>

                {/* Admins List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No admins found. Create your first admin!
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={admin.profilePicture || `https://ui-avatars.com/api/?name=${admin.name}&background=random`}
                                                    alt={admin.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-800">{admin.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Joined {new Date(admin.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                admin.role === 'super_admin' 
                                                    ? 'bg-purple-100 text-purple-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {admin.role === 'super_admin' ? '👑 Super Admin' : '🛡️ Admin'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                admin.isActive 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {admin.createdBy?.name || 'System'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(admin)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(admin._id)}
                                                    className={`text-sm ${
                                                        admin.isActive 
                                                            ? 'text-yellow-600 hover:text-yellow-800' 
                                                            : 'text-green-600 hover:text-green-800'
                                                    }`}
                                                >
                                                    {admin.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                {admin.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin._id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal - Same as before */}
            {/* Edit Admin Modal - Same as before */}
        </div>
    );
};

export default AdminManagement;