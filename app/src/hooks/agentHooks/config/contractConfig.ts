/**
 * @fileoverview Local contract configuration for agent hooks
 * @description Provides centralized contract configuration specifically for agentHooks module
 */

import { aishiAgentAbi, aishiAgentAddress } from '../../../generated';
import { getActiveChain } from '../../../config/chains';

export interface ContractConfig {
  address: `0x${string}`;
  abi: typeof aishiAgentAbi;
  chainId: number;
  contractName: string;
  network: string;
}

/**
 * @returns Contract configuration with type-safe ABI for agent hooks
 */
export const getContractConfig = (): ContractConfig => {
  const activeChain = getActiveChain();
  return {
    address: aishiAgentAddress[activeChain.id as 16602 | 16661],
    abi: aishiAgentAbi,
    chainId: activeChain.id,
    contractName: 'AishiAgent',
    network: activeChain.name
  } as const;
};