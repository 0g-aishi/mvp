import { defineChain } from 'viem';
import type { Chain } from 'viem';

// Check if mainnet is enabled
const isMainnet = process.env.NEXT_PUBLIC_MAINNET_CONFIG === 'true';

// 0G Galileo Testnet configuration
export const galileoTestnet = defineChain({
  id: 16602,
  name: '0G-Galileo-Testnet',
  network: '0g-galileo-testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_HTTP || 'https://evmrpc-testnet.0g.ai'],
      webSocket: [process.env.NEXT_PUBLIC_RPC_WEBSOCKET || 'wss://evmrpc-testnet.0g.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_HTTP || 'https://evmrpc-testnet.0g.ai'],
      webSocket: [process.env.NEXT_PUBLIC_RPC_WEBSOCKET || 'wss://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chain Explorer',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
});

// 0G Mainnet configuration
export const zeroGMainnet = defineChain({
  id: parseInt(process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID || '16661'),
  name: process.env.NEXT_PUBLIC_MAINNET_NETWORK_NAME || '0G-Mainnet',
  network: '0g-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: process.env.NEXT_PUBLIC_MAINNET_TOKEN_SYMBOL || '0G',
    symbol: process.env.NEXT_PUBLIC_MAINNET_TOKEN_SYMBOL || '0G',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://evmrpc.0g.ai'],
      webSocket: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL?.replace('https://', 'wss://').replace('http://', 'wss://') || 'wss://evmrpc.0g.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://evmrpc.0g.ai'],
      webSocket: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL?.replace('https://', 'wss://').replace('http://', 'wss://') || 'wss://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chain Explorer',
      url: process.env.NEXT_PUBLIC_MAINNET_BLOCK_EXPLORER || 'https://chainscan.0g.ai',
    },
  },
  testnet: false,
});

// Get active chain based on configuration
export const getActiveChain = (): Chain => {
  return isMainnet ? zeroGMainnet : galileoTestnet;
};

// Get all supported chains (for wallet configuration)
export const getSupportedChains = (): Chain[] => {
  return isMainnet ? [zeroGMainnet] : [galileoTestnet];
};

// Helper function to get chain configuration
export const getChainConfig = () => {
  const activeChain = getActiveChain();
  return {
    id: activeChain.id,
    name: activeChain.name,
    network: activeChain.name,
    currency: activeChain.nativeCurrency,
    rpcUrls: activeChain.rpcUrls,
    blockExplorers: activeChain.blockExplorers,
    isTestnet: activeChain.testnet ?? false,
    isMainnet
  };
};

/**
 * Get block explorer transaction URL for active chain
 * @param txHash - Transaction hash (0x...)
 * @returns Full URL to transaction in block explorer
 */
export const getTxExplorerUrl = (txHash: string): string => {
  const activeChain = getActiveChain();
  const explorerUrl = activeChain.blockExplorers?.default?.url || 'https://chainscan-galileo.0g.ai';
  return `${explorerUrl}/tx/${txHash}`;
};

/**
 * Get block explorer contract URL for active chain
 * @param contractAddress - Contract address (0x...)
 * @returns Full URL to contract in block explorer
 */
export const getContractExplorerUrl = (contractAddress: string): string => {
  const activeChain = getActiveChain();
  const explorerUrl = activeChain.blockExplorers?.default?.url || 'https://chainscan-galileo.0g.ai';
  return `${explorerUrl}/address/${contractAddress}`;
}; 