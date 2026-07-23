'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { Shield } from 'lucide-react';

export default function PrivacySection() {
  const { theme } = useTheme();

  return (
    <section style={{
      padding: '100px 20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 'bold',
          marginBottom: '32px'
        }}>
          <span style={{
            background: theme.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Privacy & Control
          </span>
        </h2>
        
        <div style={{
          padding: '40px',
          background: 'rgba(139, 92, 246, 0.05)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${theme.accent.primary}`,
          borderRadius: '20px'
        }}>
          <Shield size={48} style={{ color: theme.accent.primary, marginBottom: '20px' }} />
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.primary,
            lineHeight: 1.6
          }}>
            You own the agent. You own the memory. Export or omit anytime. We can't see your data.
          </p>
        </div>
      </div>
    </section>
  );
}