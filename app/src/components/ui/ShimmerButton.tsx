'use client';

import React, { MouseEvent } from 'react';

// TypeScript interfaces
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
  borderRadius?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

// Simple className utility function
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff", // Biały shimmer na borderze
      shimmerSize = "0.1em",
      shimmerDuration = "3s",
      borderRadius = "24px",
      background = "#8B5CF6", // Dreamscape violet
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <>
        <style jsx>{`
          @keyframes shimmer-slide {
            to {
              transform: translate(calc(100cqw - 100%), 0);
            }
          }
          @keyframes spin-around {
            0% {
              transform: translateZ(0) rotate(0);
            }
            15%,
            35% {
              transform: translateZ(0) rotate(90deg);
            }
            65%,
            85% {
              transform: translateZ(0) rotate(270deg);
            }
            100% {
              transform: translateZ(0) rotate(360deg);
            }
          }
          .shimmer-button {
            --spread: 100deg;
            --shimmer-color: ${shimmerColor};
            --radius: ${borderRadius};
            --speed: ${shimmerDuration};
            --cut: ${shimmerSize};
            --bg: ${background};
          }
          .shimmer-slide {
            animation: shimmer-slide var(--speed) ease-in-out infinite alternate;
          }
          .spin-around {
            animation: spin-around calc(var(--speed) * 2) infinite linear;
          }
        `}</style>
        <button
          ref={ref}
          className={cn("shimmer-button", className)}
          style={{
            position: 'relative',
            zIndex: 0,
            display: 'flex',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.3)', // Biały border
            padding: '14px 24px', // Powiększony padding
            color: 'white',
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            transformOrigin: 'center',
            transition: 'transform 300ms ease-in-out',
            backgroundClip: 'padding-box',
            isolation: 'isolate',
            fontSize: '14px',
            fontWeight: '600', // Pogrubiony tekst
            boxShadow: `0 0 10px rgba(139, 92, 246, 0.3)`,
            ...style
          }}
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e: MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          {...props}
        >
          {/* shimmer container */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: -30,
              filter: 'blur(0.5px)',
              overflow: 'hidden',
              borderRadius: 'var(--radius)',
              containerType: 'size'
            }}
          >
            {/* shimmer effect */}
            <div 
              className="shimmer-slide"
              style={{
                position: 'absolute',
                inset: 0,
                height: '100cqh',
                aspectRatio: '1',
                borderRadius: 0,
                mask: 'none'
              }}
            >
              {/* shimmer spinning gradient */}
              <div 
                className="spin-around"
                style={{
                  position: 'absolute',
                  inset: '-100%',
                  width: 'auto',
                  rotate: '0deg',
                  background: 'conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))',
                  transform: 'translate(0, 0)'
                }}
              />
            </div>
          </div>
          
          {children}

          {/* Inner highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius)',
              boxShadow: 'inset 0 -8px 10px rgba(255, 255, 255, 0.12)',
              transition: 'all 300ms ease-in-out',
              pointerEvents: 'none'
            }}
          />

          {/* backdrop */}
          <div
            style={{
              position: 'absolute',
              zIndex: -20,
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              inset: '1px'
            }}
          />
        </button>
      </>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";