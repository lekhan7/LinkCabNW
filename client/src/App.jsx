import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from './utils/constants';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Toast from './components/Toast';
import Navbar from './components/Navbar';
import AuthInitializer from './components/AuthInitializer';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import OTPVerification from './pages/OTPVerification';
import Dashboard from './pages/Dashboard';
import CreateAnnouncement from './pages/CreateAnnouncement';
import Announcements from './pages/Announcements';
import CoPassengerManagement from './pages/CoPassengerManager';
import CoPassengerDetailsManagement from './pages/CoPassengerDetailsPage';
import MyAnnouncements from './pages/MyAnnouncements';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import AnalyticsNew from './pages/AnalyticsNew';
import Profile from './pages/Profile';
import FavoriteRides from './pages/FavoriteRides';
import AnnouncementDetails from './pages/AnnouncementDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import EmergencySupport from './pages/EmergencySupport';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';


function App() {
  const location = useLocation();
  
  const hideNavbarRoutes = ['/login', '/signup', '/otp', '/admin/login', '/admin'];
  const shouldHideNavbar = hideNavbarRoutes.some(route => location.pathname.startsWith(route));

  const pageVariants = {
    initial: {
      opacity: 0,
      x: -20,
    },
    in: {
      opacity: 1,
      x: 0,
    },
    out: {
      opacity: 0,
      x: 20,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        color: COLORS.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Initialize Authentication */}
      <AuthInitializer />
      
      {/* Conditional Navbar */}
      {!shouldHideNavbar && <Navbar />}
      
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Login />
              </motion.div>
            }
          />
          <Route
            path="/signup"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Signup />
              </motion.div>
            }
          />
          <Route
            path="/otp"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <OTPVerification />
              </motion.div>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/login"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <AdminLogin />
              </motion.div>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Dashboard />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-announcement"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <CreateAnnouncement />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Announcements />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/co-passenger-management"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <CoPassengerManagement />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/co-passenger-management/:announcementId"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <CoPassengerDetailsManagement />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-announcements"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MyAnnouncements />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcement/:id"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <AnnouncementDetails />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Notifications />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <AnalyticsNew />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Profile />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorite-rides"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <FavoriteRides />
                </motion.div>
              </ProtectedRoute>
            }
          />
          

          {/* Legal & Support Routes */}
          <Route
            path="/privacy-policy"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <PrivacyPolicy />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/terms-and-conditions"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <TermsAndConditions />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-support"
            element={
              <ProtectedRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <EmergencySupport />
                </motion.div>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          />

          {/* Catch all route - MUST BE LAST */}
          <Route
            path="*"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '100vh',
                  textAlign: 'center',
                  padding: '2rem',
                }}
              >
                <h1
                  style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: '#F5C400',
                    marginBottom: '1rem',
                  }}
                >
                  404
                </h1>
                <h2
                  style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '1rem',
                  }}
                >
                  Route Not Found
                </h2>
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#6B7280',
                    marginBottom: '2rem',
                    maxWidth: '500px',
                  }}
                >
                  The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                  to="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#F5C400',
                    color: '#1F2937',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#E5B800';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#F5C400';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Go Home
                </Link>
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>

      {/* Global Toast */}
      <Toast />
    </div>
  );
}

export default App;
