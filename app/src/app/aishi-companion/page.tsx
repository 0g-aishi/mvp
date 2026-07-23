'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { FaArrowLeft } from 'react-icons/fa';
import { Live2DModel } from '@/components/live2d/Live2DModel';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { SessionStartDialog } from './components/SessionStartDialog';
import { SaveConfirmationDialog } from './components/SaveConfirmationDialog';
import { SaveRetryDialog } from './components/SaveRetryDialog';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { ClothingControl } from './components/ClothingControl';
import { useAIParameterControl } from './hooks/useAIParameterControl';
import { useAIChatSession } from './hooks/useAIChatSession';
import { useLipSync } from './hooks/useLipSync';
import { PHYSICS_DEFAULTS } from './services/aiParameterService';
import { useReadAishiAgentOwnerToTokenId } from '@/generated';
import { Toaster } from 'react-hot-toast';
import { logger } from '@/lib/logger';

export default function AishiCompanion() {
  const log = logger.child({ component: 'AishiCompanion' });
  const router = useRouter();
  const modelRef = useRef<Live2DModelRef>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: tokenId } = useReadAishiAgentOwnerToTokenId({
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // State
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [hasAgent, setHasAgent] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);

  // Drag & Zoom state
  const [currentScale, setCurrentScale] = useState(0.4);
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; modelX: number; modelY: number } | null>(null);

  // Enhanced Mode state (cursor following)
  const [enhancedMode, setEnhancedMode] = useState(false);

  // Hooks
  const { currentValues, isAnimating, processAIResponse } = useAIParameterControl(modelRef);
  const {
    state: sessionState,
    messages,
    saveData,
    retryCount,
    retryError,
    retryStep,
    maxRetries,
    initializeSession,
    initializeSessionWithFallback,
    sendMessage,
    endSession,
    confirmSave,
    retryOperation,
    abortRetry
  } = useAIChatSession(modelRef, currentValues);
  const { startLipSync, stopLipSync } = useLipSync(modelRef);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Agent check effect (after model loads)
  useEffect(() => {
    if (!isModelReady) return;

    log.debug('Checking for agent', { isConnected, address, tokenId });

    if (!isConnected || !address) {
      // No wallet connected - use fallback
      log.debug('No wallet connected, will use fallback personality');
      setHasAgent(false);
      setAgentId(null);
      setShowSessionDialog(true);
      return;
    }

    const agentTokenId = tokenId ? Number(tokenId) : 0;

    if (agentTokenId === 0) {
      // Wallet connected but no agent NFT
      log.debug('Wallet connected but no agent NFT, will use fallback');
      setHasAgent(false);
      setAgentId(null);
      setShowSessionDialog(true);
    } else {
      // User has agent NFT
      log.debug('Agent found', { tokenId: agentTokenId });
      setHasAgent(true);
      setAgentId(agentTokenId);
      setShowSessionDialog(true);
    }
  }, [isModelReady, isConnected, address, tokenId]);

  // Model load handler
  const handleModelLoad = useCallback(() => {
    if (!modelRef.current) return;

    setIsModelReady(true);
    log.debug('Model loaded successfully');

    try {
      const model = modelRef.current.getModel();
      if (!model) return;

      // Disable auto blinking for manual control
      if (model.internalModel.eyeBlink) {
        model.internalModel.eyeBlink = null;
        log.debug('Auto blinking disabled');
      }

      // Stop idle motion
      modelRef.current.stopAllMotions();
      log.debug('Idle motion stopped');

      // Initialize physics defaults
      Object.entries(PHYSICS_DEFAULTS).forEach(([paramId, value]) => {
        modelRef.current!.setParameterValue(paramId, value);
      });

      log.debug('Physics defaults applied', PHYSICS_DEFAULTS);

      // Initialize model position (will be set after agent check)
      const initialPos = modelRef.current.getPosition();
      setModelPosition(initialPos);

    } catch (error) {
      log.error('Error in model initialization', { error: String(error) });
    }
  }, []);

  // Model error handler
  const handleModelError = useCallback((error: string) => {
    setModelError(error);
    log.error('Model load error', { error });
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modelRef.current) return;

    setIsDragging(true);
    const pos = modelRef.current.getPosition();

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      modelX: pos.x,
      modelY: pos.y
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !modelRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newX = dragStartRef.current.modelX + deltaX;
    const newY = dragStartRef.current.modelY + deltaY;

    setModelPosition({ x: newX, y: newY });
    modelRef.current.updatePosition(newX, newY);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!modelRef.current) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    const newScale = Math.max(0.1, Math.min(2.0, currentScale + delta));

    setCurrentScale(newScale);
    modelRef.current.updateScale(newScale);
  }, [currentScale]);

  // Attach wheel listener
  useEffect(() => {
    const container = document.querySelector('.live2d-stage');
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => handleWheel(e);
    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => container.removeEventListener('wheel', wheelHandler);
  }, [handleWheel]);

  // Enhanced Mode - Cursor following with smart toggle
  useEffect(() => {
    // Only activate when Enhanced Mode is ON and not during AI animations
    const shouldTrack = enhancedMode &&
                       sessionState !== 'thinking' &&
                       sessionState !== 'animating' &&
                       !isDragging;

    if (!shouldTrack || !modelRef.current || !isModelReady) return;

    const container = document.querySelector('.live2d-stage') as HTMLElement;
    if (!container) return;

    const handleCursorTracking = (e: MouseEvent) => {
      if (!modelRef.current || isDragging) return;

      // Get container bounds for normalized coordinates
      const rect = container.getBoundingClientRect();

      // Calculate normalized position (-1 to 1)
      const normalizedX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normalizedY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;

      // Update Head parameters (ParamAngleX/Y range: -30 to +30)
      modelRef.current.setParameterValue('ParamAngleX', normalizedX * 30);
      modelRef.current.setParameterValue('ParamAngleY', normalizedY * 30);

      // Update Eye Gaze parameters (ParamEyeBallX/Y range: -1 to +1)
      modelRef.current.setParameterValue('ParamEyeBallX', normalizedX * 0.8);
      modelRef.current.setParameterValue('ParamEyeBallY', normalizedY * 0.8);
    };

    container.addEventListener('mousemove', handleCursorTracking);

    log.debug('Enhanced Mode cursor tracking enabled');

    return () => {
      container.removeEventListener('mousemove', handleCursorTracking);

      // Reset parameters when Enhanced Mode disabled
      if (modelRef.current) {
        modelRef.current.setParameterValue('ParamAngleX', 0);
        modelRef.current.setParameterValue('ParamAngleY', 0);
        modelRef.current.setParameterValue('ParamEyeBallX', 0);
        modelRef.current.setParameterValue('ParamEyeBallY', 0);
      }

      log.debug('Enhanced Mode cursor tracking disabled');
    };
  }, [enhancedMode, sessionState, isDragging, isModelReady]);

  // Start session handler
  const handleStartSession = useCallback(async () => {
    setShowSessionDialog(false);
    log.debug('Starting chat session', { hasAgent, agentId });

    if (hasAgent && agentId) {
      // Load from blockchain
      await initializeSession(agentId, 'Agent');
    } else {
      // Use fallback personality
      await initializeSessionWithFallback('Aishi');
    }
  }, [hasAgent, agentId, initializeSession, initializeSessionWithFallback]);

  // Cancel session handler
  const handleCancelSession = useCallback(() => {
    setShowSessionDialog(false);
    router.push('/');
  }, [router]);

  // Send message handler
  const handleSendMessage = useCallback(async (text: string) => {
    if (sessionState !== 'ready' || isAnimating) {
      log.debug('Cannot send message', { sessionState, isAnimating });
      return;
    }

    log.debug('User sent message', { text });

    // Send message and get AI response
    const aiResponse = await sendMessage(text);

    if (!aiResponse) {
      log.debug('No AI response received');
      return;
    }

    // Process AI response for parameters and animations
    const cleanText = await processAIResponse(aiResponse);

    // Display message
    setCurrentMessage(cleanText);

    // Start lip sync during message display
    startLipSync(cleanText);

    // Clear message after display (handled by MessageBubble)
  }, [sessionState, isAnimating, sendMessage, processAIResponse, startLipSync]);

  // Message complete handler
  const handleMessageComplete = useCallback(() => {
    setCurrentMessage(null);
    stopLipSync();
    log.debug('Message display complete');
  }, [stopLipSync]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Toast notifications */}
      <Toaster position="top-center" />

      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 30,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s ease',
          }}
        >
          <FaArrowLeft size={14} />
          Back
        </button>

        {/* Title */}
        <h1
          style={{
            color: '#8B5CF6',
            fontSize: '20px',
            fontWeight: 'bold',
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Aishi Companion
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status */}
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: sessionState === 'ready'
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(139, 92, 246, 0.2)',
              border: `1px solid ${sessionState === 'ready' ? '#22C55E' : '#8B5CF6'}`,
              borderRadius: '8px',
              color: sessionState === 'ready' ? '#22C55E' : '#8B5CF6',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '500',
            }}
          >
            {sessionState === 'ready' && 'Online'}
            {sessionState === 'thinking' && 'Thinking...'}
            {sessionState === 'animating' && 'Animating...'}
            {sessionState === 'speaking' && 'Speaking...'}
            {sessionState === 'initializing' && 'Loading...'}
            {sessionState === 'confirmingSave' && 'Confirm Save'}
            {sessionState === 'summarizing' && 'Summarizing...'}
            {sessionState === 'saving' && 'Saving...'}
            {sessionState === 'uploadRetryPrompt' && `Upload Retry ${retryCount}/${maxRetries}`}
            {sessionState === 'contractRetryPrompt' && `Contract Retry ${retryCount}/${maxRetries}`}
            {sessionState === 'completed' && 'Completed'}
            {sessionState === 'idle' && 'Idle'}
            {sessionState === 'error' && 'Error'}
          </div>

          {/* END SESSION button */}
          {sessionState === 'ready' && (
            <button
              onClick={endSession}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Live2D Model */}
      <div
        className="live2d-stage"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
          // Glowing border when Enhanced Mode is active
          boxShadow: enhancedMode && sessionState !== 'thinking' && sessionState !== 'animating'
            ? '0 0 30px 5px rgba(139, 92, 246, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.2)'
            : 'none',
          border: enhancedMode && sessionState !== 'thinking' && sessionState !== 'animating'
            ? '2px solid rgba(139, 92, 246, 0.5)'
            : 'none',
          transition: 'box-shadow 0.3s ease, border 0.3s ease',
        }}
      >
        <Live2DModel
          ref={modelRef}
          modelPath="/水母_vts/水母.model3.json"
          width={windowSize.width}
          height={windowSize.height - 60}
          scale={0.4}
          transparent={true}
          autoPlay={false}
          onLoad={handleModelLoad}
          onError={handleModelError}
        />
      </div>

      {/* Clothing Control */}
      {isModelReady && (
        <ClothingControl
          modelRef={modelRef}
          enhancedMode={enhancedMode}
          onEnhancedModeChange={setEnhancedMode}
        />
      )}

      {/* Message Display */}
      {currentMessage && (
        <MessageBubble
          text={currentMessage}
          agentName="Aishi"
          onComplete={handleMessageComplete}
          displayDuration={15000}
        />
      )}

      {/* Chat Input */}
      {isModelReady && sessionState === 'ready' && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={sessionState !== 'ready' || isAnimating}
          placeholder="Type your message..."
        />
      )}

      {/* Session Start Dialog */}
      <SessionStartDialog
        isOpen={showSessionDialog}
        onStart={handleStartSession}
        onCancel={handleCancelSession}
        agentName="Aishi"
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmationDialog
        isOpen={sessionState === 'confirmingSave'}
        agentName="Aishi"
        onConfirm={() => confirmSave(true)}
        onCancel={() => confirmSave(false)}
      />

      {/* Save Retry Dialog */}
      <SaveRetryDialog
        isOpen={sessionState === 'uploadRetryPrompt' || sessionState === 'contractRetryPrompt'}
        errorMessage={retryError}
        retryCount={retryCount}
        maxRetries={maxRetries}
        stepName={retryStep === 'upload' ? '0G Storage Upload' : 'Blockchain Contract Update'}
        onRetry={retryOperation}
        onAbort={abortRetry}
      />

      {/* Loading overlay */}
      {!isModelReady && !modelError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#8B5CF6',
              marginBottom: '16px',
              fontFamily: "'JetBrains Mono', monospace",
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            Loading Aishi Model...
          </div>
        </div>
      )}

      {/* Error overlay */}
      {modelError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div
            style={{
              fontSize: '20px',
              color: '#EF4444',
              marginBottom: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Failed to Load Model
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            {modelError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8B5CF6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Reload Page
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
