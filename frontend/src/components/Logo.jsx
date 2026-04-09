import React from 'react';

const Logo = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-300 hover:scale-110"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-primary-600"
          style={{ animation: 'pulse 2s infinite' }}
        />
        <text
          x="50"
          y="65"
          textAnchor="middle"
          className="fill-white text-4xl font-bold"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          SKT
        </text>
      </svg>
    </div>
  );
};

export default Logo; 