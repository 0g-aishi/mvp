import { getActiveChain } from '../../config/chains';

export type NetworkType = 'standard' | 'turbo';

export interface NetworkConfig {
  name: string;
  flowAddress: string;
  storageRpc: string;
  explorerUrl: string;
  l1Rpc: string;
}

/**
 * Gets network configuration based on network type from doors.md env vars
 * @param networkType The network type ('standard' or 'turbo')
 * @returns The network configuration
 */
export function getNetworkConfig(networkType: NetworkType): NetworkConfig {
  const activeChain = getActiveChain();
  const isMainnet = activeChain.testnet === false;
  // Use proper fallback based on active chain ID
  const fallbackUrl = activeChain.id === 16661 ? 'https://chainscan.0g.ai' : 'https://chainscan-galileo.0g.ai';
  const explorerBaseUrl = activeChain.blockExplorers?.default?.url || fallbackUrl;

  const NETWORKS: Record<NetworkType, NetworkConfig> = {
    standard: {
      name: 'Standard',
      // Keep standard defaults; allow optional mainnet override if provided
      flowAddress: process.env.NEXT_PUBLIC_STANDARD_FLOW_ADDRESS || '0xbD75117F80b4E22698D0Cd7612d92BDb8eaff628',
      storageRpc: isMainnet
        ? (process.env.NEXT_PUBLIC_STANDARD_STORAGE_MAINNET_RPC || process.env.NEXT_PUBLIC_STANDARD_STORAGE_RPC || 'https://indexer-storage-testnet-standard.0g.ai')
        : (process.env.NEXT_PUBLIC_STANDARD_STORAGE_RPC || 'https://indexer-storage-testnet-standard.0g.ai'),
      explorerUrl: `${explorerBaseUrl}/tx/`,
      l1Rpc: activeChain.rpcUrls?.default?.http[0] || 'https://evmrpc-testnet.0g.ai'
    },
    turbo: {
      name: 'Turbo',
      // Switch flow address and storage RPC based on active network
      flowAddress: isMainnet
        ? (process.env.NEXT_PUBLIC_MAINNET_TURBO_FLOW_ADDRESS || process.env.NEXT_PUBLIC_TURBO_FLOW_ADDRESS || '0xbD75117F80b4E22698D0Cd7612d92BDb8eaff628')
        : (process.env.NEXT_PUBLIC_TURBO_FLOW_ADDRESS || '0xbD75117F80b4E22698D0Cd7612d92BDb8eaff628'),
      storageRpc: isMainnet
        ? (process.env.NEXT_PUBLIC_TURBO_STORAGE_MAINNET_RPC || process.env.NEXT_PUBLIC_TURBO_STORAGE_RPC || 'https://indexer-storage-turbo.0g.ai')
        : (process.env.NEXT_PUBLIC_TURBO_STORAGE_RPC || 'https://indexer-storage-testnet-turbo.0g.ai'),
      explorerUrl: `${explorerBaseUrl}/tx/`,
      l1Rpc: activeChain.rpcUrls?.default?.http[0] || 'https://evmrpc-testnet.0g.ai'
    }
  };

  return NETWORKS[networkType];
}

/**
 * Gets default network type from environment
 * @returns The default network type
 */
export function getDefaultNetworkType(): NetworkType {
  return (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkType) || 'turbo';
}

/**
 * Gets explorer URL for a transaction hash
 * @param txHash The transaction hash
 * @param networkType The network type
 * @returns The explorer URL
 */
export function getExplorerUrl(txHash: string, networkType: NetworkType): string {
  const network = getNetworkConfig(networkType);
  return network.explorerUrl + txHash;
} 