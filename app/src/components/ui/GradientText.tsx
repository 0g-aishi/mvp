'use client';

import React, { ReactNode } from 'react';

// TypeScript interfaces
interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
  inline?: boolean; // Minimal inline mode for use in terminal status line
}

// Simple className utility function
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function GradientText({
  children,
  className = '',
  colors = ['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF'], // White to Dreamscape violet gradient
  animationSpeed = 3,
  showBorder = true,
  inline = false
}: GradientTextProps) {
  const gradientString = `linear-gradient(to right, ${colors.join(', ')})`;

  // Conditional styling based on inline mode
  const wrapperStyle = inline ? {
    position: 'relative' as const,
    display: 'inline-block' as const,
    fontWeight: 500
  } : {
    position: 'relative' as const,
    margin: '0 auto',
    display: 'inline-flex' as const,
    maxWidth: 'fit-content',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '1rem 2rem',
    borderRadius: '1.25rem',
    fontWeight: 500,
    backdropFilter: 'blur(10px)',
    transition: 'box-shadow 0.5s ease-out',
    overflow: 'hidden' as const,
    cursor: 'pointer' as const
  };

  return (
    <>
      <style jsx>{`
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .gradient-text-wrapper {
          --gradient: ${gradientString};
          --animation-speed: ${animationSpeed}s;
        }
      `}</style>

      <div
        className={cn('gradient-text-wrapper', className)}
        style={wrapperStyle}
      >
        {/* Animated gradient border */}
        {showBorder && !inline && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'var(--gradient)',
                backgroundSize: '300% 100%',
                animation: `gradient-animation var(--animation-speed) linear infinite`,
                borderRadius: 'inherit',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
            {/* Inner dark background to create border effect */}
            <div
              style={{
                content: '',
                position: 'absolute',
                borderRadius: 'inherit',
                width: 'calc(100% - 2px)',
                height: 'calc(100% - 2px)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#060010', // Dark background from project
                zIndex: 1
              }}
            />
          </>
        )}

        {/* Text content with gradient */}
        <div
          style={{
            display: 'inline-block',
            position: 'relative',
            zIndex: 2,
            backgroundImage: 'var(--gradient)',
            backgroundSize: '300% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            animation: `gradient-animation var(--animation-speed) linear infinite`
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
