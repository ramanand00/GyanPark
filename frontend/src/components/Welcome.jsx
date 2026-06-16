import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Welcome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                navigate('/home');
            } else {
                navigate('/login');
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <div className="text-center text-white">
                <h1 className="text-6xl font-bold mb-4 animate-bounce">
                    GyanPark
                </h1>
                <p className="text-2xl mb-8">Your Learning Journey Begins Here</p>
                <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-100"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
                </div>
                <p className="mt-8 text-sm">Redirecting you...</p>
            </div>
        </div>
    );
};

export default Welcome;