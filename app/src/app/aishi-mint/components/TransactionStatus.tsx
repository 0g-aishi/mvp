'use client';

import { useTheme } from '../../../contexts/ThemeContext';
import { FiCheck, FiX, FiLoader, FiShare2, FiArrowRight } from 'react-icons/fi';
import AnimatedDots from '../../../components/ui/AnimatedDots';
import { ShimmerButton } from '../../../components/ui/ShimmerButton';
import { getActiveChain } from '../../../config/chains';

interface TransactionStatusProps {
  showSuccess: boolean;
  mintedTokenId: number | null;
  agentName: string;
  isProcessing: boolean;
  isWritePending: boolean;
  writeError: any;
  txError: any;
  txHash: any;
  onShare: () => void;
  onReset: () => void;
}

export default function TransactionStatus({
  showSuccess,
  mintedTokenId,
  agentName,
  isProcessing,
  isWritePending,
  writeError,
  txError,
  txHash,
  onShare,
  onReset,
}: TransactionStatusProps) {
  const { theme } = useTheme();

  if (showSuccess) {
    return (
      <>
        <style jsx>{`
          @media (max-width: 480px) {
            .action-buttons {
              flex-direction: column !important;
              width: 100%;
            }
            .action-buttons button {
              width: 100%;
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .shimmer-border-success {
            position: relative;
            padding: 2px;
            border-radius: ${theme.radius.xxl};
            background: linear-gradient(
              90deg,
              transparent 25%,
              ${theme.accent.primary}44 50%,
              transparent 75%
            );
            background-size: 200% 100%;
            animation: shimmer ${theme.shimmer.duration} infinite;
          }

          .shimmer-content-success {
            background: ${theme.bg.card};
            border-radius: ${theme.radius.xl};
            backdrop-filter: ${theme.effects.blur.md};
            padding: ${theme.spacing.xxl} ${theme.spacing.xl};
          }

          /* Accessibility: Disable animations for users with motion sensitivity */
          @media (prefers-reduced-motion: reduce) {
            .shimmer-border-success {
              animation: none !important;
              background: ${theme.accent.primary}44;
            }

            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
        
        <div className="shimmer-border-success">
          <div className="shimmer-content-success">
            <div aria-live="polite" style={{
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.sm,
                fontSize: `clamp(${theme.typography.fontSizes.lg}, 4vw, ${theme.typography.fontSizes.xl})`,
                fontWeight: theme.typography.fontWeights.semibold,
                color: theme.accent.primary,
                fontFamily: theme.typography.fontFamilies.primary,
                marginTop: theme.spacing.xl,
              }}>
                <FiCheck size={24} />
                Agent created
              </div>
        
        <p style={{
          color: theme.text.secondary,
          marginBottom: `clamp(${theme.spacing.xl}, 5vw, ${theme.spacing.xxxl})`,
          fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
        }}>
          {agentName} • Token ID #{mintedTokenId}
        </p>
        
        <div 
          className="action-buttons"
          style={{
          display: 'flex',
          gap: theme.spacing.sm,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <ShimmerButton
            onClick={() => window.location.href = '/aishiOS'}
            shimmerColor={theme.shimmer.color}
            shimmerSize={theme.shimmer.size}
            shimmerDuration={theme.shimmer.duration}
            borderRadius={theme.radius.lg}
            background={theme.accent.primary}
            style={{
              padding: `clamp(12px, 2vw, ${theme.spacing.sm}) clamp(16px, 3vw, ${theme.spacing.lg})`,
              fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
              fontWeight: theme.typography.fontWeights.semibold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              border: 'none',
              transition: theme.effects.transitions.normal,
              cursor: 'pointer',
              minHeight: '48px',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Open Terminal
            <span>&gt;</span>
          </ShimmerButton>
          
          <button
            onClick={onShare}
            style={{
              padding: `clamp(12px, 2vw, ${theme.spacing.sm}) clamp(16px, 3vw, ${theme.spacing.lg})`,
              backgroundColor: 'transparent',
              color: theme.text.primary,
              border: `1px solid ${theme.accent.primary}`,
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              fontWeight: theme.typography.fontWeights.bold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              transition: theme.effects.transitions.normal,
              minHeight: '48px',
              touchAction: 'manipulation',
              fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiShare2 />
            Share on X
          </button>
        </div>
        
        {txHash && (() => {
          const activeChain = getActiveChain();
          const explorerUrl = activeChain.blockExplorers?.default?.url ||
                             (activeChain.id === 16661 ? 'https://chainscan.0g.ai' : 'https://chainscan-galileo.0g.ai');

          return (
            <div style={{ marginTop: theme.spacing.xl }}>
              <p style={{
                fontSize: theme.typography.fontSizes.xs,
                color: theme.text.secondary,
                marginBottom: theme.spacing.xs,
              }}>
                Transaction completed:
              </p>
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: theme.typography.fontSizes.xs,
                  color: theme.accent.primary,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  wordBreak: 'break-all',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.accent.primary;
                }}
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          );
        })()}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isProcessing) {
    return (
      <>
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          .shimmer-border {
            position: relative;
            padding: 2px;
            border-radius: ${theme.radius.xxl};
            background: linear-gradient(
              90deg,
              transparent 25%,
              ${theme.accent.primary}44 50%,
              transparent 75%
            );
            background-size: 200% 100%;
            animation: shimmer ${theme.shimmer.duration} infinite;
          }

          .shimmer-content {
            background: ${theme.bg.card};
            border-radius: ${theme.radius.xl};
            backdrop-filter: ${theme.effects.blur.md};
            padding: ${theme.spacing.xxl};
          }

          /* Accessibility: Disable animations for users with motion sensitivity */
          @media (prefers-reduced-motion: reduce) {
            .shimmer-border {
              animation: none !important;
              background: ${theme.accent.primary}44;
            }

            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
        
        <div className="shimmer-border">
          <div className="shimmer-content">
            <div aria-live="polite" style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: theme.spacing.xl,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `clamp(${theme.typography.fontSizes.md}, 4vw, ${theme.typography.fontSizes.lg})`,
                fontWeight: theme.typography.fontWeights.semibold,
                color: theme.accent.primary,
              }}>
                {isWritePending ? (
                  <>
                    Confirm in wallet
                    <AnimatedDots color={theme.accent.primary} size={5} />
                  </>
                ) : (
                  <>
                    Creating agent
                    <AnimatedDots color={theme.accent.primary} size={5} />
                  </>
                )}
              </div>
              
              <p style={{
                color: theme.text.secondary,
                fontSize: `clamp(${theme.typography.fontSizes.xs}, 3vw, ${theme.typography.fontSizes.sm})`,
                margin: 0,
                padding: '0 1rem',
              }}>
                {isWritePending 
                  ? 'Please check your wallet for confirmation' 
                  : 'Processing transaction on blockchain'}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (writeError || txError) {
    const error = writeError || txError;
    return (
      <div role="alert" style={{
        padding: theme.spacing.md,
        backgroundColor: `${theme.accent.error}22`,
        border: `1px solid ${theme.accent.error}66`,
        borderRadius: theme.radius.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
      }}>
        <FiX color={theme.accent.error} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{
            color: theme.text.primary,
            fontSize: theme.typography.fontSizes.sm,
            marginBottom: '4px',
          }}>
            Transaction failed
          </p>
          <p style={{
            color: theme.text.secondary,
            fontSize: theme.typography.fontSizes.xs,
            wordBreak: 'break-word',
          }}>
            {error?.message || 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
