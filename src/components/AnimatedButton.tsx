import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  variant = 'primary',
  disabled = false,
  loading = false
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-all duration-200 transform
        ${buttonVariants[variant]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      whileHover={!disabled && !loading ? { 
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AnimatedButton;
