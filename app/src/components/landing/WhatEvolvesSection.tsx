'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { Brain, TrendingUp, Sparkles, Target, MessageSquare, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WhatEvolvesSection() {
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

  const evolvingAspects = [
    {
      icon: Brain,
      title: 'Intelligence level',
      description: 'Increases with interaction and consolidation; unlocks deeper memory access.'
    },
    {
      icon: TrendingUp,
      title: 'Memory depth',
      description: 'From current month → quarterly/half-year → multi-year → "lifetime" (based on INT).'
    },
    {
      icon: Sparkles,
      title: 'Personality traits',
      description: 'Creativity, analytical, empathy, intuition, resilience, curiosity.'
    },
    {
      icon: Target,
      title: 'Unique features',
      description: 'AI-discovered quirks added over time (timestamped, intensity).'
    },
    {
      icon: MessageSquare,
      title: 'Response style',
      description: 'Adapts based on trait changes: empathetic, creative, analytical, and more.'
    },
    {
      icon: Trophy,
      title: 'Milestones',
      description: 'Memory Keeper/Guardian/Master, Balanced Soul, and more.'
    }
  ];

  return (
    <section style={{
      padding: isMobile ? '60px 16px' : '100px 20px',
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
              What Evolves
            </span>
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: theme.text.secondary
          }}>
            Watch your Aishi grow and adapt through multiple dimensions
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(3, 1fr)',
          gap: isSmallMobile ? '16px' : '24px'
        }}>
          {evolvingAspects.map((aspect, i) => {
            const Icon = aspect.icon;
            return (
              <div key={aspect.title} style={{
                padding: isSmallMobile ? '20px' : '28px',
                background: 'rgba(24, 24, 31, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = theme.accent.primary;
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.background = 'rgba(24, 24, 31, 0.4)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: theme.gradients.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={24} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: theme.text.primary
                    }}>
                      {aspect.title}
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      color: theme.text.secondary,
                      lineHeight: 1.5
                    }}>
                      {aspect.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}