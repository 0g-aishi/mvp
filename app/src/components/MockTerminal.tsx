'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Image from 'next/image';

interface MockTerminalProps {
  width?: string;
  height?: string;
}

// Premium color palette - identical to GlassTerminal
const colors = {
  noir: '#0A0A0A',
  charcoal: '#1A1A1A',
  slate: '#2D2D2D',
  silver: '#8A8A8A',
  pearl: '#F0F0F0',
  accent: '#8B5CF6',
  accentMuted: 'rgba(139, 92, 246, 0.1)',
  glassBg: 'rgba(26, 26, 26, 0.7)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  success: '#22D3EE',
  error: '#F97316'
};

export const MockTerminal: React.FC<MockTerminalProps> = ({ 
  width = '100%', 
  height = '100%' 
}) => {
  const { theme } = useTheme();

  return (
    <div style={{
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)'
    }}>
      {/* Terminal container */}
      <div style={{
        width: '90%',
        maxWidth: '1000px',
        height: '85%',
        maxHeight: '700px',
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: `
          0 4px 20px rgba(139, 92, 246, 0.1),
          0 8px 40px rgba(0, 0, 0, 0.2),
          0 16px 80px rgba(0, 0, 0, 0.1)
        `
      }}>
        {/* 0G Logo - top right corner */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '100px',
          height: '100px',
          opacity: 0.4,
          zIndex: 3,
          animation: 'pulse 4s ease-in-out infinite',
          pointerEvents: 'none'
        }}>
          <Image 
            src="/og.png" 
            alt="0G Network"
            width={100}
            height={100}
            style={{
              width: '100%',
              height: 'auto',
              filter: 'brightness(1.2)'
            }}
          />
        </div>

        {/* Clean Logo - bottom right corner */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '80px',
          height: '80px',
          opacity: 0.35,
          zIndex: 3,
          animation: 'fadeIn 2s ease-in-out',
          pointerEvents: 'none'
        }}>
          <Image 
            src="/logo_clean.png" 
            alt="AISHI Logo"
            width={80}
            height={80}
            style={{
              width: '100%',
              height: 'auto',
              filter: 'brightness(1.1)'
            }}
          />
        </div>

        {/* Glass terminal overlay */}
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${colors.glassBg} 0%, rgba(139, 92, 246, 0.05) 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '24px',
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          overflow: 'hidden'
        }}>
        {/* Terminal header */}
        <div style={{
          padding: '1rem 2rem',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ 
            color: colors.accent, 
            fontSize: '14px',
            fontWeight: 300,
            letterSpacing: '0.1em',
            opacity: 0.8
          }}>
            AISHI TERMINAL v2.0
          </span>
          <span style={{
            color: colors.silver,
            fontSize: '12px',
            opacity: 0.6
          }}>
            Connected • Agent #42
          </span>
        </div>

        {/* Terminal output area */}
        <div style={{
          flex: 1,
          padding: '1.5rem 2rem',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.6',
          maxHeight: 'calc(100% - 120px)'
        }}>
          {/* Command history */}
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: colors.accent }}>$</span>
            <span style={{ color: colors.pearl, marginLeft: '0.5rem' }}>agent mint "Dreamweaver"</span>
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            ✓ Minting agent with personality...
          </div>
          <div style={{ color: colors.success, marginLeft: '1rem', marginBottom: '1rem', opacity: 0.9 }}>
            ✓ Agent #42 created successfully
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: colors.accent }}>$</span>
            <span style={{ color: colors.pearl, marginLeft: '0.5rem' }}>agent info 42</span>
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Name: Dreamweaver
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Intelligence: Level 15
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Dreams: 3
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '1rem', opacity: 0.8 }}>
            Conversations: 7
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: colors.accent }}>$</span>
            <span style={{ color: colors.pearl, marginLeft: '0.5rem' }}>dream process --id 42</span>
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8, animation: 'fadeInOut 3s infinite' }}>
            Processing dream sequence...
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Analyzing personality evolution...
          </div>
          <div style={{ color: colors.success, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.9 }}>
            ✓ Dream processed successfully
          </div>
          <div style={{ color: colors.accent, marginLeft: '1rem', marginBottom: '1rem', opacity: 0.8 }}>
            Intelligence +2
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: colors.accent }}>$</span>
            <span style={{ color: colors.pearl, marginLeft: '0.5rem' }}>memory consolidate --type daily</span>
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Consolidating daily memories...
          </div>
          <div style={{ marginLeft: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: colors.success }}>[████████░░]</span>
            <span style={{ color: colors.silver, opacity: 0.8 }}>80% Complete</span>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: colors.accent }}>$</span>
            <span style={{ color: colors.pearl, marginLeft: '0.5rem' }}>agent status</span>
          </div>
          <div style={{ color: colors.success, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.9 }}>
            Connected to 0G Network
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '0.3rem', opacity: 0.8 }}>
            Broker: Active
          </div>
          <div style={{ color: colors.silver, marginLeft: '1rem', marginBottom: '2rem', opacity: 0.8 }}>
            Memory: 2.3 MB stored
          </div>
        </div>

        {/* Input line at bottom */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: `1px solid ${colors.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ color: colors.accent, fontSize: '14px' }}>$</span>
          <span style={{ 
            color: colors.silver, 
            fontSize: '14px', 
            opacity: 0.6,
            flex: 1
          }}>
            _
          </span>
          <span style={{
            animation: 'blink 1s infinite',
            color: colors.accent,
            opacity: 0.8,
            fontSize: '14px'
          }}>
            |
          </span>
        </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.05) rotate(2deg);
          }
        }
        
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        @keyframes fadeIn {
          0% { 
            opacity: 0;
            transform: scale(0.8);
          }
          100% { 
            opacity: 0.25;
            transform: scale(1);
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MockTerminal;