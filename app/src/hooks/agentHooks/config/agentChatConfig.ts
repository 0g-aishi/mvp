/**
 * Configuration for Agent Chat functionality
 */

import { getContractConfig } from './contractConfig';
import { getActiveChain } from '../../../config/chains';
import { StorageConfig, ComputeConfig } from '../types/agentChatTypes';
import { getNetworkConfig } from '../../../lib/0g/network';

// Contract configuration
export const contractConfig = getContractConfig();

// 0G Storage configuration (follows active network via network config)
const turboNetwork = getNetworkConfig('turbo');
export const STORAGE_CONFIG: StorageConfig = {
  storageRpc: turboNetwork.storageRpc,
  l1Rpc: turboNetwork.l1Rpc
};

// 0G Compute configuration
export const COMPUTE_CONFIG: ComputeConfig = {
  backendUrl: process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api'
};

// Network configuration
export const NETWORK_CONFIG = {
  chainId: getActiveChain().id
}; 