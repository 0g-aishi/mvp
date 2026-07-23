'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import StaggeredMenu from './StaggeredMenu';
import WalletStatus from '../wallet/WalletStatus';
import { useTheme } from '../../contexts/ThemeContext';
import { FaultyTerminal } from '../backgrounds';
import { FaultyTerminalErrorBoundary } from '../backgrounds/FaultyTerminal/FaultyTerminalErrorBoundary';
import { zIndex } from '../../styles/zIndex';

interface LayoutProps {
  children: ReactNode;
  backgroundType?: 'video' | 'faulty-terminal' | 'none';
}

const Layout = ({ children, backgroundType = 'video' }: LayoutProps) => {
  const { theme, debugLog } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile on mount and when window resizes
  useEffect(() => {
    const checkIsMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();
    debugLog('Layout initialized', { isMobile: window.innerWidth < 768 });

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [debugLog]);
  
  return (
    <div style={{
      color: theme.text.primary,
      minHeight: '100vh',
      display: 'flex',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Background Selection */}
      {backgroundType === 'video' && (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: zIndex.background,
            opacity: 0.15
          }}
        >
          <source src="/pendi-bg.mp4" type="video/mp4" />
        </video>
      )}

      {backgroundType === 'faulty-terminal' && (
        <FaultyTerminalErrorBoundary>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1
          }}>
            <FaultyTerminal
              enabled={true}
              performanceMode={isMobile}
              config={{
                tint: "#8B5CF6",
                brightness: 0.15,
                scale: 1.5,
                scanlineIntensity: 0.3,
                glitchAmount: 0.5,
                flickerAmount: 0.3,
                mouseReact: !isMobile,
                pageLoadAnimation: true
              }}
            />
          </div>
        </FaultyTerminalErrorBoundary>
      )}

      {/* New StaggeredMenu - replaces Sidebar + Header */}
      <StaggeredMenu
        position="right"
        colors={['#8B5CF6', '#A855F7']}
        logoUrl="/logo_clean.png"
        menuButtonColor="#fff"
        openMenuButtonColor="#8B5CF6"
        accentColor="#8B5CF6"
        changeMenuColorOnOpen={true}
        onMenuOpen={() => debugLog('Menu opened')}
        onMenuClose={() => debugLog('Menu closed')}
      />

      {/* Wallet Status - shows when connecting */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        pointerEvents: 'none'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <WalletStatus />
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        width: '100%',
        overflowX: 'hidden'
      }}>
        {/* Spacer for fixed menu header */}
        <div style={{ height: '90px' }} />

        {/* Page Content */}
        <div style={{ padding: '20px', maxWidth: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 