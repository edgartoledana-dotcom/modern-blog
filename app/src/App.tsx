/**
 * Main App Component
 * Root component with routing configuration
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Layout Components
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Public Pages
import Home from '@/pages/Home';
import Blog from '@/pages/Blog';
import SinglePost from '@/pages/SinglePost';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Subscribe from '@/pages/Subscribe';

// Admin Pages
import AdminLogin from '@/admin/Login';
import AdminDashboard from '@/admin/Dashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Public Layout
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navigation />
    <main className="flex-1 pt-20">{children}</main>
    <Footer />
  </div>
);

// Admin Layout
const AdminLayout: React.FC = () => (
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />
            <Route
              path="/blog"
              element={
                <PublicLayout>
                  <Blog />
                </PublicLayout>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <PublicLayout>
                  <SinglePost />
                </PublicLayout>
              }
            />
            <Route
              path="/about"
              element={
                <PublicLayout>
                  <About />
                </PublicLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <PublicLayout>
                  <Contact />
                </PublicLayout>
              }
            />
            <Route
              path="/subscribe"
              element={
                <PublicLayout>
                  <Subscribe />
                </PublicLayout>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
