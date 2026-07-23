'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { valueProps } from './landingData';

export default function ValuePropsSection() {
  const { theme } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
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
        {/* Main Title */}
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
              Why Aishi?
            </span>
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.secondary
          }}>
            Your personal AI that truly belongs to you
          </p>
        </div>

        {/* 4 Value Props Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isSmallMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isSmallMobile ? '16px' : '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {valueProps.map((prop, i) => (
            <div
              key={i}
              style={{
                padding: isSmallMobile ? '24px 20px' : '32px 24px',
                background: hoveredCard === i
                  ? 'rgba(139, 92, 246, 0.08)'
                  : 'rgba(24, 24, 31, 0.4)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${hoveredCard === i ? theme.accent.primary : theme.border}`,
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                transform: hoveredCard === i ? 'translateY(-4px)' : 'translateY(0)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Top gradient line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme.gradients.primary,
                transform: hoveredCard === i ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.3s ease'
              }} />

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: theme.gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <prop.icon size={24} color="white" />
              </div>

              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: theme.text.primary
              }}>
                {prop.title}
              </h3>

              <p style={{
                fontSize: '1rem',
                color: theme.text.secondary,
                lineHeight: 1.6
              }}>
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}