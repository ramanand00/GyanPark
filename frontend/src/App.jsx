// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Components
import Welcome from './components/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';

// User Components
import Homepage from './pages/Homepage';
import ProfilePage from './components/ProfilePage';
import CoursesList from './components/CoursesList';
import CourseDetail from './components/CourseDetail';
import CourseLearn from './components/CourseLearn';
import CourseEdit from './components/CourseEdit';
import TeacherDashboard from './components/TeacherDashboard';

// Admin Components
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }
    
    return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Admin Routes - Direct path */}
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* User Protected Routes */}
            <Route path="/home" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesList /></ProtectedRoute>} />
            <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/course/:courseId/learn" element={<ProtectedRoute><CourseLearn /></ProtectedRoute>} />
            <Route path="/course/edit/:courseId" element={<ProtectedRoute><CourseEdit /></ProtectedRoute>} />
            <Route path="/teacher/dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                />
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;