import React from 'react';
import Navbar from './Navbar';
import GlobalLoading from './GlobalLoading';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <GlobalLoading />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
