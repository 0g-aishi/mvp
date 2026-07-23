'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { ShimmerButton } from '../ui/ShimmerButton';
import GradientText from '../ui/GradientText';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { getContractConfig } from '../../app/aishi-mint/config/contractConfig';
import { FiUsers } from 'react-icons/fi';

// Helper function to convert contract values
const contractValueToNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return fallback;
};

export default function FinalCTASection() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  const contractConfig = getContractConfig();

  // Read contract data
  const { data: totalAgents } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'totalAgents',
  });

  const { data: maxSupply } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'MAX_SUPPLY',
  });

  // Calculations
  const totalAgentsCount = contractValueToNumber(totalAgents);
  const maxSupplyCount = contractValueToNumber(maxSupply, 1888);
  const mintedShare = Math.min(totalAgentsCount, maxSupplyCount);
  const supplyProgressPct = maxSupplyCount > 0
    ? Math.min(100, (mintedShare / maxSupplyCount) * 100)
    : 0;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <section style={{
      padding: isMobile ? '80px 16px' : '150px 20px',
      position: 'relative',
      zIndex: 1,
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Animated Gradient Text */}
        <div style={{
          fontSize: isSmallMobile ? '2rem' : 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 'bold',
          marginBottom: '48px'
        }}>
          <GradientText
            showBorder={false}
            animationSpeed={3}
          >
            Meet your Aishi.
          </GradientText>
        </div>

        {/* Progress Bar Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing?.md || '16px',
          marginBottom: '48px'
        }}>
          {/* Stats text with icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing?.xs || '8px',
            fontSize: isSmallMobile ? '14px' : '16px',
            color: theme.text.secondary,
          }}>
            <FiUsers size={18} />
            <span>
              {mintedShare.toLocaleString()} / {maxSupplyCount.toLocaleString()} agents
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            maxWidth: '420px',
            height: '8px',
            backgroundColor: theme.bg?.panel || 'rgba(24, 24, 31, 0.4)',
            borderRadius: theme.radius?.full || '999px',
            overflow: 'hidden',
            border: `1px solid ${theme.accent.primary}22`,
          }}>
            <div style={{
              width: `${supplyProgressPct}%`,
              height: '100%',
              background: theme.gradients.primary,
              transition: 'all 0.3s ease',
            }} />
          </div>
        </div>

        {/* Single CTA Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'relative' }}>
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              inset: '-4px',
              background: theme.gradients.primary,
              borderRadius: '16px',
              filter: 'blur(20px)',
              opacity: 0.5
            }} />

            <ShimmerButton
              onClick={() => router.push('/aishi-mint')}
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="3s"
              borderRadius="12px"
              background={theme.gradients.primary}
              style={{
                position: 'relative',
                padding: isSmallMobile ? '16px 48px' : '20px 60px',
                fontSize: isSmallMobile ? '16px' : '18px',
                width: isSmallMobile ? '100%' : 'auto',
                maxWidth: isSmallMobile ? '280px' : 'none',
                fontWeight: '600',
                border: 'none',
                transition: 'transform 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Mint now
            </ShimmerButton>
          </div>
        </div>
      </div>
    </section>
  );
}