/**
 * @fileoverview Contract configuration for API routes
 * @description Provides centralized contract configuration and storage settings for API endpoints
 */

import { aishiAgentAbi, aishiAgentAddress } from '../../../generated';
import { getActiveChain } from '../../../config/chains';
import { getNetworkConfig } from '../../../lib/0g/network';

/**
 * @returns Contract configuration with type-safe ABI for API operations
 */
export const getContractConfig = () => {
  const activeChain = getActiveChain();
  return {
    address: aishiAgentAddress[activeChain.id as 16602 | 16661],
    abi: aishiAgentAbi,
    chainId: activeChain.id,
    contractName: 'AishiAgent',
    network: activeChain.name
  } as const;
};

/**
 * 0G Storage configuration for API routes
 */
export const STORAGE_CONFIG = {
  ...(() => {
    const net = getNetworkConfig('turbo');
    return { storageRpc: net.storageRpc, l1Rpc: net.l1Rpc };
  })()
};