'use client';

import { useTheme } from '../../../contexts/ThemeContext';
import { formatEther } from 'viem';
import ConnectButton from '../../../components/wallet/ConnectButton';
import WalletPrompt from '../../../components/wallet/WalletPrompt';

interface WalletConnectionProps {
  isConnected: boolean;
  hasExistingAgent: boolean;
  existingTokenId: any;
  hasInsufficientBalance: boolean;
  balance: any;
  currentMintPrice: bigint;
  isSoldOut: boolean;
  remainingSupply: number;
  maxSupply: number;
}

export default function WalletConnection({
  isConnected,
  hasExistingAgent,
  existingTokenId,
  hasInsufficientBalance,
  balance,
  currentMintPrice,
  isSoldOut,
  remainingSupply,
  maxSupply,
}: WalletConnectionProps) {
  const { theme } = useTheme();

  const supplyInfo = (
    <div style={{
      fontSize: theme.typography.fontSizes.xs,
      color: theme.text.secondary,
      marginTop: theme.spacing.sm,
    }}>
      Remaining supply: {remainingSupply.toLocaleString()} / {maxSupply.toLocaleString()}
    </div>
  );

  if (!isConnected) {
    return (
      <div style={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.lg,
      }}>
        <WalletPrompt />
        <ConnectButton />
        {supplyInfo}
      </div>
    );
  }

  if (hasExistingAgent) {
    return (
      <>
        <style jsx>{`
          @keyframes shimmer-existing {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          
          .shimmer-border-existing {
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
            animation: shimmer-existing ${theme.shimmer.duration} infinite;
          }
          
          .shimmer-content-existing {
            background: ${theme.bg.card};
            border-radius: ${theme.radius.xl};
            backdrop-filter: ${theme.effects.blur.md};
            padding: ${theme.spacing.xl};
            text-align: center;
          }
        `}</style>
        
        <div className="shimmer-border-existing">
          <div className="shimmer-content-existing">
            <h3 style={{
              color: theme.accent.primary,
              fontSize: `clamp(${theme.typography.fontSizes.md}, 4vw, ${theme.typography.fontSizes.lg})`,
              marginBottom: theme.spacing.sm,
            }}>
              You Already Have an Agent
            </h3>
            <p style={{
              color: theme.text.secondary,
              marginBottom: theme.spacing.md,
              fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
            }}>
              Token ID #{existingTokenId?.toString()}
            </p>
            <button
              onClick={() => window.location.href = '/aishiOS'}
              style={{
                padding: `clamp(12px, 2vw, ${theme.spacing.sm}) clamp(20px, 4vw, ${theme.spacing.xl})`,
                minHeight: '48px',
                backgroundColor: theme.accent.primary,
                color: theme.text.white,
                border: 'none',
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
                fontWeight: theme.typography.fontWeights.bold,
                transition: theme.effects.transitions.normal,
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
              Open Terminal
            </button>
            {supplyInfo}
          </div>
        </div>
      </>
    );
  }

  if (hasInsufficientBalance) {
    return (
      <div style={{
        padding: theme.spacing.md,
        backgroundColor: `${theme.accent.error}22`,
        border: `1px solid ${theme.accent.error}66`,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.xl,
      }}>
        <p style={{ 
          color: theme.text.primary, 
          fontSize: theme.typography.fontSizes.sm,
          marginBottom: theme.spacing.xs,
        }}>
          Insufficient balance
        </p>
        <p style={{
          color: theme.text.secondary,
          fontSize: theme.typography.fontSizes.xs
        }}>
          You need {formatEther(currentMintPrice)} OG to mint
        </p>
        {balance && (
          <p style={{ 
            color: theme.text.secondary, 
            fontSize: theme.typography.fontSizes.xs,
            marginTop: '4px',
          }}>
            Current balance: {formatEther(balance.value)} OG
          </p>
        )}
        {supplyInfo}
      </div>
    );
  }

  return (
    <div style={{
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      backgroundColor: `${theme.bg.card}cc`,
      backdropFilter: theme.effects.blur.sm,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.accent.primary}22`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          color: theme.text.secondary,
          fontSize: theme.typography.fontSizes.xs,
        }}>
          Connected
        </span>
        <ConnectButton />
      </div>
      {supplyInfo}
    </div>
  );
}
