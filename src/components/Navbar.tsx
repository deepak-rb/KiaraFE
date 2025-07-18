import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SweetAlert } from '../utils/SweetAlert';

const Navbar: React.FC = () => {
  const { doctor, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    const result = await SweetAlert.confirm(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      'Yes, logout',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      logout();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg navbar-fixed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center" onClick={closeMobileMenu}>
              <div className="bg-blue-600 text-white rounded-lg px-3 py-1 text-lg font-bold">
                Clinic
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/patients/add"
              className={`nav-link ${isActive('/patients/add') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <span className="hidden lg:inline">Add Patient</span>
              <span className="lg:hidden">Add</span>
            </Link>
            <Link
              to="/prescriptions/new"
              className={`nav-link ${isActive('/prescriptions/new') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <span className="hidden lg:inline">New Prescription</span>
              <span className="lg:hidden">New Rx</span>
            </Link>
            <Link
              to="/prescriptions/all"
              className={`nav-link ${isActive('/prescriptions/all') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <span className="hidden lg:inline">All Prescriptions</span>
              <span className="lg:hidden">All Rx</span>
            </Link>
            <Link
              to="/patients/search"
              className={`nav-link ${isActive('/patients/search') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <span className="hidden lg:inline">Search Patient</span>
              <span className="lg:hidden">Search</span>
            </Link>
            <Link
              to="/settings"
              className={`nav-link ${isActive('/settings') ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              Settings
            </Link>
          </div>

          {/* Desktop User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">Dr. </span>
              <span className="font-medium text-gray-900">{doctor?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <>
            {/* Mobile menu overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
              onClick={closeMobileMenu}
            ></div>
            
            {/* Mobile menu content */}
            <div className="md:hidden relative z-40">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 shadow-lg">
                {/* User info at top of mobile menu */}
                <div className="px-3 py-2 border-b border-gray-200 mb-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Dr. </span>
                    <span className="font-medium text-gray-900">{doctor?.name}</span>
                  </div>
                </div>
                
                {/* Navigation links */}
                <Link
                  to="/dashboard"
                  className={`mobile-nav-link ${isActive('/dashboard') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/patients/add"
                  className={`mobile-nav-link ${isActive('/patients/add') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  Add Patient
                </Link>
                <Link
                  to="/prescriptions/new"
                  className={`mobile-nav-link ${isActive('/prescriptions/new') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  New Prescription
                </Link>
                <Link
                  to="/prescriptions/all"
                  className={`mobile-nav-link ${isActive('/prescriptions/all') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  All Prescriptions
                </Link>
                <Link
                  to="/patients/search"
                  className={`mobile-nav-link ${isActive('/patients/search') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  Search Patient
                </Link>
                <Link
                  to="/settings"
                  className={`mobile-nav-link ${isActive('/settings') ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                  onClick={closeMobileMenu}
                >
                  Settings
                </Link>
                
                {/* Logout button */}
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="mobile-nav-link mobile-nav-link-inactive w-full text-left border-t border-gray-200 pt-2 mt-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
