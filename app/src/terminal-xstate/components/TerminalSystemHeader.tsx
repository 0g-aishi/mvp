/**
 * @fileoverview Terminal System Header Component
 * @description Professional header showing system info, AI model, broker status, and agent sync
 */

import React, { useState } from 'react';
import { useSafeActorState } from '../hooks/useSafeSelector';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccount } from 'wagmi';
import { FundBrokerModal } from './FundBrokerModal';
import { X } from 'lucide-react';
import { touchTargets } from '../../utils/responsive';
import GradientText from '../../components/ui/GradientText';
import { logger } from '@/lib/logger';

interface TerminalSystemHeaderProps {
  agentName: string | null;
  isLoading: boolean;
  selectedModel?: string;
  terminalState?: any;
  brokerRef?: any;
  modelRef?: any;
  onClose?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
  isFullscreen?: boolean;
}


const TerminalSystemHeaderComponent: React.FC<TerminalSystemHeaderProps> = ({
  agentName,
  isLoading,
  selectedModel,
  terminalState,
  brokerRef: propBrokerRef,
  modelRef: propModelRef,
  onClose,
  isMobile = false,
  isTablet = false,
  isFullscreen = false
}) => {
  const { theme } = useTheme();
  const { address } = useAccount();
  const [showFundModal, setShowFundModal] = useState(false);

  // Logger instance
  const log = logger.child({ component: 'TerminalSystemHeader' });
  
  // Use props if provided
  const brokerRef = propBrokerRef;
  const modelRef = propModelRef;
  
  // Subscribe to actor states using safe selector
  const brokerState = useSafeActorState(brokerRef);
  const modelState = useSafeActorState(modelRef);
  
  // Extract broker info
  const brokerStatus = brokerState?.context?.status || 'uninitialized';
  const brokerBalance = brokerState?.context?.balance || 0;
  
  // Debug broker state only when it changes
  React.useEffect(() => {
    if (brokerStatus !== 'uninitialized') {
      log.debug('Broker state changed', { 
        status: brokerStatus, 
        balance: brokerBalance,
        error: brokerState?.context?.errorMessage,
        walletAddress: brokerState?.context?.walletAddress
      });
    }
  }, [brokerStatus, brokerBalance, brokerState?.context?.errorMessage]);
  
  // Extract model info - use prop first, then actor state
  const currentModel = selectedModel || modelState?.context?.selectedModel || 'auto';
  
  // Check if current model needs broker (ALL 0G Network models from decentralized providers)
  // 0G Network models have format: provider/model-name (e.g., phala/*, openai/*, etc.)
  // Gemini models don't have slash (gemini-2.5-flash-*)
  const is0GNetworkModel = currentModel.includes('/') && !currentModel.startsWith('gemini-');

  const modelNeedsBroker = is0GNetworkModel ||
                          (modelState?.context?.availableModels?.find(
                            (m: any) => m.id === currentModel
                          )?.needsBroker || false);
  
  // Format display names - returns JSX for 0G models to include logo
  const formatModelName = (modelId: string) => {
    if (modelId === 'auto') return 'Auto Select';
    if (modelId === 'gemini-2.5-flash') return 'Gemini 2.5 Flash';

    // Handle ALL 0G Network models (provider/model format)
    // Examples: phala/*, openai/*, anthropic/*, etc.
    if (modelId.includes('/') && !modelId.startsWith('gemini-')) {
      // Extract model name after "provider/" and add 0G logo
      const parts = modelId.split('/');
      const modelName = parts[1] || modelId; // Fallback to full if no slash

      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.4rem' }}>
          <span>{modelName}</span>
          <img
            src="/og.png"
            alt="0G Network"
            style={{
              height: isMobile ? '14px' : '16px',
              width: 'auto',
              objectFit: 'contain',
              opacity: 0.8,
              flexShrink: 0
            }}
          />
        </span>
      );
    }

    return modelId;
  };
  
  const handleFundBroker = () => {
    if (brokerRef && address) {
      if (brokerStatus === 'uninitialized') {
        // Initialize broker first
        brokerRef.send({ type: 'INITIALIZE', walletAddress: address });
      } else if (brokerStatus === 'initialized') {
        // Open fund modal for initialized broker
        setShowFundModal(true);
      }
    }
  };
  
  const handleCreateBroker = () => {
    if (brokerRef && address) {
      log.debug('Creating broker for wallet', { address });
      brokerRef.send({ type: 'CREATE' });
    }
  };
  // Determine if we need multi-line layout on mobile
  const needsMultiLine = isMobile && modelNeedsBroker;
  const headerHeight = needsMultiLine ? '80px' : '56px';

  return (
    <div style={{
      display: 'flex',
      flexDirection: needsMultiLine ? 'column' : 'row',
      alignItems: needsMultiLine ? 'stretch' : 'center',
      justifyContent: needsMultiLine ? 'flex-start' : 'space-between',
      padding: isMobile ? '0.75rem 1rem' : isTablet ? '0.75rem 1.25rem' : '0.75rem 1.5rem',
      minHeight: isMobile ? headerHeight : 'auto',
      borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
      background: 'rgba(0, 0, 0, 0.2)',
      fontFamily: 'monospace',
      fontSize: isMobile ? '0.75rem' : '0.85rem',
      position: 'relative',
      transition: 'min-height 0.3s ease'
    }}>
      {/* Main Header Content - Line 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '0.75rem' : '1.5rem',
        flex: needsMultiLine ? 'none' : 1,
        overflow: 'hidden'
      }}>
        {/* Left Side Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1.5rem',
          flex: 1,
          overflow: 'hidden'
        }}>
        {/* Logo */}
        <img 
          src="/logo_clean.png" 
          alt="Aishi"
          style={{ 
            height: isMobile ? '24px' : '28px',
            width: 'auto',
            objectFit: 'contain',
            opacity: 0.9,
            flexShrink: 0
          }} 
        />
      
        {/* Separator - hide on mobile */}
        {!isMobile && (
          <span style={{ color: theme.text.secondary, opacity: 0.3 }}>|</span>
        )}
        
        {/* System Info - hide on mobile */}
        {!isMobile && (
          <div style={{
            fontWeight: '600',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            <GradientText
              inline
              showBorder={false}
              colors={['#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF']}
              animationSpeed={3.5}
            >
              aishiOS v2.0
            </GradientText>
          </div>
        )}
      
        {/* Separator */}
        <span style={{ color: theme.text.secondary, opacity: 0.3 }}>|</span>
        
        {/* AI Model */}
        <div style={{ 
          color: theme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <span style={{ color: theme.text.secondary, flexShrink: 0 }}>AI:</span>
          <span style={{ 
            color: theme.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatModelName(currentModel)}
          </span>
        </div>
      
        {/* Broker Status - Only show for 0G models, hide on mobile */}
        {modelNeedsBroker && !isMobile && (
          <>
            {/* Separator */}
            <span style={{ color: theme.text.secondary, opacity: 0.3 }}>|</span>
          
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: 0
            }}>
            <span style={{ color: theme.text.secondary }}>Broker:</span>
            {brokerStatus === 'uninitialized' ? (
              <>
                <span style={{ color: theme.text.secondary }}>checking...</span>
              </>
            ) : brokerStatus === 'not_initialized' ? (
              <>
                <span style={{ color: '#FCD34D' }}>not_initialized</span>
              </>
            ) : brokerStatus === 'loading' ? (
              <span style={{ color: theme.text.secondary }}>loading...</span>
            ) : brokerStatus === 'error' ? (
              <span style={{ color: '#EF4444' }}>error</span>
            ) : brokerStatus === 'initialized' ? (
              <>
                <span style={{ color: '#10B981' }}>initialized</span>
                <span style={{ color: theme.text.primary }}>
                  ({brokerBalance.toFixed(2)} 0G)
                </span>
              </>
            ) : null}
            
            {/* Action Buttons */}
            {address && (
              <>
                {/* Create Button - only when not_initialized */}
                {brokerStatus === 'not_initialized' && (
                  <button
                    onClick={handleCreateBroker}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '2px 8px',
                      background: 'transparent',
                      border: `1px solid ${theme.accent.primary}`,
                      borderRadius: '3px',
                      color: theme.accent.primary,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'monospace'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.accent.primary;
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.accent.primary;
                    }}
                  >
                    [create]
                  </button>
                )}
                
                {/* Fund Button - only when initialized */}
                {brokerStatus === 'initialized' && (
                  <button
                    onClick={handleFundBroker}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '2px 6px',
                      background: 'transparent',
                      border: `1px solid ${theme.accent.primary}`,
                      borderRadius: '3px',
                      color: theme.accent.primary,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'monospace'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.accent.primary;
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.accent.primary;
                    }}
                  >
                    [+]
                  </button>
                )}
              </>
            )}
            </div>
          </>
        )}
        </div>
        
        {/* Close Button - Part of Line 1 */}
        {onClose && !needsMultiLine && (
          <button
            onClick={onClose}
            aria-label="Close terminal"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: theme.text.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              padding: '0',
              margin: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.accent.primary;
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = theme.text.secondary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      {/* Mobile Broker Line - Line 2 */}
      {needsMultiLine && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.5rem',
          marginTop: '0.5rem',
          borderTop: `1px solid rgba(255, 255, 255, 0.05)`
        }}>
          {/* Mobile Broker Status */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1
          }}>
            <span style={{ color: theme.text.secondary }}>Broker:</span>
            {brokerStatus === 'uninitialized' ? (
              <span style={{ color: theme.text.secondary }}>checking...</span>
            ) : brokerStatus === 'not_initialized' ? (
              <>
                <span style={{ color: '#FCD34D' }}>not_initialized</span>
                <button
                  onClick={handleCreateBroker}
                  style={{
                    padding: '2px 6px',
                    background: 'transparent',
                    border: `1px solid ${theme.accent.primary}`,
                    borderRadius: '3px',
                    color: theme.accent.primary,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  [create]
                </button>
              </>
            ) : brokerStatus === 'loading' ? (
              <span style={{ color: theme.text.secondary }}>loading...</span>
            ) : brokerStatus === 'error' ? (
              <span style={{ color: '#EF4444' }}>error</span>
            ) : brokerStatus === 'initialized' ? (
              <>
                <span style={{ color: '#10B981' }}>initialized</span>
                <span style={{ color: theme.text.primary }}>
                  ({brokerBalance.toFixed(2)} 0G)
                </span>
                {address && (
                  <button
                    onClick={handleFundBroker}
                    style={{
                      padding: '2px 4px',
                      background: 'transparent',
                      border: `1px solid ${theme.accent.primary}`,
                      borderRadius: '3px',
                      color: theme.accent.primary,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    [+]
                  </button>
                )}
              </>
            ) : null}
          </div>
          
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close terminal"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: theme.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                padding: '0',
                margin: '0'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.background = theme.accent.primary;
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = theme.text.secondary;
                  e.currentTarget.style.transform = 'scale(1)';
                }, 150);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      
      {/* Fund Broker Modal */}
      {brokerRef && (
        <FundBrokerModal
          isOpen={showFundModal}
          onClose={() => setShowFundModal(false)}
          brokerRef={brokerRef}
          currentBalance={brokerBalance}
        />
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const TerminalSystemHeader = React.memo(TerminalSystemHeaderComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.agentName === nextProps.agentName &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.selectedModel === nextProps.selectedModel &&
    prevProps.brokerRef === nextProps.brokerRef &&
    prevProps.modelRef === nextProps.modelRef &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isTablet === nextProps.isTablet
    // Note: terminalState intentionally excluded to prevent re-renders on input changes
  );
});