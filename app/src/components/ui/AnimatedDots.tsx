'use client';

import React from 'react';

interface AnimatedDotsProps {
  color?: string;
  size?: number;
  duration?: number;
}

export default function AnimatedDots({ 
  color = 'currentColor',
  size = 4,
  duration = 1.5 
}: AnimatedDotsProps) {
  return (
    <>
      <style jsx>{`
        @keyframes dot-fade {
          0%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
        
        .animated-dots {
          display: inline-flex;
          gap: ${size}px;
          margin-left: ${size * 2}px;
        }
        
        .animated-dots span {
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${color};
          animation: dot-fade ${duration}s infinite;
        }
        
        .animated-dots span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .animated-dots span:nth-child(2) {
          animation-delay: ${duration * 0.25}s;
        }
        
        .animated-dots span:nth-child(3) {
          animation-delay: ${duration * 0.5}s;
        }
      `}</style>
      
      <span className="animated-dots">
        <span />
        <span />
        <span />
      </span>
    </>
  );
}