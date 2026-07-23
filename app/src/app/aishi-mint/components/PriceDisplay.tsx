'use client';

import { formatEther } from 'viem';
import { useTheme } from '../../../contexts/ThemeContext';
import { FiTrendingUp, FiUsers, FiLock, FiExternalLink } from 'react-icons/fi';
import { useReadContract } from 'wagmi';
import { getContractConfig } from '../config/contractConfig';
import { getContractExplorerUrl } from '../../../config/chains';

interface PriceDisplayProps {
  currentMintPrice: bigint;
  totalAgents: number;
  maxSupply: number;
  remainingSupply: number;
}

export default function PriceDisplay({
  currentMintPrice,
  totalAgents,
  maxSupply,
  remainingSupply,
}: PriceDisplayProps) {
  const { theme } = useTheme();
  const contract = getContractConfig();

  // Read on-chain pricing parameters (fallback to contract constants if not yet loaded)
  const { data: priceStepRaw } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'PRICE_STEP',
  });
  const { data: priceStepIntervalRaw } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'PRICE_STEP_INTERVAL',
  });

  const priceStep: bigint = (priceStepRaw as bigint) ?? BigInt(0.1e18);
  const priceStepInterval: number = priceStepIntervalRaw ? Number(priceStepIntervalRaw as bigint) : 10;

  // Calculate current tier and next tier info
  const currentTier = priceStepInterval > 0 ? Math.floor(totalAgents / priceStepInterval) : 0;
  const nextTierAgents = Math.min((currentTier + 1) * priceStepInterval, maxSupply);
  const nextTierPrice = currentMintPrice + priceStep;
  const mintedShare = Math.min(totalAgents, maxSupply);
  const isSoldOut = remainingSupply <= 0;

  // Progress calculations
  const supplyProgressPct = maxSupply > 0 ? Math.min(100, (mintedShare / maxSupply) * 100) : 0;
  const tierProgress = priceStepInterval > 0 ? (totalAgents % priceStepInterval) : 0;
  const tierRemaining = priceStepInterval > 0 ? priceStepInterval - tierProgress : 0;
  const tierProgressPct = priceStepInterval > 0 ? Math.min(100, (tierProgress / priceStepInterval) * 100) : 0;

  // Format prices for display
  const currentPriceFormatted = formatEther(currentMintPrice);
  const nextPriceFormatted = formatEther(nextTierPrice);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.xl,
    }}>
      {/* Price Display */}
      <div style={{
        textAlign: 'center',
        padding: theme.spacing.xl,
      }}>
        <div style={{
          fontSize: `clamp(${theme.typography.fontSizes.xl}, 6vw, ${theme.typography.fontSizes.xxl})`,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.accent.primary,
          fontFamily: theme.typography.fontFamilies.monospace,
          marginBottom: theme.spacing.sm,
          lineHeight: 1,
        }}>
          {currentPriceFormatted} OG
        </div>

        <div style={{
          fontSize: `clamp(${theme.typography.fontSizes.xs}, 3vw, ${theme.typography.fontSizes.sm})`,
          color: theme.text.secondary,
          marginBottom: `clamp(${theme.spacing.md}, 3vw, ${theme.spacing.xl})`,
        }}>
          Current Mint Price
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing.xs,
          fontSize: theme.typography.fontSizes.xs,
          color: theme.text.secondary,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
          }}>
            <FiUsers />
            <span style={{
              fontSize: `clamp(11px, 2.5vw, ${theme.typography.fontSizes.xs})`,
            }}>
              {mintedShare.toLocaleString()} / {maxSupply.toLocaleString()} agents
            </span>
          </div>

          {/* Supply progress bar */}
          <div style={{
            width: '100%',
            maxWidth: '420px',
            height: '8px',
            backgroundColor: `${theme.bg.panel}`,
            borderRadius: theme.radius.full,
            overflow: 'hidden',
            border: `1px solid ${theme.accent.primary}22`,
          }}>
            <div style={{
              width: `${supplyProgressPct}%`,
              height: '100%',
              background: theme.gradients.primary,
              transition: theme.effects.transitions.normal,
            }} />
          </div>

          {isSoldOut ? (
            <div style={{
              fontSize: `clamp(10px, 2.5vw, 11px)`,
              color: theme.accent.error,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              marginTop: theme.spacing.xs,
            }}>
              <FiTrendingUp />
              <span>Mint closed – cap reached</span>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                marginTop: theme.spacing.xs,
              }}>
                <FiTrendingUp />
                <span style={{
                  fontSize: `clamp(10px, 2.5vw, 11px)`,
                }}>
                  Next tier at {nextTierAgents}: {nextPriceFormatted} OG
                </span>
              </div>

              <div style={{
                fontSize: `clamp(9px, 2vw, 10px)`,
                color: theme.text.tertiary,
                marginTop: theme.spacing.xs,
              }}>
                +{formatEther(priceStep)} OG every {priceStepInterval} mints
              </div>

              {/* Tier progress bar */}
              <div style={{
                width: '100%',
                maxWidth: '420px',
                height: '6px',
                backgroundColor: `${theme.bg.panel}`,
                borderRadius: theme.radius.full,
                overflow: 'hidden',
                border: `1px solid ${theme.accent.primary}22`,
                marginTop: theme.spacing.xs,
              }}>
                <div style={{
                  width: `${tierProgressPct}%`,
                  height: '100%',
                  backgroundColor: theme.accent.primary,
                  transition: theme.effects.transitions.normal,
                }} />
              </div>

              <div style={{
                fontSize: `clamp(9px, 2vw, 10px)`,
                color: theme.text.secondary,
                marginTop: '6px',
              }}>
                {tierRemaining} mint{tierRemaining === 1 ? '' : 's'} until price increases
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
