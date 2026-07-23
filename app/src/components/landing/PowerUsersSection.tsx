'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronRight } from 'lucide-react';
import { techDetails } from './landingData';

interface PowerUsersSectionProps {
  expandTech: boolean;
  setExpandTech: (expanded: boolean) => void;
}

export default function PowerUsersSection({ expandTech, setExpandTech }: PowerUsersSectionProps) {
  const { theme } = useTheme();

  return (
    <section style={{
      padding: '100px 20px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Blur background overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(24, 24, 31, 0.3)',
        backdropFilter: 'blur(10px)',
        zIndex: -1
      }} />
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            <span style={{
              background: theme.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              For Power Users
            </span>
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.secondary
          }}>
            Transparent mechanics for the technically inclined
          </p>
        </div>

        <button
          onClick={() => setExpandTech(!expandTech)}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `1px solid ${theme.accent.primary}`,
            borderRadius: '8px',
            color: theme.accent.primary,
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.accent.primary;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.accent.primary;
          }}
        >
          View Technical Details
          <ChevronRight 
            size={20} 
            style={{
              transform: expandTech ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.3s ease'
            }}
          />
        </button>

        {expandTech && (
          <div style={{
            marginTop: '24px',
            padding: '32px',
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            animation: 'fadeInUp 0.3s ease-out'
          }}>
            {/* Terminal dots */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28CA42' }} />
            </div>

            <div style={{ color: theme.text.secondary, lineHeight: 1.8 }}>
              <div style={{ color: theme.accent.primary, marginBottom: '8px' }}>
                {techDetails.command}
              </div>
              
              {techDetails.sections.map((section, i) => (
                <div key={i} style={{ marginTop: '16px' }}>
                  <div style={{ color: theme.accent.primary, marginBottom: '8px' }}>
                    {section.title}
                  </div>
                  {section.items.map((item, j) => (
                    <div key={j}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </section>
  );
}