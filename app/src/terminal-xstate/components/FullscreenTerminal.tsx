'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { MinimalOutput } from './MinimalOutput';
import { PremiumCommandBar } from './PremiumCommandBar';
import { TerminalSystemHeader } from './TerminalSystemHeader';
import AIOrb from './AIOrb';
import TerminalStatusLine from './TerminalStatusLine';
import { MemoryDownloadHandler } from './MemoryDownloadHandler';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalAgent } from '../hooks/useTerminalAgent';
import { useConsolidationStatus } from '../hooks/useConsolidationStatus';
import { useAccount, usePublicClient } from 'wagmi';
import { useSafeActorState } from '../hooks/useSafeSelector';
import { breakpoints } from '../../utils/responsive';
import { useRouter } from 'next/navigation';
import {
  useWatchAishiAgentConsolidationCompletedEvent,
  useWatchAishiAgentYearlyReflectionAvailableEvent
} from '../../generated';

interface FullscreenTerminalProps {
  selectedModel?: string;
  selectedVoice?: string;
}

// Premium color palette
const colors = {
  noir: '#0A0A0A',
  charcoal: '#1A1A1A',
  slate: '#2D2D2D',
  silver: '#8A8A8A',
  pearl: '#F0F0F0',
  accent: '#8B5CF6',
  accentMuted: 'rgba(139, 92, 246, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)'
};

export const FullscreenTerminal: React.FC<FullscreenTerminalProps> = ({ selectedModel, selectedVoice }) => {
  const log = logger.child({ component: 'FullscreenTerminal' });
  const router = useRouter();
  const {
    context,
    send,
    state,
    brokerRef,
    modelRef,
    agentRef,
    voiceRef,
    isDreamActive,
    dreamStatus,
    dreamPrompt,
    isChatActive,
    chatStatus,
    chatPrompt,
    isVoiceEnabled
  } = useTerminal();
  const { agentName, isLoading: agentLoading } = useTerminalAgent();
  const { shouldShowMonthLearnPrompt, shouldShowYearLearnPrompt } = useConsolidationStatus();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Subscribe to agent state using safe selector
  const agentState = useSafeActorState(agentRef);
  const agentStatus = agentState?.context?.status || 'uninitialized';
  const syncedAgentName = agentState?.context?.agentName || null;
  const syncProgress = agentState?.context?.syncProgress || undefined;
  const intelligenceLevel = agentState?.context?.intelligenceLevel || 0;

  // Map agent status to orb status
  const getOrbStatus = () => {
    if (!isConnected) return 'uninitialized';
    if (agentStatus === 'syncing') return 'syncing';
    if (agentStatus === 'connected' && syncedAgentName) {
      // Priority 1: Check if TTS is synthesizing (voice workflow active)
      if (context.isSynthesizing) return 'thinking';
      // Priority 2: Check if any processing with status message
      const lowerDreamStatus = dreamStatus?.toLowerCase() || '';
      const lowerChatStatus = chatStatus?.toLowerCase() || '';
      if (lowerDreamStatus.includes('retry') || lowerChatStatus.includes('retry')) {
        return 'retrying';
      }
      if (dreamStatus) {
        if (dreamStatus.includes('thinking')) return 'thinking';
        if (dreamStatus.includes('learning')) return 'learning';
        if (dreamStatus.includes('evolving')) return 'evolving';
      }
      // Check chat status
      if (chatStatus) {
        if (chatStatus.includes('thinking')) return 'thinking';
        if (chatStatus.includes('learning')) return 'learning';
        if (chatStatus.includes('evolving')) return 'evolving';
      }
      // Priority 3: Check if we're in active processing states (fallback)
      if (state.matches('processing')) return 'thinking';
      if (state.matches('executingCommand')) return 'thinking';
      if (state.matches('dreamWorkflow')) {
        // In dream workflow - check if we have active processing
        if (!dreamStatus || dreamStatus === 'Waiting for your response...') {
          return 'online'; // Only return online if explicitly waiting
        }
        return 'thinking'; // Default to thinking in dream workflow
      }
      if (state.matches('chatWorkflow')) {
        // In chat workflow - check if we have active processing
        if (!chatStatus || chatStatus === 'Type your message...') {
          return 'online'; // Only return online if explicitly waiting
        }
        return 'thinking'; // Default to thinking in chat workflow
      }
      return 'online';
    }
    if (agentStatus === 'no_agent') return 'no_agent';
    if (agentStatus === 'error') return 'error';
    if (state.matches('processing')) return 'thinking';
    if (state.matches('dreamWorkflow')) return 'thinking';
    if (state.matches('chatWorkflow')) return 'thinking';
    if (agentLoading) return 'connecting';
    return 'uninitialized';
  };

  // Detect viewport size
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < breakpoints.sm);
      setIsTablet(width >= breakpoints.sm && width < breakpoints.lg);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Handle command submission
  const handleSubmit = useCallback(() => {
    if (context.currentInput.trim()) {
      send({ type: 'INPUT.SUBMIT' });
    }
  }, [context.currentInput, send]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    send({ type: 'INPUT.CHANGE', value });
  }, [send]);

  // Handle history navigation
  const handleHistoryUp = useCallback(() => {
    send({ type: 'HISTORY.UP' });
  }, [send]);

  const handleHistoryDown = useCallback(() => {
    send({ type: 'HISTORY.DOWN' });
  }, [send]);

  // Handle clear
  const handleClear = useCallback(() => {
    send({ type: 'CLEAR' });
  }, [send]);

  const handleQuickSubmit = useCallback((value: string) => {
    send({ type: 'INPUT.CHANGE', value });
    send({ type: 'INPUT.SUBMIT' });
  }, [send]);

  // Handle voice input
  const handleVoiceInput = useCallback((audioBase64: string, audioBlob: Blob) => {
    log.debug('handleVoiceInput triggered', {
      audioBase64Length: audioBase64.length,
      audioBlobSize: audioBlob.size,
      hasVoiceRef: !!voiceRef,
      isDreamActive,
      isChatActive
    });

    // First, display the voice message in terminal
    send({
      type: 'APPEND_VOICE_INPUT',
      audioBase64,
      audioBlob,
      duration: Math.max(1, Math.round(audioBlob.size / 10000)) // Estimate duration
    });

    if (voiceRef) {
      // Mark that this will be voice input
      send({ type: 'SET_VOICE_INPUT', value: true });
      // Send audio to STT through voice machine
      voiceRef.send({ type: 'TRANSCRIBE', audioBase64 });
      log.debug('Sent TRANSCRIBE to voice machine');
    }
  }, [voiceRef, send, isDreamActive, isChatActive, log]);

  // Handle navigation back to aishiOS
  const handleClose = useCallback(() => {
    router.push('/aishiOS');
  }, [router]);

  // Initialize broker and agent when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Initialize broker
      if (brokerRef) {
        log.debug('Initializing broker', { address });
        brokerRef.send({ type: 'INITIALIZE', walletAddress: address });
      }

      // Sync agent with contract
      if (agentRef && publicClient) {
        log.debug('Syncing agent with viem publicClient', {
          address,
          chainId: publicClient.chain?.id,
          chainName: publicClient.chain?.name,
          transportType: publicClient.transport?.type
        });
        agentRef.send({
          type: 'SYNC',
          walletAddress: address,
          provider: publicClient
        });
      } else {
        log.debug('Cannot sync agent', {
          hasAgentRef: !!agentRef,
          hasPublicClient: !!publicClient,
          address
        });
      }
    }

    // Handle wallet disconnect - reset agent state
    if (!isConnected && agentRef) {
      log.debug('Wallet disconnected, resetting agent');
      agentRef.send({ type: 'RESET' });
    }
  }, [isConnected, address, brokerRef, agentRef, publicClient, log]);

  // Update model in terminal when selectedModel changes
  useEffect(() => {
    if (selectedModel && modelRef) {
      modelRef.send({ type: 'SELECT_MODEL', modelId: selectedModel });
    }
  }, [selectedModel, modelRef]);

  // Update voice in terminal when selectedVoice changes
  useEffect(() => {
    if (selectedVoice && voiceRef) {
      voiceRef.send({ type: 'SELECT_VOICE', voiceId: selectedVoice });
    }
  }, [selectedVoice, voiceRef]);

  // Watch for ConsolidationCompleted events
  useWatchAishiAgentConsolidationCompletedEvent({
    onLogs: (logs) => {
      logs.forEach(log => {
        const { tokenId, period, bonus, specialReward } = log.args;
        const currentTokenId = agentState?.context?.tokenId;

        if (currentTokenId && Number(tokenId) === currentTokenId) {
          send({
            type: 'APPEND_LINES',
            lines: [{
              type: 'success',
              content: `✓ Monthly consolidation completed! Period: ${period}, Bonus: +${bonus} INT${specialReward ? `, Reward: ${specialReward}` : ''}`,
              timestamp: Date.now()
            }]
          });
        }
      });
    }
  });

  // Watch for YearlyReflectionAvailable events
  useWatchAishiAgentYearlyReflectionAvailableEvent({
    onLogs: (logs) => {
      logs.forEach(log => {
        const { tokenId, year } = log.args;
        const currentTokenId = agentState?.context?.tokenId;

        if (currentTokenId && Number(tokenId) === currentTokenId) {
          send({
            type: 'APPEND_LINES',
            lines: [{
              type: 'success',
              content: `✓ Yearly memory core available for ${year}! Type 'memory-core' to crystallize consciousness (+5 INT)`,
              timestamp: Date.now()
            }]
          });
        }
      });
    }
  });

  // Handle escape key to go back (optional)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  // Detect if we're in initial state (no messages yet)
  const isInitialState = context.lines.length === 0;

  // Memoized MinimalOutput to prevent re-renders on input changes
  const memoizedMinimalOutput = useMemo(() => (
    <MinimalOutput
      lines={context.lines}
      welcomeLines={context.welcomeLines}
      agentStatus={agentStatus}
      agentName={syncedAgentName}
      syncProgress={syncProgress}
      isChatActive={isChatActive}
      onEndSession={() => send({ type: 'END_SESSION' })}
      isInitialState={isInitialState}
    />
  ), [context.lines, context.welcomeLines, agentStatus, syncedAgentName, syncProgress, isChatActive, send, isInitialState]);

  // Fullscreen layout styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#000000', // Pure black background
    color: colors.pearl,
    overflow: 'hidden',
    position: 'relative'
  };

  const headerContainerStyle: React.CSSProperties = {
    flexShrink: 0,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    background: colors.charcoal,
    position: 'sticky',
    top: 0,
    zIndex: 10
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
    padding: isMobile ? '20px 10px' : '20px',
    background: '#000000' // Pure black background
  };

  const orbSectionStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: isInitialState ? '12px' : '4px',
    transform: isInitialState ? 'scale(1)' : 'scale(0.82)',
    transition: 'transform 0.3s ease, margin 0.3s ease'
  };

  const statusSectionStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '100%',
    maxWidth: '800px',
    marginBottom: isInitialState ? '14px' : '6px',
    fontSize: isInitialState ? '14px' : '12px',
    transform: isInitialState ? 'scale(1)' : 'scale(0.9)',
    transition: 'all 0.3s ease'
  };

  const messageAreaStyle: React.CSSProperties = {
    flex: isInitialState ? 'none' : 1,
    width: '100%',
    maxWidth: '1200px',
    minHeight: isInitialState ? 'auto' : 0, // Auto height for initial state to show welcome
    display: 'flex',
    flexDirection: 'column',
    marginTop: isInitialState ? '0' : '8px',
    marginBottom: isInitialState ? '10px' : '20px'
  };

  // Command bar wrapper - handles positioning
  const commandBarWrapperStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 20px',
    transition: 'all 0.3s ease',
    ...(isInitialState ? {
      // Initial state: relative position
      position: 'relative' as const,
      marginBottom: '32px'
    } : {
      // Chat state: sticky bottom (no background or border)
      position: 'sticky' as const,
      bottom: 0,
      zIndex: 10,
      paddingTop: '8px',
      paddingBottom: '8px'
    })
  };

  // Command bar inner container - always centered and rounded
  const commandBarInnerStyle: React.CSSProperties = {
    maxWidth: '700px',
    width: '100%',
    background: 'rgba(26, 26, 26, 0.85)',
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  };

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={containerStyle}>
        {/* Fixed Header */}
        <div style={headerContainerStyle}>
          <TerminalSystemHeader
            agentName={syncedAgentName || agentName}
            isLoading={agentLoading}
            selectedModel={selectedModel}
            terminalState={state}
            brokerRef={brokerRef}
            modelRef={modelRef}
            onClose={handleClose}
            isMobile={isMobile}
            isTablet={isTablet}
            isFullscreen={true}
          />
        </div>

        {/* Main Content Area */}
        <div style={mainContentStyle}>
          {/* AI Orb Section */}
          <div style={orbSectionStyle}>
            <AIOrb
              status={getOrbStatus()}
              agentName={syncedAgentName}
              intelligenceLevel={intelligenceLevel}
              syncProgress={syncProgress}
              isMobile={isMobile}
              isTablet={isTablet}
              isInitialState={isInitialState}
            />
          </div>

          {/* Status Line Section */}
          <div style={statusSectionStyle}>
            <TerminalStatusLine
              status={isRecording ? 'recording' : getOrbStatus()}
              agentName={syncedAgentName}
              intelligenceLevel={intelligenceLevel}
              isMobile={isMobile}
              isTablet={isTablet}
              workflowStatus={isChatActive ? chatStatus : dreamStatus}
              workflowPrompt={isChatActive ? chatPrompt : dreamPrompt}
              isChatActive={isChatActive}
              isRecording={isRecording}
              shouldShowMonthLearnPrompt={shouldShowMonthLearnPrompt}
              shouldShowYearLearnPrompt={shouldShowYearLearnPrompt}
              isInitialState={isInitialState}
            />
          </div>

          {/* Messages Area - Expandable */}
          <div style={messageAreaStyle}>
            {memoizedMinimalOutput}
          </div>
        </div>

        {/* Command Bar - Always centered and rounded, moves to bottom after first message */}
        <div style={commandBarWrapperStyle}>
          <div style={commandBarInnerStyle}>
            <PremiumCommandBar
              value={context.currentInput}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              onHistoryUp={handleHistoryUp}
              onHistoryDown={handleHistoryDown}
              onClear={handleClear}
              disabled={state.matches('processing')}
              isChatActive={isChatActive}
              isDreamActive={isDreamActive}
              onEndSession={() => send({ type: 'END_SESSION' })}
              onVoiceInput={handleVoiceInput}
              isVoiceEnabled={true}
              onRecordingStateChange={setIsRecording}
              dreamStatus={dreamStatus}
              dreamPrompt={dreamPrompt}
              chatStatus={chatStatus}
              chatPrompt={chatPrompt}
              onQuickSubmit={handleQuickSubmit}
              promptSymbol={isChatActive ? '~' : isDreamActive ? '~' : '>'}
              isInitialState={isInitialState}
            />
          </div>
        </div>

        {/* Memory Download Handler - handles download clicks */}
        <MemoryDownloadHandler send={send} />
      </div>
    </>
  );
};