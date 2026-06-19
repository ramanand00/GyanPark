// components/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        education: '',
        skills: '',
        socialLinks: {
            website: '',
            linkedin: '',
            github: '',
            twitter: '',
        },
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (user?.id || user?._id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const userId = user.id || user._id;
            console.log('Fetching profile for user ID:', userId);
            const response = await api.get(`/profile/${userId}`);
            setProfile(response.data.user);
            setFormData({
                name: response.data.user.name || '',
                bio: response.data.user.bio || '',
                education: response.data.user.education || '',
                skills: response.data.user.skills ? response.data.user.skills.join(', ') : '',
                socialLinks: response.data.user.socialLinks || {
                    website: '',
                    linkedin: '',
                    github: '',
                    twitter: '',
                },
            });
        } catch (error) {
            console.error('Profile fetch error:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update profile
            const response = await api.put('/profile', formData);
            setProfile(response.data.user);
            
            // Upload profile picture if selected
            if (selectedFile) {
                const formDataFile = new FormData();
                formDataFile.append('profilePicture', selectedFile);
                const uploadResponse = await api.post('/profile/picture', formDataFile, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setProfile(uploadResponse.data.user);
                toast.success('Profile picture updated!');
            }
            
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Profile not found</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <img
                                    src={profile?.profilePicture || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`}
                                    alt={profile?.name || 'User'}
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
                                <h1 className="text-2xl font-bold">{profile?.name}</h1>
                                <p className="text-indigo-200">{profile?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}</p>
                                <p className="text-sm text-indigo-200">{profile?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {profile?.role === 'teacher' 
                                    ? profile?.createdCourses?.length || 0
                                    : profile?.enrolledCourses?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600">
                                {profile?.role === 'teacher' ? 'Courses Created' : 'Courses Enrolled'}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{profile?.skills?.length || 0}</div>
                            <div className="text-sm text-gray-600">Skills</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">⭐</div>
                            <div className="text-sm text-gray-600">Rating</div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        {!isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">About</h2>
                                    <p className="text-gray-600 mt-2">{profile?.bio || 'No bio added yet'}</p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">Education</h2>
                                    <p className="text-gray-600 mt-2">{profile?.education || 'Not specified'}</p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">Skills</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {profile?.skills?.length > 0 ? (
                                            profile.skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                                                >
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No skills added</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">Social Links</h2>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {profile?.socialLinks?.website && (
                                            <a
                                                href={profile.socialLinks.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                🌐 Website
                                            </a>
                                        )}
                                        {profile?.socialLinks?.linkedin && (
                                            <a
                                                href={profile.socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                🔗 LinkedIn
                                            </a>
                                        )}
                                        {profile?.socialLinks?.github && (
                                            <a
                                                href={profile.socialLinks.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                💻 GitHub
                                            </a>
                                        )}
                                        {profile?.socialLinks?.twitter && (
                                            <a
                                                href={profile.socialLinks.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                🐦 Twitter
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Edit Profile
                                </button>

                                {/* Show courses */}
                                {profile?.role === 'teacher' && (
                                    <div className="mt-8">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Courses</h2>
                                        {profile.createdCourses?.length === 0 ? (
                                            <p className="text-gray-600">No courses created yet</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {profile.createdCourses.map(course => (
                                                    <Link
                                                        key={course._id}
                                                        to={`/course/${course._id}`}
                                                        className="border rounded-lg p-4 hover:shadow-lg transition"
                                                    >
                                                        <h3 className="font-semibold text-gray-800">{course.title}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {course.isPublished ? '✅ Published' : '📝 Draft'}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                    <label className="block text-gray-700 mb-2">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Education</label>
                                    <input
                                        type="text"
                                        name="education"
                                        value={formData.education}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Your educational background"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Skills (comma separated)</label>
                                    <input
                                        type="text"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="React, Node.js, Python"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Social Links</label>
                                    <div className="space-y-2">
                                        <input
                                            type="url"
                                            name="socialLinks.website"
                                            value={formData.socialLinks.website}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Website URL"
                                        />
                                        <input
                                            type="url"
                                            name="socialLinks.linkedin"
                                            value={formData.socialLinks.linkedin}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="LinkedIn URL"
                                        />
                                        <input
                                            type="url"
                                            name="socialLinks.github"
                                            value={formData.socialLinks.github}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="GitHub URL"
                                        />
                                        <input
                                            type="url"
                                            name="socialLinks.twitter"
                                            value={formData.socialLinks.twitter}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Twitter URL"
                                        />
                                    </div>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;