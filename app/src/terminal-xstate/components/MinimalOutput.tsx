import React, { useEffect, useRef, useState } from 'react';
import { TerminalLine } from '../machines/types';
import { CollapsibleText } from './CollapsibleText';
import { parseMarkdownToReact, containsMarkdown } from '../services/markdownParser';
import { VoiceMessage } from '../../terminal-xstate/voice/VoiceMessage';
import { breakpoints } from '../../utils/responsive';
import { logger } from '@/lib/logger';

interface MinimalOutputProps {
  lines: TerminalLine[];
  welcomeLines: TerminalLine[];
  agentStatus?: string;
  agentName?: string | null;
  syncProgress?: string;
  isChatActive?: boolean;
  onEndSession?: () => void;
  isInitialState?: boolean;
}

const colors = {
  pearl: '#F0F0F0',
  silver: '#8A8A8A',
  slate: '#2D2D2D',
  success: '#22D3EE',
  error: '#F97316',
  warning: '#FCD34D'
};

const MinimalOutputComponent: React.FC<MinimalOutputProps> = ({
  lines,
  welcomeLines,
  agentStatus = 'uninitialized',
  agentName,
  syncProgress,
  isChatActive = false,
  onEndSession,
  isInitialState = false
}) => {
  const log = logger.child({ component: 'MinimalOutput' });
  const outputRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < breakpoints.sm);
      setIsTablet(width >= breakpoints.sm && width < breakpoints.md);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [lines]);

  const getLineStyle = (type: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      marginBottom: '0.5rem',
      animation: 'fadeInLine 0.3s ease'
    };

    switch(type) {
      case 'system':
        return { ...baseStyle, color: colors.silver, fontSize: '13px', opacity: 0.7 };
      case 'input':
        return { ...baseStyle, color: colors.pearl, fontWeight: 400 };
      case 'output':
        return { ...baseStyle, color: colors.pearl, opacity: 0.9 };
      case 'error':
        return {
          ...baseStyle,
          color: colors.error,
          opacity: 0.9,
          background: 'rgba(239, 68, 68, 0.08)',
          borderLeft: '3px solid rgba(239, 68, 68, 0.6)',
          padding: '8px 12px',
          borderRadius: '6px'
        };
      case 'success':
        return { ...baseStyle, color: colors.success, opacity: 0.8 };
      case 'warning':
        return {
          ...baseStyle,
          color: colors.warning,
          opacity: 0.95,
          background: 'rgba(252, 211, 77, 0.08)',
          borderLeft: '3px solid rgba(252, 211, 77, 0.6)',
          padding: '8px 12px',
          borderRadius: '6px'
        };
      case 'help-command':
        return { ...baseStyle, color: colors.pearl, opacity: 0.95, fontFamily: 'monospace' };
      case 'help-header':
        return { ...baseStyle, color: colors.pearl, fontSize: '15px', fontWeight: 500, opacity: 1 };
      case 'help-interactive':
        return { ...baseStyle, color: colors.pearl, opacity: 0.95, fontFamily: 'monospace' };
      default:
        return { ...baseStyle, color: colors.pearl };
    }
  };

  const formatTextWithAgentName = (content: string): React.ReactNode => {
    // Parse and format agent name in "~ name :" format
    const agentNameRegex = /~ ([^:]+) :/;
    const match = content.match(agentNameRegex);
    if (match) {
      const beforeAgent = content.substring(0, match.index);
      const agentName = match[1];
      const afterAgent = content.substring((match.index || 0) + match[0].length);
      
      // Check if the message content (afterAgent) contains Markdown
      const formattedContent = containsMarkdown(afterAgent) 
        ? parseMarkdownToReact(afterAgent) 
        : afterAgent;
      
      return (
        <>
          {beforeAgent}
          <span style={{ color: colors.silver, opacity: 0.7 }}>~ </span>
          <span style={{ color: '#8B5CF6', fontWeight: 500 }}>{agentName}</span>
          <span style={{ color: colors.silver, opacity: 0.7 }}> : </span>
          {formattedContent}
        </>
      );
    }
    return content;
  };

  // Component for interactive help lines with tooltips
  const InteractiveHelpLine: React.FC<{ line: TerminalLine }> = ({ line }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    if (line.type !== 'help-interactive' || !line.hasTooltip) {
      return <>{line.content}</>;
    }

    // Parse the line to separate command and description
    const content = line.content as string;
    const parts = content.match(/^(\s*)([\w-]+)(\s+)(.+?)(\s+)(ⓘ)$/);
    
    if (!parts) {
      return <>{content}</>;
    }

    const [_, indent, command, space1, description, space2, icon] = parts;

    return (
      <>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {indent}
            <span style={{ color: '#8B5CF6', fontWeight: 500 }}>{command}</span>
            {space1}
            <span style={{ opacity: 0.9 }}>{description}</span>
          </span>
          <span 
            style={{ 
              cursor: 'pointer', 
              color: showTooltip ? '#8B5CF6' : colors.silver,
              transition: 'color 0.2s',
              marginLeft: '1rem'
            }}
            onMouseEnter={() => !isMobile && setShowTooltip(true)}
            onMouseLeave={() => !isMobile && setShowTooltip(false)}
            onClick={() => isMobile && setShowTooltip(!showTooltip)}
          >
            {icon}
          </span>
          
          {/* Desktop tooltip */}
          {showTooltip && line.tooltip && !isMobile && (
            <div style={{
              position: 'absolute',
              right: '2rem',
              top: '1.5rem',
              width: '320px',
              padding: '12px',
              backgroundColor: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              fontSize: '12px',
              lineHeight: '1.5',
              color: colors.pearl,
              whiteSpace: 'pre-line'
            }}>
              {line.tooltip}
            </div>
          )}
        </div>
        
        {/* Mobile modal overlay */}
        {showTooltip && line.tooltip && isMobile && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 999
              }}
              onClick={() => setShowTooltip(false)}
            />
            
            {/* Mobile centered modal */}
            <div style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '400px',
              padding: '20px',
              backgroundColor: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              fontSize: '14px',
              lineHeight: '1.6',
              color: colors.pearl,
              whiteSpace: 'pre-line'
            }}>
              {/* Close button */}
              <div 
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: colors.silver,
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowTooltip(false)}
              >
                ✕
              </div>
              
              {/* Command name header */}
              <div style={{ 
                color: '#8B5CF6', 
                fontWeight: 600, 
                marginBottom: '12px',
                fontSize: '16px'
              }}>
                {command.toUpperCase()}
              </div>
              
              {line.tooltip}
            </div>
          </>
        )}
      </>
    );
  };
  
  const formatContent = (line: TerminalLine) => {
    // Handle voice messages
    if (line.type === 'voice-input' || line.type === 'voice-output') {
      log.debug('Rendering voice message', {
        type: line.type,
        hasAudioBlob: !!line.audioBlob,
        hasAudioData: !!line.audioData,
        duration: line.duration,
        transcript: line.transcript
      });
      // Convert base64 audio to Blob if needed
      let audioBlob: Blob | undefined;
      if (line.audioData) {
        try {
          const byteCharacters = atob(line.audioData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          audioBlob = new Blob([byteArray], { type: line.audioFormat || 'audio/mp3' });
        } catch (error) {
          log.error('Failed to convert audio data to blob', { error });
        }
      }

      return (
        <VoiceMessage
          audioBlob={audioBlob || line.audioBlob}
          duration={line.duration || 0}
          isUserMessage={line.type === 'voice-input'}
          sender={line.type === 'voice-input' ? 'You' : agentName || 'Agent'}
          status="sent"
        />
      );
    }

    // Handle interactive help lines
    if (line.type === 'help-interactive' && line.hasTooltip) {
      return <InteractiveHelpLine line={line} />;
    }

    // Clean, minimal formatting
    if (typeof line.content === 'string') {
      let content = line.content;
      
      // Handle command prefixes
      if (content.startsWith('$ ')) {
        const command = content.substring(2).trim();

        // Special handling for chat command when chat is active
        if (command === 'chat' && isChatActive && onEndSession) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>
                <span style={{ opacity: 0.5 }}>$ </span>
                <span style={{ fontWeight: 400 }}>{command}</span>
              </span>
              <button
                onClick={onEndSession}
                style={{
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: isMobile ? '4px 12px' : '6px 16px',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                  fontFamily: 'Inter, -apple-system, system-ui, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#9F7AEA';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5CF6';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
                }}
              >
                End Session
              </button>
            </div>
          );
        }

        // Default command rendering
        return (
          <>
            <span style={{ opacity: 0.5 }}>$ </span>
            <span style={{ fontWeight: 400 }}>{content.substring(2)}</span>
          </>
        );
      }
      
      // Annotate retry progress blocks
      const retryMatch = content.match(/Retrying[^0-9]*(\d+)\/(\d+)/i);
      if (retryMatch) {
        const attempt = Number.parseInt(retryMatch[1], 10);
        const max = Number.parseInt(retryMatch[2], 10);
        if (max > 0) {
          const totalBlocks = Math.min(5, Math.max(2, max));
          const filledBlocks = Math.max(1, Math.min(totalBlocks, Math.round((attempt / max) * totalBlocks)));
          const progressBar = '█'.repeat(filledBlocks).padEnd(totalBlocks, '░');
          return (
            <span>
              {content}
              <span style={{
                marginLeft: '8px',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: '#FCD34D',
                letterSpacing: '0.4px'
              }}>
                [{progressBar}]
              </span>
            </span>
          );
        }
      }

      // Check if this is a dream input or agent response (needs collapsing)
      const isDreamInput = line.type === 'input' && content.startsWith('~');
      const isAgentResponse = line.type === 'info' && content.includes('~ ') && content.includes(' :');
      const isPulsatingQuestion = content.includes('Do u wanna train');
      
      // Apply pulsating animation for training question
      if (isPulsatingQuestion) {
        return (
          <span className="pulsating-text">
            {formatTextWithAgentName(content)}
          </span>
        );
      }
      
      // Use CollapsibleText for long content
      if ((isDreamInput || isAgentResponse) && content.length > 400) {
        return (
          <CollapsibleText
            text={content}
            maxLength={400}
            formatContent={formatTextWithAgentName}
          />
        );
      }
      
      // For all other text, check if it contains Markdown
      const processedContent = formatTextWithAgentName(content);
      
      // If formatTextWithAgentName didn't find agent pattern, check for Markdown
      if (processedContent === content && containsMarkdown(content)) {
        return parseMarkdownToReact(content);
      }
      
      return processedContent;
    }
    return line.content;
  };

  const outputAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingTop: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    paddingLeft: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    paddingRight: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    paddingBottom: 0,
    color: colors.pearl,
    fontFamily: 'Poppins, -apple-system, "SF Pro Display", system-ui, sans-serif',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 300,
    lineHeight: isMobile ? 1.6 : 1.8,
    letterSpacing: '0.02em'
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInLine {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulsate {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 4px #8B5CF6;
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 12px #8B5CF6, 0 0 20px #8B5CF620;
          }
        }
        
        .pulsating-text {
          animation: pulsate 2s ease-in-out infinite;
          color: #8B5CF6;
          font-weight: 500;
        }

        /* Custom Scrollbar */
        .minimal-output::-webkit-scrollbar {
          width: 8px;
        }
        
        .minimal-output::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .minimal-output::-webkit-scrollbar-thumb {
          background: ${colors.slate};
          border-radius: 4px;
        }
        
        .minimal-output::-webkit-scrollbar-thumb:hover {
          background: ${colors.silver};
        }
      `}</style>

      <div ref={outputRef} style={outputAreaStyle} className="minimal-output">
        {/* Welcome message only in initial state */}
        {isInitialState && (
          <div style={{
            color: colors.silver,
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '14px',
            opacity: 0.8,
            animation: 'fadeInLine 0.3s ease'
          }}>
            Welcome to aishiOS terminal. Type 'help' for available commands.
          </div>
        )}

        {/* Command lines - shown always */}
        {lines.map((line, index) => (
          <div
            key={`line-${index}`}
            style={getLineStyle(line.type)}
          >
            {formatContent(line)}
          </div>
        ))}
      </div>
    </>
  );
};

// Deep comparison function for React.memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: MinimalOutputProps, nextProps: MinimalOutputProps) => {
  // Compare arrays by reference (they should only change when actual content changes)
  if (prevProps.lines !== nextProps.lines) return false;
  if (prevProps.welcomeLines !== nextProps.welcomeLines) return false;

  // Compare primitive values
  if (prevProps.agentStatus !== nextProps.agentStatus) return false;
  if (prevProps.agentName !== nextProps.agentName) return false;
  if (prevProps.syncProgress !== nextProps.syncProgress) return false;
  if (prevProps.isChatActive !== nextProps.isChatActive) return false;
  if (prevProps.isInitialState !== nextProps.isInitialState) return false;

  // onEndSession function can change reference, but functionality stays the same
  // We can safely ignore it in comparison as it doesn't affect rendering

  return true;
};

export const MinimalOutput = React.memo(MinimalOutputComponent, arePropsEqual);