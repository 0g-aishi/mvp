/**
 * @fileoverview Contract configuration for Aishi mint module
 * @description Provides centralized contract configuration and constants for agent minting
 */

import { parseEther } from 'viem';
import { aishiAgentAbi, aishiAgentAddress } from '../../../generated';
import { getActiveChain } from '../../../config/chains';

/**
 * @returns Contract configuration with type-safe ABI for minting operations
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

// Minting-specific constants
export const MINTING_FEE = parseEther('0.1'); // 0.1 OG base price
export const MAX_NAME_LENGTH = 32;