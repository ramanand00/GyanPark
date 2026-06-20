// pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.email.trim()) {
            toast.error('Please enter your email');
            return;
        }
        if (!formData.password) {
            toast.error('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Attempting login to:', api.defaults.baseURL);
            console.log('📧 Email:', formData.email);
            
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });
            
            console.log('✅ Login response:', response.data);
            
            if (response.data.success) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                
                // Call the login function from AuthContext
                await login(formData.email, formData.password);
                
                toast.success('Login successful! Welcome back!');
                
                // Navigate to home
                navigate('/home');
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            // Detailed error handling
            if (error.code === 'ERR_NETWORK') {
                toast.error('Network error. Please check your connection and try again.');
            } else if (error.response) {
                // The request was made and the server responded with a status code
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                
                switch (error.response.status) {
                    case 401:
                        toast.error('Invalid email or password. Please try again.');
                        break;
                    case 403:
                        toast.error('Your account is not verified. Please check your email.');
                        break;
                    case 404:
                        toast.error('Login service not found. Please try again later.');
                        break;
                    case 500:
                        toast.error('Server error. Please try again later.');
                        break;
                    default:
                        toast.error(error.response.data?.message || 'Login failed. Please try again.');
                }
            } else if (error.request) {
                // The request was made but no response was received
                toast.error('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request
                toast.error(error.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fadeIn">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome Back!
                    </h2>
                    <p className="text-gray-600">
                        Sign in to continue your learning journey
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Password with show/hide */}
                    <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition focus:outline-none"
                                disabled={loading}
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:text-indigo-800 transition font-medium"
                            onClick={() => toast.info('Please contact support to reset your password')}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold text-lg flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Signup link */}
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition">
                        Create one here
                    </Link>
                </p>

                {/* Debug info - Only in development */}
                {import.meta.env.DEV && (
                    <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs">
                        <p className="text-gray-500 font-mono">
                            API URL: {api.defaults.baseURL}
                        </p>
                        <p className="text-gray-500 font-mono mt-1">
                            Environment: {import.meta.env.MODE}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;