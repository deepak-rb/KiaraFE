import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Layout from './components/Layout';
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
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return isAuthenticated ? (
    <Layout>
      {children}
    </Layout>
  ) : (
    <Navigate to="/login" />
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <div className="App">
            <Routes>
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
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
