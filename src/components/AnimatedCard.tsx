import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const cardVariants = {
  up: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  down: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  left: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  }
};

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = "", 
  delay = 0,
  direction = 'up'
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants[direction]}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut"
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
