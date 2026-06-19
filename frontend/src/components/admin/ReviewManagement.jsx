// components/admin/ReviewManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/admin/reviews', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(response.data.reviews);
        } catch (error) {
            toast.error('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await api.delete(`/admin/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Review deleted successfully');
            fetchReviews();
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

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
                <h2 className="text-2xl font-bold text-gray-800">Review Management</h2>
                <span className="text-gray-500">Total: {reviews.length} reviews</span>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No reviews found
                                </td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={review.user?.profilePicture || `https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random`}
                                                alt={review.user?.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="font-medium text-gray-800">{review.user?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{review.course?.title}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className="text-yellow-400">★</span>
                                            <span className="ml-1 font-semibold">{review.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{review.comment}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteReview(review._id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
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

export default ReviewManagement;