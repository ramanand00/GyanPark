import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import OTPVerification from '../components/OTPVerification';

const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: '',
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [otpData, setOtpData] = useState(null);
    
    // State for password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
        setStep(2);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSendOTP = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Please enter your name');
            return;
        }
        if (!formData.email.trim()) {
            toast.error('Please enter your email');
            return;
        }
        if (!formData.mobileNumber.trim()) {
            toast.error('Please enter your mobile number');
            return;
        }
        if (!formData.password) {
            toast.error('Please enter a password');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (!formData.email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending OTP to:', formData.email);
            const response = await api.post('/auth/send-otp', { email: formData.email });
            console.log('OTP response:', response.data);
            
            if (response.data.success) {
                toast.success('OTP sent! Check your terminal for the code');
                setOtpData({
                    email: formData.email,
                    name: formData.name,
                    mobileNumber: formData.mobileNumber,
                    password: formData.password,
                    role: formData.role
                });
                setStep(3);
            } else {
                toast.error(response.data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error sending OTP';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (otp) => {
        setLoading(true);
        try {
            // Use the stored data
            const verifyData = {
                email: otpData.email,
                otp: otp,
                name: otpData.name,
                mobileNumber: otpData.mobileNumber,
                password: otpData.password,
                role: otpData.role
            };
            
            console.log('Verifying with data:', verifyData);
            
            const response = await api.post('/auth/verify-otp', verifyData);
            
            console.log('Verify response:', response.data);
            
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                toast.success('Account created successfully!');
                navigate('/home');
            } else {
                toast.error(response.data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            console.error('Error response:', error.response);
            const errorMessage = error.response?.data?.message || error.message || 'Error verifying OTP';
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fadeIn">
                    <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Join GyanPark</h2>
                    <p className="text-center text-gray-600 mb-8">Select your role to continue</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => handleRoleSelect('student')}
                            className="w-full p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all transform hover:scale-105"
                        >
                            <div className="text-5xl mb-3">🎓</div>
                            <h3 className="text-xl font-semibold text-gray-800">Student</h3>
                            <p className="text-gray-600 text-sm mt-2">Learn and grow with us</p>
                        </button>
                        <button
                            onClick={() => handleRoleSelect('teacher')}
                            className="w-full p-6 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all transform hover:scale-105"
                        >
                            <div className="text-5xl mb-3">👨‍🏫</div>
                            <h3 className="text-xl font-semibold text-gray-800">Teacher</h3>
                            <p className="text-gray-600 text-sm mt-2">Share knowledge and inspire</p>
                        </button>
                    </div>
                    <p className="text-center text-gray-600 mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fadeIn">
                    <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Create Account</h2>
                    <p className="text-center text-gray-600 mb-6">Fill in your details</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-2 font-semibold">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2 font-semibold">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2 font-semibold">Mobile Number</label>
                            <input
                                type="tel"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                placeholder="+1234567890"
                                required
                            />
                        </div>
                        
                        {/* Password Field with Toggle */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-semibold">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
                                    placeholder="Minimum 6 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Confirm Password Field with Toggle */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-semibold">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold"
                        >
                            {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                        </button>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="w-full mt-4 text-gray-600 hover:text-gray-800 transition"
                    >
                        ← Back to Role Selection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <OTPVerification
            email={otpData?.email}
            onVerify={handleVerifyOTP}
            onResend={handleSendOTP}
            loading={loading}
        />
    );
};

export default Signup;