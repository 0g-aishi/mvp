'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { badges } from './landingData';
import SplitText from '../ui/SplitText';
import PillNav from '../ui/PillNav';
import GradientText from '../ui/GradientText';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const { theme } = useTheme();
  const router = useRouter();
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
  
  const rotatingTexts = [
    'Built 100% on 0G — Compute • Storage • DA • Chain.',
    'Your memories, truly private. You decide what\'s saved.',
    'Month-learn + memory-core: long-term context that sticks.',
    'Real-time Live2D chat with a personality that evolves.',
    'Spot hidden patterns and break self-defeating loops.'
  ];

  return (
    <section style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: isMobile ? '60px 20px 40px 20px' : '70px 20px 60px 20px',
      zIndex: 1
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo Aishi */}
        <Image
          src="/logo_clean.png"
          alt="Aishi"
          width={isMobile ? 120 : 180}
          height={isMobile ? 120 : 180}
          priority
          style={{
            marginBottom: '32px',
            animation: 'fadeInUp 1s ease-out 0.1s both',
            display: 'inline-block'
          }}
        />

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 'bold',
          marginBottom: '24px',
          lineHeight: 1.2,
          animation: 'fadeInUp 1s ease-out 0.2s both',
          color: theme.text.primary
        }}>
          AI with a{' '}
          <GradientText inline showBorder={false}>
            soul
          </GradientText>
          .{' '}
          <GradientText inline showBorder={false}>
            Verifiably
          </GradientText>{' '}
          yours.
        </h1>

        {/* Subheadline */}
        <p style={{
          maxWidth: '800px',
          margin: '0 auto 32px',
          fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
          color: theme.text.secondary,
          lineHeight: 1.6,
          animation: 'fadeInUp 1s ease-out 0.3s both'
        }}>
          A sovereign iNFT companion that learns from your dreams and chats — and remembers what you choose to remember.
        </p>

        {/* Rotating USPs */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 32px',
          animation: 'fadeInUp 1s ease-out 0.4s both',
          minHeight: '2em'
        }}>
          <SplitText
            texts={rotatingTexts}
            className="hero-subtitle"
            delay={25}
            duration={0.5}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 20, rotateX: -90 }}
            to={{ opacity: 1, y: 0, rotateX: 0 }}
            textAlign="center"
            rotationDelay={6500}
            style={{
              color: theme.text.secondary,
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.6,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: '400'
            }}
          />
        </div>

        {/* Badges */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}>
          {badges.map((badge, i) => (
            <div 
              key={badge}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.border}`,
                fontSize: '14px',
                color: theme.text.primary,
                animation: `fadeInUp 0.5s ease-out ${0.5 + i * 0.1}s both`
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        {/* PillNav CTA */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '0',
          animation: 'fadeInUp 1s ease-out 0.8s both'
        }}>
          <PillNav
            items={[
              {
                label: 'AishiOS',
                href: '/aishiOS',
                ariaLabel: 'Open AishiOS'
              },
              {
                label: 'Mint',
                href: '/aishi-mint',
                ariaLabel: 'Mint Your Agent'
              },
              {
                label: 'Companion',
                href: '/aishi-companion',
                ariaLabel: 'Meet your AI companion'
              },
              {
                label: 'Learn More',
                onClick: () => {
                  const docsUrl = process.env.NEXT_PUBLIC_DOCS_AISHI_URL;
                  if (docsUrl && docsUrl.trim()) {
                    window.open(docsUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    // Fallback to /introduction route
                    router.push('/introduction');
                  }
                },
                ariaLabel: 'Learn more about Aishi'
              }
            ]}
          />
        </div>

      </div>

      {/* Scroll Indicator - Bottom Right (hidden on mobile) */}
      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            animation: 'bounce 2s infinite',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span style={{
            fontSize: '0.875rem',
            color: theme.text.secondary,
            fontWeight: '500',
            letterSpacing: '0.05em'
          }}>
            SCROLL
          </span>
          <ChevronDown size={24} style={{ color: theme.accent.primary }} />
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}