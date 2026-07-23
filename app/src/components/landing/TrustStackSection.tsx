'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { stackComponents } from './landingData';

export default function TrustStackSection() {
  const { theme } = useTheme();

  return (
    <section style={{
      padding: '100px 20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
              Trust the Stack
            </span>
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.secondary
          }}>
            Built 100% on 0G infrastructure
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          {stackComponents.map((component, i) => (
            <div key={i} style={{
              padding: '32px',
              background: 'rgba(24, 24, 31, 0.4)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {/* OG Logo */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src="/og.png" 
                  alt="0G"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain',
                    opacity: 0.9
                  }}
                />
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '12px',
                color: theme.text.primary
              }}>
                {component.title}
              </h3>
              
              <p style={{
                fontSize: '0.95rem',
                color: theme.text.secondary,
                lineHeight: 1.6
              }}>
                {component.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}