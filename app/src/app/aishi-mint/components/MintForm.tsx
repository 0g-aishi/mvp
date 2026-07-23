'use client';

import Image from 'next/image';
import { useTheme } from '../../../contexts/ThemeContext';
import { GiCheckMark, GiCancel, GiHourglass, GiFireSpellCast, GiWallet, GiQuillInk, GiConfirmed, GiSparkles } from 'react-icons/gi';
import { formatEther } from 'viem';

interface MintFormProps {
  agentName: string;
  setAgentName: (name: string) => void;
  nameError: string;
  isCheckingName: boolean;
  canMint: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  maxNameLength: number;
  currentMintPrice: bigint;
  onMint: () => void;
  remainingSupply: number;
  maxSupply: number;
  isSoldOut: boolean;
}

export default function MintForm({
  agentName,
  setAgentName,
  nameError,
  isCheckingName,
  canMint,
  isProcessing,
  isConnected,
  maxNameLength,
  currentMintPrice,
  onMint,
  remainingSupply,
  maxSupply,
  isSoldOut,
}: MintFormProps) {
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
    }}>
      {/* Title */}
      <div>
        {/* Motivational Slogan */}
        <p style={{
          fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
          fontWeight: theme.typography.fontWeights.semibold,
          color: theme.accent.primary,
          marginBottom: theme.spacing.sm,
          fontFamily: theme.typography.fontFamilies.primary,
          letterSpacing: '0.5px',
        }}>
          A unique name becomes its identity.
        </p>

        <h1 style={{
          fontSize: `clamp(${theme.typography.fontSizes.lg}, 5vw, ${theme.typography.fontSizes.xl})`,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.text.primary,
          marginBottom: theme.spacing.xs,
          fontFamily: theme.typography.fontFamilies.primary,
        }}>
          Name your Aishi
        </h1>
        
        <p style={{
          color: theme.text.secondary,
          fontSize: theme.typography.fontSizes.sm,
        }}>
          One agent per wallet • Evolves through your interactions
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="agentName" style={{
          display: 'block',
          color: theme.text.secondary,
          fontSize: theme.typography.fontSizes.sm,
          marginBottom: theme.spacing.xs,
          fontWeight: theme.typography.fontWeights.medium,
        }}>
          Agent name

          {/* Help text */}
          <span style={{
            display: 'block',
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.normal,
            color: theme.text.tertiary,
            marginTop: '2px',
          }}>
            Max 32 chars. Letters, numbers, hyphens. Name is permanent.
          </span>
        </label>
        
        <div style={{ position: 'relative' }}>
          <input
            id="agentName"
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Choose a unique name..."
            style={{
              width: '100%',
              padding: `clamp(12px, 2vw, ${theme.spacing.sm}) ${theme.spacing.md}`,
              paddingRight: '60px',
              minHeight: '48px',
              backgroundColor: `${theme.bg.primary}88`,
              border: `1px solid ${theme.accent.primary}44`,
              borderRadius: theme.radius.md,
              color: theme.text.primary,
              fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
              outline: 'none',
              transition: theme.effects.transitions.normal,
              fontFamily: theme.typography.fontFamilies.primary,
              touchAction: 'manipulation',
            }}
            aria-invalid={Boolean(nameError)}
            aria-describedby={agentName ? 'agent-name-status' : undefined}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.accent.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${theme.accent.primary}44`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          
          {/* Character counter */}
          <div style={{
            position: 'absolute',
            right: theme.spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
            color: agentName.length > maxNameLength ? theme.accent.error : theme.text.secondary,
            fontSize: theme.typography.fontSizes.xs,
            fontFamily: theme.typography.fontFamilies.monospace,
          }}>
            {agentName.length}/{maxNameLength}
          </div>
        </div>
        
        {/* Name validation feedback (no underline/error decoration) */}
        {agentName && (
          <div id="agent-name-status" aria-live="polite" style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSizes.xs,
            color: nameError ? theme.text.secondary : theme.accent.success,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {isCheckingName ? (
              <>
                <GiHourglass style={{ animation: 'spin 1s linear infinite' }} />
                Checking availability...
              </>
            ) : nameError ? (
              <>
                <GiCancel />
                {nameError}
              </>
            ) : (
              <>
                <GiCheckMark />
                Name available!
              </>
            )}
          </div>
        )}
      </div>

      {/* Minting Fee Info */}
      <div style={{
        padding: theme.spacing.md,
        backgroundColor: `${theme.bg.primary}44`,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.accent.primary}22`,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            color: theme.text.secondary,
            fontSize: theme.typography.fontSizes.sm,
          }}>
            Current Mint Price
          </span>
          <span style={{
            color: theme.accent.primary,
            fontSize: theme.typography.fontSizes.lg,
            fontWeight: theme.typography.fontWeights.bold,
            fontFamily: theme.typography.fontFamilies.monospace,
          }}>
            {formatEther(currentMintPrice)} OG
          </span>
        </div>
        <div style={{
          marginTop: theme.spacing.sm,
          fontSize: theme.typography.fontSizes.xs,
          color: theme.text.secondary,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: theme.spacing.xs,
        }}>
          <span>
            Remaining supply: {remainingSupply.toLocaleString()} / {maxSupply.toLocaleString()}
          </span>
          {isSoldOut && (
            <span style={{ color: theme.accent.error }}>
              Sold out
            </span>
          )}
        </div>
      </div>

      {/* Mint Button */}
      <button
        onClick={onMint}
        disabled={!canMint || isProcessing || isSoldOut}
        style={{
          width: '100%',
          padding: `clamp(14px, 2vw, ${theme.spacing.md})`,
          minHeight: '52px',
          fontSize: `clamp(${theme.typography.fontSizes.sm}, 3vw, ${theme.typography.fontSizes.md})`,
          fontWeight: theme.typography.fontWeights.bold,
          color: canMint && !isProcessing && !isSoldOut ? theme.text.primary : theme.text.secondary,
          backgroundColor: canMint && !isProcessing && !isSoldOut ? theme.accent.primary : `${theme.accent.primary}44`,
          border: 'none',
          borderRadius: theme.radius.md,
          cursor: canMint && !isProcessing ? 'pointer' : 'not-allowed',
          transition: theme.effects.transitions.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          fontFamily: theme.typography.fontFamilies.primary,
          touchAction: 'manipulation',
        }}
        onMouseEnter={(e) => {
          if (canMint && !isProcessing && !isSoldOut) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent.primary}66`;
          }
        }}
        onMouseLeave={(e) => {
          if (canMint && !isProcessing && !isSoldOut) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isProcessing ? (
          <>
            <GiHourglass style={{ animation: 'spin 1s linear infinite' }} />
            Processing...
          </>
        ) : isSoldOut ? (
          <>
            <GiCancel />
            Mint Closed
          </>
        ) : (
          <>
            <GiFireSpellCast />
            Mint Agent
          </>
        )}
      </button>

      {/* Contract Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        opacity: 0.7,
      }}>
        <span style={{
          fontSize: theme.typography.fontSizes.xs,
          color: theme.text.secondary,
        }}>
          Network:
        </span>
        <Image
          src="/og.png"
          alt="0G Network"
          width={60}
          height={30}
          style={{
            opacity: 0.8,
          }}
        />
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Accessibility: Disable animations for users with motion sensitivity */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          button:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
