'use client';

import React, { MouseEvent } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { ShimmerButton } from '../ui/ShimmerButton';

const ConnectButton = () => {
  const { theme, debugLog } = useTheme();
  const { 
    address, 
    shortAddress, 
    isConnected, 
    isConnecting, 
    isCorrectNetwork,
    networkDisplayName,
    connectWallet, 
    openAccount,
    switchToOGNetwork 
  } = useWallet();
  
  // If not connected, show connect button
  if (!isConnected) {
    return (
      <ShimmerButton
        onClick={connectWallet}
        disabled={isConnecting}
        shimmerColor="#ffffff"
        background={theme.accent.primary}
        borderRadius="50px"
        shimmerDuration="3s"
        style={{
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          opacity: isConnecting ? 0.7 : 1,
        }}
      >
        {isConnecting ? (
          <>
            <div 
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}
            />
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </ShimmerButton>
    );
  }
  
  // If connected but wrong network, show switch network button
  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToOGNetwork}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ff4d4f',  // Red for warning
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          boxShadow: `0 0 10px rgba(255, 77, 79, 0.3)`
        }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = '#ff7875';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = '#ff4d4f';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <AlertTriangle size={16} />
        Switch to {process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '0G'} Network
      </button>
    );
  }
  
  // If connected and correct network, show account button
  return (
    <ShimmerButton
      onClick={openAccount}
      shimmerColor="#ffffff"
      background={theme.accent.primary}
      borderRadius="24px"
      shimmerDuration="3s"
    >
      {shortAddress}
    </ShimmerButton>
  );
};

export default ConnectButton; 