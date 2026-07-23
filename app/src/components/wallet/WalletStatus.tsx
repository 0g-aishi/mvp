'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';

interface WalletStatusProps {
  showDetails?: boolean;
}

const WalletStatus = ({ showDetails = false }: WalletStatusProps) => {
  const { theme } = useTheme();
  const { 
    isConnected, 
    isConnecting, 
    isCorrectNetwork, 
    networkDisplayName, 
    address 
  } = useWallet();
  
  if (!showDetails && !isConnecting) return null;
  
  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: <Loader2 size={16} className="animate-spin" />,
        text: 'Connecting to wallet...',
        color: theme.text.secondary,
        bgColor: theme.bg.panel
      };
    }
    
    if (isConnected && !isCorrectNetwork) {
      return {
        icon: <AlertCircle size={16} />,
        text: `Wrong network: ${networkDisplayName}`,
        color: '#ff4d4f',
        bgColor: 'rgba(255, 77, 79, 0.1)'
      };
    }
    
    if (isConnected && isCorrectNetwork) {
      return {
        icon: <CheckCircle size={16} />,
        text: `Connected to ${networkDisplayName}`,
        color: theme.accent.primary,
        bgColor: `rgba(139, 92, 246, 0.1)`
      };
    }
    
    return {
      icon: <AlertCircle size={16} />,
      text: 'Wallet not connected',
      color: theme.text.secondary,
      bgColor: theme.bg.panel
    };
  };
  
  const status = getStatusInfo();
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: status.bgColor,
      border: `1px solid ${status.color}20`,
      borderRadius: '8px',
      fontSize: '12px',
      color: status.color,
      transition: 'all 0.2s ease'
    }}>
      {status.icon}
      <span>{status.text}</span>
      
      {showDetails && isConnected && (
        <span style={{
          fontSize: '11px',
          opacity: 0.7,
          marginLeft: '4px'
        }}>
          ({address?.slice(0, 6)}...{address?.slice(-4)})
        </span>
      )}
    </div>
  );
};

export default WalletStatus; 