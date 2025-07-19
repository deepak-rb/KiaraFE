import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Layout from './components/Layout';
import AnimatedRoute from './components/AnimatedRoute';
import ScrollEndIndicator from './components/ScrollEndIndicator';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import SearchPatients from './pages/SearchPatients';
import NewPrescription from './pages/NewPrescription';
import EditPrescription from './pages/EditPrescription';
import PrescriptionView from './pages/PrescriptionView';
import AllPrescriptions from './pages/AllPrescriptions';
import Settings from './pages/Settings';
import ForcePasswordChange from './pages/ForcePasswordChange';
import './App.css';

// Component to scroll to top when route changes
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);
  
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, doctor, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user needs to change password
  if (doctor?.requirePasswordChange) {
    return <Navigate to="/force-password-change" />;
  }
  
  return (
    <Layout>
      <AnimatedRoute>
        {children}
      </AnimatedRoute>
    </Layout>
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? (
    <AnimatedRoute>
      {children}
    </AnimatedRoute>
  ) : (
    <Navigate to="/dashboard" />
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/patients/add" element={
          <ProtectedRoute>
            <AddPatient />
          </ProtectedRoute>
        } />
        <Route path="/patients/edit/:id" element={
          <ProtectedRoute>
            <EditPatient />
          </ProtectedRoute>
        } />
        <Route path="/patients/search" element={
          <ProtectedRoute>
            <SearchPatients />
          </ProtectedRoute>
        } />
        <Route path="/prescriptions/new" element={
          <ProtectedRoute>
            <NewPrescription />
          </ProtectedRoute>
        } />
        <Route path="/prescriptions/edit/:id" element={
          <ProtectedRoute>
            <EditPrescription />
          </ProtectedRoute>
        } />
        <Route path="/prescriptions/all" element={
          <ProtectedRoute>
            <AllPrescriptions />
          </ProtectedRoute>
        } />
        <Route path="/prescriptions/:id" element={
          <ProtectedRoute>
            <PrescriptionView />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/force-password-change" element={
          <AnimatedRoute>
            <ForcePasswordChange />
          </AnimatedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <ScrollToTop />
          <div className="App bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen" style={{ overflow: 'hidden auto' }}>
            <AnimatedRoutes />
            <ScrollEndIndicator />
          </div>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
