// components/CourseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        fetchCourse();
        fetchRelatedCourses();
        fetchReviews();
        checkCartStatus();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/courses/${courseId}`);
            setCourse(response.data.course);
            setIsEnrolled(response.data.isEnrolled);
        } catch (error) {
            console.error('Fetch course error:', error);
            toast.error('Failed to load course');
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedCourses = async () => {
        try {
            const response = await api.get('/courses');
            const allCourses = response.data.courses || [];
            // Filter out current course and get courses with same category
            const related = allCourses
                .filter(c => c._id !== courseId && c.category === course?.category)
                .slice(0, 4);
            setRelatedCourses(related);
        } catch (error) {
            console.error('Fetch related courses error:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            // Fetch real reviews from API
            const response = await api.get(`/courses/${courseId}/reviews`);
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Fetch reviews error:', error);
            // Set empty array if no reviews
            setReviews([]);
        }
    };

    const checkCartStatus = async () => {
        // Check if course is in cart (would be implemented with cart context/state)
        setIsInCart(false);
    };

    const handleEnroll = async () => {
        try {
            await api.post(`/courses/${courseId}/enroll`);
            setIsEnrolled(true);
            toast.success('Successfully enrolled in the course!');
            navigate(`/course/${courseId}/learn`);
        } catch (error) {
            console.error('Enroll error:', error);
            toast.error(error.response?.data?.message || 'Failed to enroll');
        }
    };

    const handleAddToCart = () => {
        setIsInCart(true);
        toast.success('Course added to cart!');
    };

    const handleRemoveFromCart = () => {
        setIsInCart(false);
        toast.success('Course removed from cart!');
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Please login to submit a review');
            return;
        }

        if (userRating === 0) {
            toast.error('Please select a rating');
            return;
        }
        
        if (!reviewText.trim()) {
            toast.error('Please write a review');
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await api.post(`/courses/${courseId}/reviews`, {
                rating: userRating,
                comment: reviewText
            });

            // Refresh reviews
            await fetchReviews();
            setUserRating(0);
            setReviewText('');
            toast.success('Review submitted successfully!');
        } catch (error) {
            console.error('Submit review error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-lg">
                        {star <= rating ? '★' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    const renderRatingStars = (rating, interactive = false) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && setUserRating(star)}
                        className={`text-2xl transition ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } ${interactive ? 'hover:scale-110' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Course not found</h2>
                    <Link to="/courses" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Course Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <nav className="text-sm text-indigo-200 mb-4">
                                <Link to="/" className="hover:text-white">Home</Link>
                                <span className="mx-2">/</span>
                                <Link to="/courses" className="hover:text-white">Courses</Link>
                                <span className="mx-2">/</span>
                                <span className="text-white">{course.title}</span>
                            </nav>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                            <p className="text-lg text-indigo-100 mb-6">{course.description}</p>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-yellow-400 text-xl">★</span>
                                    <span className="font-semibold">{course.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-indigo-200">({course.totalReviews || 0} reviews)</span>
                                </div>
                                <span className="bg-indigo-500 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                                    {course.category}
                                </span>
                                <span className="bg-indigo-500 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                                    {course.level}
                                </span>
                                <span className="bg-green-500 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                                    {course.chapters?.length || 0} Chapters
                                </span>
                                <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                                    {course.students?.length || 0} Students
                                </span>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-2xl p-6 text-gray-800">
                                <div className="text-3xl font-bold text-indigo-600 mb-4">
                                    ${course.price}
                                    {course.price > 0 && <span className="text-sm text-gray-500 font-normal"> / course</span>}
                                    {course.price === 0 && <span className="text-sm text-green-600 font-normal"> Free</span>}
                                </div>
                                <div className="space-y-3">
                                    {isEnrolled ? (
                                        <button
                                            onClick={() => navigate(`/course/${courseId}/learn`)}
                                            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                                        >
                                            ✅ Continue Learning
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleEnroll}
                                                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                                            >
                                                Enroll Now
                                            </button>
                                            {isInCart ? (
                                                <button
                                                    onClick={handleRemoveFromCart}
                                                    className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition font-semibold"
                                                >
                                                    Remove from Cart
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleAddToCart}
                                                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                                                >
                                                    🛒 Add to Cart
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 text-sm text-gray-500 space-y-2">
                                    <p>✓ Full lifetime access</p>
                                    <p>✓ Access on mobile and TV</p>
                                    <p>✓ Certificate of completion</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* What You'll Learn */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">What You'll Learn</h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Understand core concepts and fundamentals</span>
                                </li>
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Build practical real-world projects</span>
                                </li>
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Master advanced techniques and best practices</span>
                                </li>
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Get hands-on experience with industry tools</span>
                                </li>
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Learn from industry experts</span>
                                </li>
                                <li className="flex items-start space-x-2 text-gray-600">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span>Earn a certificate of completion</span>
                                </li>
                            </ul>
                        </div>

                        {/* Course Description */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Course</h2>
                            <div className="prose max-w-none text-gray-600">
                                <p>{course.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">{course.chapters?.length || 0}</div>
                                        <div className="text-sm text-gray-500">Chapters</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {course.chapters?.reduce((acc, ch) => acc + (ch.notes?.length || 0), 0) || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Notes</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">{course.students?.length || 0}</div>
                                        <div className="text-sm text-gray-500">Students</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">{course.level}</div>
                                        <div className="text-sm text-gray-500">Level</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Student Reviews</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-yellow-400 text-2xl">★</span>
                                    <span className="text-2xl font-bold text-gray-800">{course.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-gray-500">({course.totalReviews || 0} reviews)</span>
                                </div>
                            </div>
                            
                            {/* Review Form */}
                            {user && !isEnrolled && (
                                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <p className="text-yellow-700">
                                        🔒 Please enroll in this course to submit a review
                                    </p>
                                </div>
                            )}

                            {user && isEnrolled && (
                                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 mb-2">Your Rating</label>
                                        {renderRatingStars(userRating, true)}
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-gray-700 mb-2">Your Review</label>
                                        <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Share your experience with this course..."
                                            disabled={submittingReview}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review._id} className="border-b last:border-b-0 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={review.user?.profilePicture || `https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random`}
                                                        alt={review.user?.name || 'User'}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</p>
                                                        {renderStars(review.rating)}
                                                    </div>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mt-2 ml-14">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Instructor Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">About the Instructor</h3>
                            <div className="flex items-center space-x-3">
                                <img
                                    src={course.teacher?.profilePicture || `https://ui-avatars.com/api/?name=${course.teacher?.name || 'Instructor'}&background=random`}
                                    alt={course.teacher?.name || 'Instructor'}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-gray-800 text-lg">{course.teacher?.name || 'Unknown Instructor'}</p>
                                    <p className="text-sm text-gray-500">{course.teacher?.email}</p>
                                </div>
                            </div>
                            {course.teacher?.bio && (
                                <p className="text-gray-600 text-sm mt-3">{course.teacher.bio}</p>
                            )}
                            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                <span>📚 {course.teacher?.createdCourses?.length || 0} courses</span>
                                <span>👥 {course.students?.length || 0} students</span>
                            </div>
                        </div>

                        {/* Course Highlights */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Course Highlights</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">📋</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{course.category}</p>
                                        <p className="text-sm text-gray-500">Category</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{course.level}</p>
                                        <p className="text-sm text-gray-500">Level</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">📝</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{course.chapters?.length || 0}</p>
                                        <p className="text-sm text-gray-500">Chapters</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">👥</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{course.students?.length || 0}</p>
                                        <p className="text-sm text-gray-500">Total Students</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Courses */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Related Courses</h3>
                            <div className="space-y-3">
                                {relatedCourses.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No related courses found</p>
                                ) : (
                                    relatedCourses.map((relatedCourse) => (
                                        <Link
                                            key={relatedCourse._id}
                                            to={`/course/${relatedCourse._id}`}
                                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <h4 className="font-semibold text-gray-800 text-sm">{relatedCourse.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-1">{relatedCourse.description}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-indigo-600 font-bold">${relatedCourse.price}</span>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="text-sm text-gray-500">{relatedCourse.rating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                            <Link
                                to="/courses"
                                className="block text-center mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                                View All Courses →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;