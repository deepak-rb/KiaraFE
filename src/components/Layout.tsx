import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import GlobalLoading from './GlobalLoading';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <GlobalLoading />
      <motion.main 
        className="main-content relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;
