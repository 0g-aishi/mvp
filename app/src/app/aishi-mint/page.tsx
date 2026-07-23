'use client';

import Image from 'next/image';
import Layout from '../../components/layout/Layout';
import { useTheme } from '../../contexts/ThemeContext';
import { useMintAgent } from './hooks/useMintAgent';
import MintStatus from './components/MintStatus';
import PriceDisplay from './components/PriceDisplay';
import MintStepper from './components/MintStepper';
import PricingFooter from './components/PricingFooter';
import GradientText from '../../components/ui/GradientText';
// Removed feature badges (0G-native, Ownable iNFT, Dynamic pricing, Private by design)

export default function AishiMintPage() {
  const { theme } = useTheme();
  const mintAgent = useMintAgent();

  return (
    <Layout backgroundType="faulty-terminal">
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 5vw, 2.5rem)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
        }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: `clamp(${theme.spacing.xl}, 6vw, ${theme.spacing.xxxl})`,
          }}>
            {/* Logo */}
            <div style={{
              marginBottom: `clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xxl})`,
            }}>
              <Image
                src="/logo_clean.png"
                alt="Aishi"
                width={180}
                height={180}
                priority
                style={{
                  width: 'clamp(120px, 20vw, 180px)',
                  height: 'auto',
                  filter: `drop-shadow(0 0 20px ${theme.accent.primary}66)`,
                  display: 'inline-block',
                }}
              />
            </div>

            {/* Title with GradientText */}
            <h1 style={{
              fontSize: `clamp(${theme.typography.fontSizes.xl}, 7vw, ${theme.typography.fontSizes.xxxl})`,
              fontWeight: theme.typography.fontWeights.bold,
              marginBottom: theme.spacing.md,
              lineHeight: theme.typography.lineHeights.tight,
              color: theme.text.primary,
            }}>
              Mint your <GradientText inline={true} showBorder={false}>Aishi</GradientText>. Verifiably yours.
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: `clamp(${theme.typography.fontSizes.md}, 4vw, ${theme.typography.fontSizes.lg})`,
              color: theme.text.secondary,
              maxWidth: '800px',
              margin: '0 auto',
              marginBottom: 'clamp(2.5rem, 6vw, 4.5rem)',
            }}>
              Name your sovereign iNFT companion. One agent per wallet. Your memory, your control.
            </p>

            {/* Feature badges intentionally removed */}
          </div>

          {/* Stepper Section */}
          <MintStepper
            isConnected={mintAgent.isConnected}
            agentName={mintAgent.agentName}
            nameError={mintAgent.nameError}
          />

          {/* Main Container with Two Sections */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
            gap: `clamp(${theme.spacing.xl}, 5vw, ${theme.spacing.xxxl})`,
            alignItems: 'center',
          }}>
          {/* Left Section - Mint Form */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.lg,
          }}>
            <MintStatus
              // Wallet & Connection
              isConnected={mintAgent.isConnected}
              hasExistingAgent={mintAgent.hasExistingAgent}
              existingTokenId={mintAgent.existingTokenId}
              hasInsufficientBalance={mintAgent.hasInsufficientBalance}
              balance={mintAgent.balance}
              
              // Form State
              agentName={mintAgent.agentName}
              setAgentName={mintAgent.setAgentName}
              nameError={mintAgent.nameError}
              isCheckingName={mintAgent.isCheckingName}
              canMint={mintAgent.canMint}
              
              // Transaction
              isProcessing={mintAgent.isProcessing}
              isWritePending={mintAgent.isProcessing}
              writeError={mintAgent.writeError}
              txError={mintAgent.txError}
              txHash={mintAgent.txHash}
              showSuccess={mintAgent.showSuccess}
              mintedTokenId={mintAgent.mintedTokenId}
              
              // Actions
              handleMint={mintAgent.handleMint}
              shareOnX={mintAgent.shareOnX}
              reset={mintAgent.reset}
              
              // Constants
              currentMintPrice={mintAgent.currentMintPrice}
              maxNameLength={mintAgent.MAX_NAME_LENGTH}
              isSoldOut={mintAgent.isSoldOut}
              remainingSupply={mintAgent.remainingSupply}
              maxSupply={mintAgent.maxSupply}
            />
          </div>

          {/* Right Section - Price Display */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.xxl,
          }}>
            {/* Price Display */}
            <PriceDisplay
              currentMintPrice={mintAgent.currentMintPrice}
              totalAgents={mintAgent.totalAgents}
              maxSupply={mintAgent.maxSupply}
              remainingSupply={mintAgent.remainingSupply}
            />
          </div>
        </div>

          {/* Pricing Footer */}
          <PricingFooter
            totalAgents={mintAgent.totalAgents}
            currentMintPrice={mintAgent.currentMintPrice}
            maxSupply={mintAgent.maxSupply}
          />
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (hover: hover) {
          button:hover {
            transform: translateY(-2px);
          }
        }

        /* Touch-friendly adjustments */
        @media (pointer: coarse) {
          button, input, a {
            min-height: 48px;
            touch-action: manipulation;
          }
        }

        /* Accessibility: Disable animations for users with motion sensitivity */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          @media (hover: hover) {
            button:hover {
              transform: none !important;
            }
          }
        }
      `}</style>
    </Layout>
  );
}
