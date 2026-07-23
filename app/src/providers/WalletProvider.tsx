'use client';

import React, { ReactNode } from 'react';
import { RainbowKitProvider, darkTheme, AvatarComponent } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useTheme } from '../contexts/ThemeContext';
import { getActiveChain } from '../config/chains';
import wagmiConfig from '../config/wagmiClient';

// Create a client for TanStack Query
const queryClient = new QueryClient();

// wagmi config is centralized in config/wagmiClient

// Custom avatar component for dream theme
interface CustomAvatarProps {
  size: number;
}

const CustomAvatar: AvatarComponent = ({ size }: CustomAvatarProps) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img 
        src="/logo_clean.png" 
        alt="Aishi" 
        style={{
          width: size,
          height: size,
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

// Main Wallet Provider
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProviderWrapper>
          {children}
        </RainbowKitProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Inner component that uses theme context
interface RainbowKitProviderWrapperProps {
  children: ReactNode;
}

const RainbowKitProviderWrapper = ({ children }: RainbowKitProviderWrapperProps) => {
  const { theme, debugLog } = useTheme();
  
  // Create Aishi violet theme for RainbowKit
  const aishiTheme = darkTheme({
    accentColor: theme.accent.primary,        // Violet
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small',
  });
  
  // Custom theme overrides for Aishi
  const customTheme = {
    ...aishiTheme,
    colors: {
      ...aishiTheme.colors,
      accentColor: theme.accent.primary,      // #8B5CF6
      accentColorForeground: 'white',
      actionButtonBorder: theme.border,
      actionButtonBorderMobile: theme.border,
      actionButtonSecondaryBackground: theme.bg.card,
      closeButton: theme.text.secondary,
      closeButtonBackground: theme.bg.panel,
      connectButtonBackground: theme.accent.primary,
      connectButtonBackgroundError: '#ff4d4f',
      connectButtonInnerBackground: theme.bg.card,
      connectButtonText: 'white',
      connectButtonTextError: 'white',
      connectionIndicator: theme.accent.primary,
      downloadBottomCardBackground: theme.bg.card,
      downloadTopCardBackground: theme.bg.panel,
      error: '#ff4d4f',
      generalBorder: theme.border,
      generalBorderDim: theme.border,
      menuItemBackground: theme.bg.card,
      modalBackdrop: 'rgba(0, 0, 0, 0.8)',
      modalBackground: theme.bg.card,
      modalBorder: theme.border,
      modalText: theme.text.primary,
      modalTextDim: theme.text.secondary,
      modalTextSecondary: theme.text.secondary,
      profileAction: theme.bg.panel,
      profileActionHover: theme.bg.main,
      profileForeground: theme.bg.card,
      selectedOptionBorder: theme.accent.primary,
      standby: theme.text.secondary,
    }
  };
  
  debugLog('RainbowKit theme configured with Aishi colors');
  
  const activeChain = getActiveChain();

  return (
    <RainbowKitProvider
      theme={customTheme}
      avatar={CustomAvatar}
      modalSize="wide"
      initialChain={activeChain.id}
      showRecentTransactions={true}
    >
      {children}
    </RainbowKitProvider>
  );
}; 
