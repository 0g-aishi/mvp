'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface WalletPromptProps {
  message?: string;
  style?: React.CSSProperties;
}

export default function WalletPrompt({ 
  message = 'Connect your wallet to mint your agent',
  style 
}: WalletPromptProps) {
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      textAlign: 'center',
      ...style
    }}>
      <p style={{
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.medium,
        color: theme.accent.primary,
        margin: 0,
        lineHeight: theme.typography.lineHeights.normal,
      }}>
        {message}
      </p>
    </div>
  );
}