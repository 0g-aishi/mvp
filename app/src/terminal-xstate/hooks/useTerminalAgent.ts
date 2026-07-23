/**
 * @fileoverview Hook for fetching agent data using wagmi v2
 * @description Integrates with AishiAgent contract to get agent information for terminal
 */

import { useAccount, useReadContract } from 'wagmi';
import { getContractConfig, ContractFunctions } from '../services/contractService';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useTerminalAgent' });

export interface AgentData {
  name: string;
  tokenId: number;
  intelligenceLevel: number;
  dreamCount: number;
  conversationCount: number;
}

/**
 * Hook to fetch current user's agent data
 * Handles wagmi v2 struct deserialization properly
 */
export function useTerminalAgent() {
  const { address, isConnected } = useAccount();
  const contractConfig = getContractConfig();
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  // First, get the token ID for the connected wallet
  const { data: tokenIdData, isLoading: tokenIdLoading } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: ContractFunctions.OWNER_TO_TOKEN_ID,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected
    }
  });

  const tokenId = tokenIdData ? Number(tokenIdData) : 0;

  // Then fetch agent data using the token ID
  const { data: agentRawData, isLoading: agentLoading } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: ContractFunctions.AGENTS,
    args: tokenId > 0 ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId > 0
    }
  });

  useEffect(() => {
    if (agentRawData && tokenId > 0) {
      // Wagmi v2 returns structs as objects with named keys
      // Use type assertion to access properties
      const rawData = agentRawData as any;
      
      log.debug('Raw agent data from contract', {
        rawData,
        dataType: typeof rawData,
        hasAgentName: rawData.agentName !== undefined,
        hasName: rawData.name !== undefined,
        keys: Object.keys(rawData)
      });
      
      // Try wagmi v2 object style first, then fallback to array style
      const agentName = (rawData.agentName !== undefined ? 
        rawData.agentName : 
        (rawData[1] !== undefined ? rawData[1] : 'Unknown Agent'));
        
      const intelligenceLevel = (rawData.intelligenceLevel !== undefined ?
        rawData.intelligenceLevel :
        (rawData[4] !== undefined ? rawData[4] : 0));
        
      const dreamCount = (rawData.dreamCount !== undefined ?
        rawData.dreamCount :
        (rawData[5] !== undefined ? rawData[5] : 0));
        
      const conversationCount = (rawData.conversationCount !== undefined ?
        rawData.conversationCount :
        (rawData[6] !== undefined ? rawData[6] : 0));
      
      setAgentData({
        name: agentName,
        tokenId: tokenId,
        intelligenceLevel: Number(intelligenceLevel),
        dreamCount: Number(dreamCount),
        conversationCount: Number(conversationCount)
      });
      
      log.debug('Parsed agent data', {
        name: agentName,
        tokenId,
        intelligenceLevel: Number(intelligenceLevel),
        dreamCount: Number(dreamCount),
        conversationCount: Number(conversationCount)
      });
    }
  }, [agentRawData, tokenId]);

  return {
    agentName: agentData?.name || null,
    agentData,
    isLoading: tokenIdLoading || agentLoading,
    isConnected,
    hasAgent: tokenId > 0,
    tokenId
  };
}