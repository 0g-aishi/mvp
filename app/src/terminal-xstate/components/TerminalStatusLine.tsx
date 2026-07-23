/**
 * @fileoverview Terminal Status Line Component
 * @description Single line status display showing agent connection and intelligence level
 */

import React, { useEffect, useState } from 'react';
import GradientText from '@/components/ui/GradientText';

interface TerminalStatusLineProps {
  status: 'uninitialized' | 'connecting' | 'syncing' | 'online' | 'thinking' | 'responding' | 'learning' | 'evolving' | 'error' | 'no_agent' | 'recording' | 'retrying';
  agentName?: string | null;
  intelligenceLevel?: number;
  isMobile?: boolean;
  isTablet?: boolean;
  workflowStatus?: string | null;
  workflowPrompt?: string | null;
  isRecording?: boolean;
  shouldShowMonthLearnPrompt?: boolean;
  shouldShowYearLearnPrompt?: boolean;
  isInitialState?: boolean;
}

const TerminalStatusLine: React.FC<TerminalStatusLineProps> = ({
  status,
  agentName,
  intelligenceLevel = 0,
  isMobile = false,
  isTablet = false,
  workflowStatus = null,
  workflowPrompt = null,
  shouldShowMonthLearnPrompt = false,
  shouldShowYearLearnPrompt = false,
  isInitialState = false
}) => {
  const [dots, setDots] = useState('');
  const [prevStatus, setPrevStatus] = useState(status);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animate dots for active processing states
  useEffect(() => {
    if (status === 'thinking' || status === 'learning' || status === 'evolving' || status === 'recording') {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '.';
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [status]);

  // Handle status transitions with animation
  useEffect(() => {
    if (status !== prevStatus) {
      setIsTransitioning(true);
      const fadeTimer = setTimeout(() => {
        setPrevStatus(status);
        setIsTransitioning(false);
      }, 150); // Half of the animation duration for smooth transition
      return () => clearTimeout(fadeTimer);
    }
  }, [status, prevStatus]);
  const activeWorkflowStatus = workflowStatus;
  const promptMessage = workflowPrompt;

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'connected';
      case 'connecting': return 'connecting...';
      case 'syncing': return 'syncing...';
      case 'thinking': return 'thinking';
      case 'responding': return 'generating';
      case 'learning': return 'learning';
      case 'evolving': return 'evolving';
      case 'retrying': return 'retrying';
      case 'recording': return 'recording audio';
      case 'error': return 'failed';
      case 'no_agent': return 'no agent';
      default: return 'initializing';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#10B981';
      case 'thinking':
      case 'responding': return '#A855F7';
      case 'learning': return '#10B981';
      case 'evolving': return '#F59E0B';
      case 'retrying': return '#FCD34D';
      case 'recording': return '#EF4444';  // Red for recording
      case 'connecting':
      case 'syncing': return '#FCD34D';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getGradientColorsForStatus = (statusType: typeof status): string[] => {
    switch (statusType) {
      case 'thinking':
      case 'responding':
        return ['#A855F7', '#EC4899', '#A855F7', '#EC4899', '#A855F7']; // Purple-Pink gradient

      case 'learning':
        return ['#10B981', '#34D399', '#10B981', '#34D399', '#10B981']; // Emerald-Green gradient

      case 'evolving':
        return ['#F59E0B', '#FBBF24', '#F59E0B', '#FBBF24', '#F59E0B']; // Amber-Yellow gradient

      case 'recording':
        return ['#EF4444', '#F87171', '#EF4444', '#F87171', '#EF4444']; // Red gradient

      case 'connecting':
      case 'syncing':
      case 'retrying':
        return ['#FCD34D', '#FDE68A', '#FCD34D', '#FDE68A', '#FCD34D']; // Yellow gradient

      case 'online':
        return ['#10B981', '#34D399', '#10B981', '#34D399', '#10B981']; // Green gradient

      case 'error':
        return ['#EF4444', '#F87171', '#EF4444', '#F87171', '#EF4444']; // Red gradient

      default:
        return ['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF']; // Default white-violet
    }
  };

  const retryMatch = activeWorkflowStatus?.match(/Attempt\s*(\d+)\/(\d+)/i);
  const retryInfo = retryMatch ? {
    attempt: Number.parseInt(retryMatch[1], 10),
    max: Number.parseInt(retryMatch[2], 10)
  } : null;

  const getProgressPercent = () => {
    if (status === 'thinking') return 30;
    if (status === 'learning') return 65;
    if (status === 'evolving') return 90;
    if (activeWorkflowStatus) {
      const lower = activeWorkflowStatus.toLowerCase();
      if (lower.includes('upload attempt') || lower.includes('uploading') || lower.includes('retrying')) return 50;
      if (lower.includes('verifying')) return 75;
      if (lower.includes('contract')) return 90;
      if (lower.includes('synced')) return 95;
      if (lower.includes('saved')) return 100;
    }
    return 0;
  };

  const progressPercent = getProgressPercent();

  const hasPromptSection = !isInitialState && (promptMessage || activeWorkflowStatus || retryInfo || progressPercent > 0);

  return (
    <div style={{
      textAlign: 'center',
      margin: '0.75rem 0 1.25rem 0',
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: isMobile ? '11px' : isTablet ? '12px' : '13px',
      lineHeight: '1.4',
      color: '#E5E5E5',
      letterSpacing: '0.5px',
      fontWeight: '400',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: hasPromptSection ? (isMobile ? '0.8rem' : '1rem') : 0,
      minHeight: 'auto',
      transition: 'gap 0.3s ease'
    }}>
      <div style={{
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(-3px)' : 'translateY(0)'
      }}>
        {status === 'recording' ? (
          // Special display for recording state
          <>
            <span style={{ color: '#9CA3AF' }}>status: </span>
            <GradientText
              inline
              showBorder={false}
              colors={getGradientColorsForStatus(status)}
              animationSpeed={3.5}
            >
              {getStatusText()}
            </GradientText>
            <span style={{
              color: getStatusColor(),
              fontWeight: '500',
              minWidth: '18px',
              display: 'inline-block',
              textAlign: 'left',
            }}>
              {dots}
            </span>
          </>
        ) : (status === 'thinking' || status === 'learning' || status === 'evolving' || status === 'retrying') && agentName ? (
          // Special display for active processing states
          <>
            <span style={{ color: '#9CA3AF' }}>status: </span>
            <GradientText
              inline
              showBorder={false}
              colors={['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF']}
              animationSpeed={3.5}
            >
              {agentName}
            </GradientText>
            <span style={{ color: '#9CA3AF' }}>{' is '}</span>
            <GradientText
              inline
              showBorder={false}
              colors={getGradientColorsForStatus(status)}
              animationSpeed={3.5}
            >
              {getStatusText()}
            </GradientText>
            <span style={{
              color: getStatusColor(),
              fontWeight: '500',
              minWidth: '18px',
              display: 'inline-block',
              textAlign: 'left',
            }}>
              {dots}
            </span>
          </>
        ) : (
          // Normal status display
          <>
            <span style={{ color: '#9CA3AF' }}>status: </span>
            <GradientText
              inline
              showBorder={false}
              colors={getGradientColorsForStatus(status)}
              animationSpeed={3.5}
            >
              {getStatusText()}
            </GradientText>

          {status !== 'no_agent' && agentName && (
            <>
              <span style={{ color: '#9CA3AF' }}> with </span>
              <GradientText
                inline
                showBorder={false}
                colors={['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF']}
                animationSpeed={3}
              >
                {agentName}
              </GradientText>
            </>
          )}

          {status !== 'no_agent' && intelligenceLevel > 0 && (
            <>
              <span style={{ color: '#9CA3AF' }}> | intelligence: </span>
              <span style={{
                color: '#A855F7',
                fontWeight: '500',
              }}>
                {intelligenceLevel}
              </span>
            </>
          )}

          {/* Consolidation hints - pulsating prompts */}
          {status === 'online' && (shouldShowMonthLearnPrompt || shouldShowYearLearnPrompt) && (
            <>
              <span style={{ color: '#9CA3AF' }}> | </span>
              <span style={{
                color: '#A855F7',
                fontWeight: '500',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                {shouldShowMonthLearnPrompt && 'month-learn'}
                {shouldShowMonthLearnPrompt && shouldShowYearLearnPrompt && ', '}
                {shouldShowYearLearnPrompt && 'memory-core'}
                {' available'}
              </span>
            </>
          )}
        </>
      )}

        {status === 'no_agent' && (
          <>
            <span style={{ color: '#9CA3AF' }}> | </span>
            <span style={{
              color: '#9CA3AF',
              fontStyle: 'italic',
              fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px',
            }}>
              go 'mint' section to create agent
            </span>
          </>
        )}
      </div>

      {hasPromptSection && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'center'
        }}>
          {promptMessage && (
            <div style={{
              color: '#CBD5F5',
              fontSize: isMobile ? '10px' : '12px',
              letterSpacing: '0.4px',
              maxWidth: '90%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {promptMessage}
            </div>
          )}

          {!promptMessage && activeWorkflowStatus && !/\bis\s+(thinking|learning|evolving)\b/i.test(activeWorkflowStatus) && (
            <div style={{
              color: '#CBD5F5',
              fontSize: isMobile ? '10px' : '12px',
              letterSpacing: '0.4px',
              maxWidth: '90%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeWorkflowStatus}
            </div>
          )}

          {(retryInfo || progressPercent > 0) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              maxWidth: '90%'
            }}>
              {retryInfo && retryInfo.max > 0 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#FBBF24',
                  fontSize: isMobile ? '10px' : '11px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>⟳</span>
                  <span>Retry {retryInfo.attempt}/{retryInfo.max}</span>
                </div>
              )}

              {progressPercent > 0 && (
                <div style={{
                  flex: '1 1 140px',
                  maxWidth: '280px',
                  height: '4px',
                  background: 'rgba(148, 163, 184, 0.25)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${Math.min(progressPercent, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalStatusLine;
