import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollEndIndicatorProps {
  theme?: 'red' | 'orange' | 'purple' | 'blue';
  showDuration?: number;
}

const ScrollEndIndicator: React.FC<ScrollEndIndicatorProps> = ({ 
  theme = 'red',
  showDuration = 2000 
}) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [lastScrollTime, setLastScrollTime] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let previousScrollTop = 0;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Check if user has scrolled to the bottom (with a small threshold of 10px)
      const isAtBottom = scrollTop + windowHeight >= documentHeight - 10;
      
      // Check if user is scrolling up
      const isScrollingUp = scrollTop < previousScrollTop;
      
      if (isAtBottom && !isScrollingUp) {
        const now = Date.now();
        // Prevent showing indicator too frequently
        if (now - lastScrollTime > 1000) {
          setShowIndicator(true);
          setLastScrollTime(now);
          
          // Hide the indicator after specified duration
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setShowIndicator(false);
          }, showDuration);
        }
      } else if (isScrollingUp && showIndicator) {
        // Hide indicator immediately when scrolling up
        setShowIndicator(false);
        clearTimeout(timeoutId);
      }
      
      // Update previous scroll position
      previousScrollTop = scrollTop;
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollTime, showDuration, showIndicator]);

  const getThemeClass = () => {
    switch (theme) {
      case 'orange':
        return 'gradient-orange';
      case 'purple':
        return 'gradient-purple';
      case 'blue':
        return 'gradient-blue';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          className="scroll-end-shade"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut"
          }}
        >
          <div className={`scroll-end-gradient ${getThemeClass()}`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollEndIndicator;
