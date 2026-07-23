'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { MockTerminal } from '../../components/MockTerminal';
import { useTheme } from '../../contexts/ThemeContext';
import SplitText from '../../components/ui/SplitText';
import ModelSelector from '../../components/ModelSelector';
import useModelDiscovery from '../../hooks/useModelDiscovery';
import VoiceSelector from '../../components/VoiceSelector';
import useVoiceDiscovery from '../../hooks/useVoiceDiscovery';
import GradientText from '../../components/ui/GradientText';

export default function AishiOSPage() {
  const { theme, debugLog } = useTheme();
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Terminal modal state removed - now using fullscreen route
  // const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  
  // Model discovery hook
  const {
    models,
    selectedModel,
    setSelectedModel,
    isLoading: modelsLoading
  } = useModelDiscovery();

  // Voice discovery hook
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    testVoice,
    isLoading: voicesLoading,
    isTesting
  } = useVoiceDiscovery();

  // Debug log na start
  debugLog('AishiOS page loaded');

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);


  // Terminal toggle function removed - now using fullscreen route
  // const toggleTerminal = () => {
  //   setIsTerminalOpen(!isTerminalOpen);
  //   debugLog('Terminal toggled', { isTerminalOpen: !isTerminalOpen });
  // };

  // Handle escape key to close terminal - removed for fullscreen route
  // useEffect(() => {
  //   const handleEscape = (e: KeyboardEvent) => {
  //     if (e.key === 'Escape' && isTerminalOpen) {
  //       setIsTerminalOpen(false);
  //     }
  //   };

  //   if (isTerminalOpen) {
  //     document.addEventListener('keydown', handleEscape);
  //   }

  //   return () => {
  //     document.removeEventListener('keydown', handleEscape);
  //   };
  // }, [isTerminalOpen]);

  return (
    <Layout backgroundType="faulty-terminal">
      <div style={{
        padding: 'clamp(12px, 4vw, 20px)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: 'clamp(8px, 1.2vw, 12px)',
            color: theme.accent.primary,
            textAlign: 'center' as const,
            margin: 0,
            marginBottom: '12px',
            lineHeight: 1.1,
            opacity: 0.9,
            letterSpacing: '1px',
            fontWeight: 'bold'
          }}>
{` █████╗ ██╗███████╗██╗  ██╗██╗    ██████╗ ███████╗
██╔══██╗██║██╔════╝██║  ██║██║   ██╔═══██╗██╔════╝
███████║██║███████╗███████║██║   ██║   ██║███████╗
██╔══██║██║╚════██║██╔══██║██║   ██║   ██║╚════██║
██║  ██║██║███████║██║  ██║██║   ╚██████╔╝███████║
╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝    ╚═════╝ ╚══════╝`}
          </pre>
          <div style={{
            margin: '0 0 16px 0',
            minHeight: '2em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SplitText
              texts={[
                "Type help to get started – try dream, chat, agent-info.",
                "Train your agent with dream or talk in real time with chat.",
                "Evolve personality over time with month-learn and year-learn.",
                "Use commands to analyze dreams, chat, and update memory.",
                "Everything here refines your agent's personality and stats.",
                "Start a conversation with your Live2D companion using talk."
              ]}
              className="tagline-split"
              delay={30}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 15, rotateX: -90 }}
              to={{ opacity: 1, y: 0, rotateX: 0 }}
              textAlign="center"
              rotationDelay={6500}
              style={{ 
                color: theme.text.secondary,
                fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: '400',
                letterSpacing: '0.01em'
              }}
            />
          </div>

          {/* Model & Voice Selectors */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isLoading={modelsLoading}
            />
            <VoiceSelector
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              onTestVoice={testVoice}
              isLoading={voicesLoading}
              isTesting={isTesting}
            />
          </div>
        </div>

        {/* Terminal Preview - All Devices */}
        <div style={{
          width: '100%',
          height: 'clamp(400px, 60vh, 70vh)',
          minHeight: '350px',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Blurred Mock Terminal Background */}
          <div 
            className="terminal-blur-overlay"
            style={{
              filter: 'blur(4px)',
              pointerEvents: 'none',
              width: '100%',
              height: '100%'
            }}>
            <MockTerminal 
              width="100%"
              height="100%"
            />
          </div>
          
          {/* Open Terminal Button Overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1000px',
            height: '85%',
            maxHeight: '700px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            borderRadius: '24px'
          }}>
            <Link
              href="/aishiOS/chat"
              className="terminal-open-button"
              style={{
                padding: isMobile ? '16px 32px' : '20px 40px',
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 'bold',
                color: theme.text.primary,
                backgroundColor: theme.bg.card,
                border: `2px solid ${theme.accent.primary}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 8px 24px ${theme.accent.primary}33`,
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'inline-block',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.accent.primary;
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.bg.card;
                e.currentTarget.style.color = theme.text.primary;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <GradientText
                inline
                showBorder={false}
                colors={['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF']}
                animationSpeed={3}
              >
                Talk with your Aishi
              </GradientText>
            </Link>
          </div>
        </div>

        {/* Terminal Modal - removed in favor of fullscreen route */}
        {/* <TerminalModal
          isTerminalOpen={isTerminalOpen}
          setIsTerminalOpen={setIsTerminalOpen}
          darkMode={darkMode}
          isMobile={isMobile}
          theme={theme}
          selectedModel={selectedModel}
          selectedVoice={selectedVoice}
        /> */}
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-8px);
            zIndex: 1;
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
            zIndex: 1;
          }
        }
        
        @keyframes terminalModalIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        @media (max-width: 768px) {
          /* Mobile styles cleaned */
        }
        
        @media (max-width: 480px) {
          .terminal-container {
            border-radius: 8px !important;
          }
        }
        
        @media (max-width: 320px) {
          .terminal-container {
            border-radius: 6px !important;
          }
        }
        
        /* Terminal Animations - All Devices */
        .terminal-modal {
          animation: terminalModalIn 0.3s ease !important;
        }
        
        .terminal-blur-overlay {
          transition: all 0.3s ease;
        }
        
        .terminal-open-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .terminal-open-button:active {
          transform: scale(0.95) !important;
        }
        
        /* Responsive Terminal Modal Sizing */
        @media (min-width: 1400px) {
          .terminal-modal .terminal-container {
            max-width: 1400px;
            max-height: 900px;
          }
        }
        
        @media (max-width: 1024px) {
          .terminal-modal .terminal-container {
            width: 95vw !important;
            height: 85vh !important;
          }
        }
        
        @media (max-width: 768px) {
          .terminal-modal .terminal-container {
            width: 100% !important;
            height: 100% !important;
          }
        }
      `}</style>
    </Layout>
  );
}