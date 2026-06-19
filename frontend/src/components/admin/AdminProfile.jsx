// components/AdminProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminProfile = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        profilePicture: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmin(response.data.admin);
            setFormData({
                name: response.data.admin.name || '',
                phone: response.data.admin.phone || '',
                bio: response.data.admin.bio || '',
                profilePicture: response.data.admin.profilePicture || '',
            });
        } catch (error) {
            console.error('Fetch profile error:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
            }
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.put('/admin/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Upload profile picture if selected
            if (selectedFile) {
                const formDataFile = new FormData();
                formDataFile.append('profilePicture', selectedFile);
                const uploadResponse = await api.post('/admin/profile/picture', formDataFile, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setAdmin(uploadResponse.data.admin);
            }

            setAdmin(response.data.admin);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Failed to update profile');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            await api.put('/admin/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            console.error('Change password error:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <img
                                    src={admin?.profilePicture || `https://ui-avatars.com/api/?name=${admin?.name || 'Admin'}&background=random`}
                                    alt={admin?.name || 'Admin'}
                                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                                />
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow-lg">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </label>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{admin?.name}</h1>
                                <p className="text-indigo-200">
                                    {admin?.role === 'super_admin' ? '👑 Super Admin' : '🛡️ Admin'}
                                </p>
                                <p className="text-sm text-indigo-200">{admin?.email}</p>
                                {admin?.lastLogin && (
                                    <p className="text-xs text-indigo-200 mt-1">
                                        Last login: {new Date(admin.lastLogin).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="bg-white text-indigo-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{admin?.role || 'Admin'}</div>
                            <div className="text-sm text-gray-600">Role</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {admin?.isActive ? '✅ Active' : '❌ Inactive'}
                            </div>
                            <div className="text-sm text-gray-600">Status</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {new Date(admin?.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">Joined</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {admin?.createdBy?.name || 'System'}
                            </div>
                            <div className="text-sm text-gray-600">Created By</div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-8">
                        {!isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">About</h2>
                                    <p className="text-gray-600">{admin?.bio || 'No bio added yet'}</p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Contact</h2>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Phone:</span> {admin?.phone || 'Not provided'}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Email:</span> {admin?.email}
                                    </p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Permissions</h2>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(admin?.permissions || {}).map(([key, value]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <span className={value ? 'text-green-500' : 'text-red-500'}>
                                                    {value ? '✅' : '❌'}
                                                </span>
                                                <span className="text-gray-600 text-sm">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex-1"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Change Password Section */}
                        <div className="mt-8 pt-8 border-t">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Change Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;