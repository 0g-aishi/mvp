'use client';

import { formatEther } from 'viem';
import { useTheme } from '../../../contexts/ThemeContext';
import { FiTrendingUp, FiLock, FiExternalLink } from 'react-icons/fi';
import { useReadContract } from 'wagmi';
import { getContractConfig } from '../config/contractConfig';
import { getContractExplorerUrl } from '../../../config/chains';

interface PricingFooterProps {
  totalAgents: number;
  currentMintPrice: bigint;
  maxSupply: number;
}

export default function PricingFooter({
  totalAgents,
  currentMintPrice,
  maxSupply,
}: PricingFooterProps) {
  const { theme } = useTheme();
  const contract = getContractConfig();

  // Read on-chain pricing parameters
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

  // Calculate pricing info
  const tierProgress = priceStepInterval > 0 ? (totalAgents % priceStepInterval) : 0;
  const tierRemaining = priceStepInterval > 0 ? priceStepInterval - tierProgress : 0;
  const nextTierPrice = currentMintPrice + priceStep;
  const nextPriceFormatted = formatEther(nextTierPrice);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: `clamp(${theme.spacing.xxl}, 6vw, 4rem)`,
      paddingTop: theme.spacing.xxl,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        padding: theme.spacing.xl,
        backgroundColor: `${theme.bg.card}aa`,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.accent.primary}22`,
      }}>
        {/* Pricing Mechanics */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}>
          <FiTrendingUp
            size={16}
            color={theme.accent.primary}
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <div style={{
              fontSize: theme.typography.fontSizes.xs,
              fontWeight: theme.typography.fontWeights.semibold,
              color: theme.text.primary,
              marginBottom: '4px',
            }}>
              Pricing mechanics
            </div>
            <div style={{
              fontSize: `clamp(10px, 2vw, ${theme.typography.fontSizes.xs})`,
              color: theme.text.secondary,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}>
              Current price reflects demand. Next tier in {tierRemaining} mint{tierRemaining === 1 ? '' : 's'} → {nextPriceFormatted} OG.
            </div>
          </div>
        </div>

        {/* Supply & Policy */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}>
          <FiLock
            size={16}
            color={theme.accent.primary}
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <div style={{
              fontSize: theme.typography.fontSizes.xs,
              fontWeight: theme.typography.fontWeights.semibold,
              color: theme.text.primary,
              marginBottom: '4px',
            }}>
              Supply & policy
            </div>
            <div style={{
              fontSize: `clamp(10px, 2vw, ${theme.typography.fontSizes.xs})`,
              color: theme.text.secondary,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}>
              Max supply: {maxSupply.toLocaleString()} • One agent per wallet • Name is permanent
            </div>
          </div>
        </div>

        {/* Contract Link */}
        <a
          href={getContractExplorerUrl(contract.address)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontSize: theme.typography.fontSizes.xs,
            color: theme.accent.primary,
            textDecoration: 'none',
            transition: theme.effects.transitions.normal,
            padding: `${theme.spacing.xs} 0`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <FiExternalLink size={14} />
          <span style={{
            fontSize: `clamp(10px, 2vw, ${theme.typography.fontSizes.xs})`,
          }}>
            View contract on explorer
          </span>
        </a>
      </div>
    </div>
  );
}
