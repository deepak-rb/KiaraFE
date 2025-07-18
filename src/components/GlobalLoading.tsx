import React from 'react';
import { useLoading } from '../context/LoadingContext';

const GlobalLoading: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="spinner mb-4"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default GlobalLoading;
