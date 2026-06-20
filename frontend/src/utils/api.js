// utils/api.js
import axios from 'axios';

// Make sure the base URL is correct - remove any trailing slashes
const API_URL = 'https://gyan-park-vqx8.vercel.app/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;