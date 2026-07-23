'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { steps } from './landingData';
import { useState, useEffect } from 'react';

export default function HowItWorksSection() {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <section style={{
      padding: isMobile ? '60px 16px' : '100px 20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: isSmallMobile ? '1.75rem' : 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            <span style={{
              background: theme.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              How It Works
            </span>
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.secondary
          }}>
            Your journey with Aishi in simple steps
          </p>
        </div>

        {/* Horizontal Timeline */}
        <div style={{
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: '24px',
          position: 'relative',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Horizontal Line (desktop only) */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              top: '32px',
              left: '10%',
              right: '10%',
              height: '2px',
              background: theme.border,
              zIndex: 0
            }} />
          )}

          {/* Steps */}
          {steps.map((step, i) => (
            <div key={i} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Number Circle */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: theme.gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                {i + 1}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: theme.accent.primary
              }}>
                {step.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.95rem',
                color: theme.text.secondary,
                lineHeight: 1.6
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}