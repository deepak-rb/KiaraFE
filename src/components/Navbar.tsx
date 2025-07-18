import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg navbar-fixed border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center" onClick={closeMobileMenu}>
              <motion.div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-3 py-1 text-lg font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✚ Clinic
              </motion.div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/patients/add', label: 'Add Patient', short: 'Add' },
              { to: '/prescriptions/new', label: 'New Prescription', short: 'New Rx' },
              { to: '/prescriptions/all', label: 'All Prescriptions', short: 'All Rx' },
              { to: '/patients/search', label: 'Search Patient', short: 'Search' },
              { to: '/settings', label: 'Settings' }
            ].map((item, index) => (
              <div
                key={item.to}
                className="relative"
              >
                <Link
                  to={item.to}
                  className={`nav-item nav-link ${isActive(item.to) ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.short || item.label}</span>
                </Link>
                {isActive(item.to) && (
                  <motion.div
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    layoutId="underline"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">
              <span className="text-gray-600">Dr. </span>
              <span className="font-semibold">{doctor?.name}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isMobileMenuOpen ? "open" : "closed"}
                variants={{
                  open: { rotate: 90 },
                  closed: { rotate: 0 }
                }}
                transition={{ duration: 0.2 }}
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
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Mobile menu overlay */}
              <motion.div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
                onClick={closeMobileMenu}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              
              {/* Mobile menu content */}
              <motion.div 
                className="md:hidden relative z-40"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-xl rounded-b-lg">
                  {/* User info at top of mobile menu */}
                  <motion.div 
                    className="px-3 py-2 border-b border-gray-200 mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-sm">
                      <span className="text-gray-600">Dr. </span>
                      <span className="font-medium text-gray-900">{doctor?.name}</span>
                    </div>
                  </motion.div>
                  
                  {/* Navigation links */}
                  {[
                    { to: '/dashboard', label: 'Dashboard' },
                    { to: '/patients/add', label: 'Add Patient' },
                    { to: '/prescriptions/new', label: 'New Prescription' },
                    { to: '/prescriptions/all', label: 'All Prescriptions' },
                    { to: '/patients/search', label: 'Search Patient' },
                    { to: '/settings', label: 'Settings' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <Link
                        to={item.to}
                        className={`mobile-nav-link ${isActive(item.to) ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'}`}
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Logout button */}
                  <motion.button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="mobile-nav-link mobile-nav-link-inactive w-full text-left border-t border-gray-200 pt-2 mt-2 hover:text-red-600 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
