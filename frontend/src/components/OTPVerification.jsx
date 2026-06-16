import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const OTPVerification = ({ email, onVerify, onResend, loading }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(300);
    const [canResend, setCanResend] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index, value) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async () => {
        const otpValue = otp.join('');
        if (otpValue.length === 6) {
            setIsVerifying(true);
            try {
                await onVerify(otpValue);
            } catch (error) {
                console.error('Verification error:', error);
                toast.error(error.response?.data?.message || 'Verification failed');
                setOtp(['', '', '', '', '', '']);
                document.getElementById('otp-0')?.focus();
            } finally {
                setIsVerifying(false);
            }
        } else {
            toast.error('Please enter complete 6-digit OTP');
        }
    };

    const handleResend = async () => {
        if (canResend && !loading) {
            try {
                await onResend();
                setTimer(300);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                toast.success('OTP resent successfully!');
                document.getElementById('otp-0')?.focus();
            } catch (error) {
                toast.error('Failed to resend OTP');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fadeIn">
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
                    Verify Your Email
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    We've sent a verification code to <br />
                    <span className="font-semibold text-indigo-600">{email}</span>
                </p>
                <p className="text-center text-sm text-gray-500 mb-4">
                    Check your terminal/console for the OTP (Development Mode)
                </p>

                <div className="flex justify-center space-x-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
                            autoFocus={index === 0}
                            disabled={isVerifying}
                        />
                    ))}
                </div>

                <div className="text-center mb-6">
                    <p className="text-gray-600">
                        Time remaining: <span className="font-semibold text-indigo-600">{formatTime(timer)}</span>
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isVerifying || loading || otp.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold mb-4"
                >
                    {isVerifying || loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                {canResend && (
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full text-indigo-600 hover:underline transition"
                    >
                        Resend OTP
                    </button>
                )}
            </div>
        </div>
    );
};

export default OTPVerification;