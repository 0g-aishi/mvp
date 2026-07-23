'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useSendTransaction } from 'wagmi';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { getActiveChain } from '../config/chains';
import { useTheme } from '../contexts/ThemeContext';
import type { Address } from 'viem';
import { parseEther } from 'viem';
import { WalletState } from '../types';

export const useWallet = (): WalletState & {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToOGNetwork: () => Promise<void>;
  openAccount: () => void;
  openChain: () => void;
  sendOGToMasterWallet: (amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  connectError: Error | null;
  debugLog: (message: string, data?: any) => void;
  isSendingTransaction: boolean;
} => {
  const { debugLog } = useTheme();
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync, isPending: isSendingTransaction } = useSendTransaction();
  
  // RainbowKit modals
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  
  // Shortened address for display
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  // Get active chain based on configuration
  const activeChain = getActiveChain();

  // Check if on correct network
  const isCorrectNetwork = chainId === activeChain.id;
  
  // Connect wallet function
  const connectWallet = async (): Promise<void> => {
    debugLog('Opening connect modal');
    if (openConnectModal) {
      openConnectModal();
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = async (): Promise<void> => {
    debugLog('Disconnecting wallet', { address });
    disconnect();
  };
  
  // Switch to 0G network
  const switchToOGNetwork = async (): Promise<void> => {
    debugLog(`Switching to ${activeChain.name} network`);
    try {
      await switchChain({ chainId: activeChain.id });
    } catch (error) {
      debugLog('Failed to switch network', error);
      throw error;
    }
  };
  
  // Send OG to Master Wallet
  const sendOGToMasterWallet = async (amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET;
      
      if (!masterWalletAddress) {
        throw new Error('Master wallet address not configured');
      }
      
      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }
      
      if (!isCorrectNetwork) {
        throw new Error(`Wrong network. Please switch to ${activeChain.name}`);
      }
      
      debugLog('Sending OG to Master Wallet', { 
        amount, 
        to: masterWalletAddress,
        from: address 
      });
      
      const txHash = await sendTransactionAsync({
        to: masterWalletAddress as Address,
        value: parseEther(amount),
        chainId: activeChain.id
      });
      
      debugLog('Transaction sent successfully', { txHash });
      
      return {
        success: true,
        txHash: txHash
      };
      
    } catch (error: any) {
      debugLog('Failed to send transaction', error);
      
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  };
  
  // Open account modal
  const openAccount = (): void => {
    debugLog('Opening account modal');
    if (openAccountModal) {
      openAccountModal();
    }
  };
  
  // Open chain modal
  const openChain = (): void => {
    debugLog('Opening chain modal');
    if (openChainModal) {
      openChainModal();
    }
  };
  
  // Get network name from env or fallback
  const getNetworkName = (): string => {
    if (chainId === activeChain.id) {
      return activeChain.nativeCurrency.symbol || '0G';
    }
    return 'Unknown Network';
  };
  
  // Get network display name
  const getNetworkDisplayName = (): string => {
    if (chainId === activeChain.id) {
      return activeChain.name;
    }
    return 'Unknown Network';
  };
  
  return {
    // Connection state
    address,
    shortAddress,
    isConnected,
    isConnecting,
    isDisconnected,
    isLoading: isPending,
    
    // Network state
    chainId,
    isCorrectNetwork,
    networkName: getNetworkName(),
    networkDisplayName: getNetworkDisplayName(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToOGNetwork,
    sendOGToMasterWallet,
    openAccount,
    openChain,
    
    // States
    isSendingTransaction,
    
    // Errors
    connectError,
    
    // Utils
    debugLog,
    
    // Chain config (dynamic)
    chainConfig: {
      id: activeChain.id,
      name: activeChain.name,
      currency: activeChain.nativeCurrency,
      isTestnet: activeChain.testnet ?? false
    }
  };
}; 