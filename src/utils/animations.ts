import { Variants } from 'framer-motion';

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
};

export const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4
};

// Card animations
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1 
  }
};

// Stagger children animation
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// List item animations
export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Fade in animations
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Slide animations
export const slideInFromRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const slideInFromLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -100 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const hoverLift = {
  y: -5,
  transition: { duration: 0.2 }
};

// Button animations
export const buttonHover = {
  scale: 1.05,
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  transition: { duration: 0.2 }
};

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 }
};
