import React from 'react';

// This is a simplified motion component that uses CSS transitions
// In a real implementation, you might use framer-motion or react-spring

interface MotionProps {
  children: React.ReactNode;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  className?: string;
  onClick?: () => void;
}

export const motion = {
  div: ({ 
    children, 
    initial, 
    animate, 
    transition, 
    className = '',
    ...props 
  }: MotionProps) => {
    const transitionStyle = {
      transition: `all ${transition?.duration || 0.3}s ${transition?.ease || 'ease-in-out'} ${transition?.delay || 0}s`,
    };
    
    // In a real implementation, you would apply the initial/animate values properly
    // This is just a simple version for demo purposes
    
    return (
      <div 
        className={`transition-all duration-300 ${className}`} 
        style={transitionStyle}
        {...props}
      >
        {children}
      </div>
    );
  },
  
  button: ({ 
    children, 
    initial, 
    animate, 
    transition, 
    className = '',
    ...props 
  }: MotionProps) => {
    const transitionStyle = {
      transition: `all ${transition?.duration || 0.3}s ${transition?.ease || 'ease-in-out'} ${transition?.delay || 0}s`,
    };
    
    return (
      <button 
        className={`transition-all duration-300 ${className}`} 
        style={transitionStyle}
        {...props}
      >
        {children}
      </button>
    );
  }
};