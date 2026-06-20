// utils/api.js
import axios from 'axios';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request for debugging
        console.log('API Request:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
            headers: config.headers
        });
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
        
        // Handle 401 errors
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api;