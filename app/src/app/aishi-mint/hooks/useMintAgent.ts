'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { getActiveChain } from '../../../config/chains';
import { getContractConfig, MINTING_FEE, MAX_NAME_LENGTH } from '../config/contractConfig';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useMintAgent' });

const contractValueToNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return fallback;
};

export function useMintAgent() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // Get contract configuration
  const contractConfig = getContractConfig();
  
  // Form state
  const [agentName, setAgentName] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');
  
  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  // Check if wallet already has an agent
  const { data: existingTokenId } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'ownerToTokenId',
    args: address ? [address] : undefined,
  });

  // Check if name exists
  const { data: nameExists, refetch: refetchNameExists } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'nameExists',
    args: agentName ? [agentName] : undefined,
  });

  // Get total agents for stats
  const { data: totalAgents, refetch: refetchTotalAgents } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'totalAgents',
  });

  // Get next token id (used for success state)
  const { data: nextTokenId, refetch: refetchNextTokenId } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'nextTokenId',
  });

  // Get max supply (hard cap)
  const { data: maxSupply } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'MAX_SUPPLY',
  });

  // Get current mint price (dynamic pricing)
  const { data: currentMintPrice } = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'currentMintPrice',
  });

  // Mint transaction
  const { 
    writeContractAsync, 
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction
  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess,
    error: txError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });


  const totalAgentsCount = contractValueToNumber(totalAgents);
  const maxSupplyCount = contractValueToNumber(maxSupply, 1888);

  const remainingSupply = Math.max(maxSupplyCount - totalAgentsCount, 0);
  const isSoldOut = remainingSupply <= 0;

  // Name validation
  useEffect(() => {
    if (!agentName) {
      setNameError('');
      return;
    }

    const validateName = async () => {
      setIsCheckingName(true);
      
      // Length check
      if (agentName.length > MAX_NAME_LENGTH) {
        setNameError(`Name too long (${agentName.length}/${MAX_NAME_LENGTH})`);
        setIsCheckingName(false);
        return;
      }

      // Check if name is taken
      if (agentName.length > 0) {
        await refetchNameExists();
        if (nameExists) {
          setNameError('Name already taken');
        } else {
          setNameError('');
        }
      }
      
      setIsCheckingName(false);
    };

    const timeoutId = setTimeout(validateName, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [agentName, nameExists, refetchNameExists]);

  // Success handler
  useEffect(() => {
    if (isTxSuccess && txHash) {
      const updateSupplyState = async () => {
        setShowSuccess(true);

        const [totalAgentsResult, nextTokenIdResult] = await Promise.allSettled([
          refetchTotalAgents(),
          refetchNextTokenId(),
        ]);

        const totalAgentsValue =
          totalAgentsResult.status === 'fulfilled'
            ? totalAgentsResult.value?.data
            : totalAgents;
        const nextTokenIdValue =
          nextTokenIdResult.status === 'fulfilled'
            ? nextTokenIdResult.value?.data
            : nextTokenId;

        const totalMinted = contractValueToNumber(totalAgentsValue);
        const nextId = contractValueToNumber(nextTokenIdValue, totalMinted + 1);
        const resolvedTokenId = Math.max(nextId - 1, totalMinted);

        setMintedTokenId(resolvedTokenId > 0 ? resolvedTokenId : null);
        toast.success('Agent created successfully!');
      };

      updateSupplyState();
    }
  }, [isTxSuccess, txHash, refetchTotalAgents, refetchNextTokenId, totalAgents, nextTokenId]);

  // Handle mint
  const handleMint = async () => {
    if (!address || !agentName || nameError || isSoldOut) return;

    try {
      // Use current mint price (dynamic pricing)
      const mintPrice = currentMintPrice || MINTING_FEE;

      await writeContractAsync({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'mintAgent',
        args: [
          [], // empty proofs
          [], // empty descriptions
          agentName,
          address
        ],
        value: mintPrice,
        account: address,
        chain: getActiveChain(),
      });
    } catch (error) {
      log.error('Mint error', { error });
      toast.error('Failed to mint agent');
    }
  };

  // Share on X (Twitter)
  const shareOnX = () => {
    const tweet = `Just created my Aishi Agent "${agentName}"! 🤖✨\n\nReady to explore dreams and evolve personality.\n\n#Aishi #Web3`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`);
  };

  // Reset state
  const reset = () => {
    setAgentName('');
    setNameError('');
    setShowSuccess(false);
    setMintedTokenId(null);
    resetWrite();
  };

  // Eligibility checks
  const hasExistingAgent = existingTokenId && Number(existingTokenId) > 0;
  const mintPrice = currentMintPrice || MINTING_FEE;
  const hasInsufficientBalance = balance && balance.value < mintPrice;
  const canMint = isConnected && !hasExistingAgent && !hasInsufficientBalance &&
                  agentName && !nameError && !isCheckingName && !isSoldOut;

  // Transaction status
  const isProcessing = isWritePending || isTxLoading;

  return {
    // State
    agentName,
    setAgentName,
    nameError,
    isCheckingName,
    showSuccess,
    mintedTokenId,
    
    // Wallet & Balance
    address,
    isConnected,
    balance,
    hasExistingAgent,
    hasInsufficientBalance,
    existingTokenId,
    
    // Stats
    totalAgents: totalAgentsCount,
    maxSupply: maxSupplyCount,
    remainingSupply,
    isSoldOut,
    currentMintPrice: currentMintPrice || MINTING_FEE,
    
    // Transaction
    isProcessing,
    writeError,
    txError,
    txHash,
    isTxSuccess,
    
    // Actions
    handleMint,
    shareOnX,
    reset,
    canMint,
    
    // Constants
    MINTING_FEE,
    MAX_NAME_LENGTH,
    CONTRACT_ADDRESS: contractConfig.address,
  };
}