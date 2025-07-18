import React from 'react';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'red';
  position?: 'bottom-right' | 'bottom-left';
}

const colorClasses = {
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
};

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6'
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  color = 'blue',
  position = 'bottom-right'
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 rounded-full shadow-xl
        ${colorClasses[color]}
        text-white font-medium
        flex items-center justify-center
        group
        transition-all duration-300
      `}
      whileHover={{ 
        scale: 1.1,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 1
      }}
      title={label}
    >
      <motion.div
        whileHover={{ rotate: 15 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {label}
      </div>
    </motion.button>
  );
};

export default FloatingActionButton;
