/**
 * @fileoverview Dream Contract Updater for XState Terminal
 * @description Updates smart contract with dream data and personality evolution
 */

import { getViemProvider, getViemSigner } from '../../lib/0g/fees';
import { getActiveChain } from '../../config/chains';
import type { PublicClient, WalletClient } from 'viem';
import { getContractConfig } from './contractService';
import { EvolutionFields, clampToContractRanges } from './dreamDataValidator';
import { formatErrorForTerminal } from '../utils/viemErrorParser';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'DreamContractUpdater' });

/**
 * Contract update result interface
 */
export interface ContractUpdateResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
  isEvolutionDream?: boolean;
  metadata?: {
    tokenId: number;
    dreamHash: string;
    updateTime: number;
    confirmationTime?: number;
  };
}

/**
 * Contract personality impact structure
 * Let wagmi/viem infer the type from ABI automatically
 */

/**
 * Wait for transaction receipt with retry and fallback verification
 * Handles slow 0G Galileo testnet confirmations gracefully
 */
async function waitForReceiptWithRetry(
  publicClient: PublicClient,
  txHash: string,
  maxRetries: number = 2
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      log.debug(`Waiting for receipt (attempt ${attempt + 1}/${maxRetries + 1})`, {
        txHash: txHash.substring(0, 10) + '...'
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        confirmations: 1,
        timeout: 60_000, // 60 seconds (5x default for slow testnet)
        pollingInterval: 2_000 // Check every 2s (faster than 4s default)
      });

      log.debug('Receipt received successfully', {
        blockNumber: receipt.blockNumber,
        status: receipt.status,
        attempt: attempt + 1
      });

      return receipt; // Success!

    } catch (error) {
      lastError = error;
      log.debug(`Receipt wait attempt ${attempt + 1} failed`, {
        error: String(error).substring(0, 200)
      });

      // On last attempt, try to manually fetch transaction
      if (attempt === maxRetries) {
        try {
          log.debug('Attempting fallback transaction verification...');

          // Fallback: manually check if transaction exists
          const tx = await publicClient.getTransaction({
            hash: txHash as `0x${string}`
          });

          if (tx && tx.blockNumber) {
            log.debug('⚠️ Transaction found in block but receipt timeout - fetching manually', {
              blockNumber: tx.blockNumber
            });

            // Transaction exists! Try to get receipt one more time
            const receipt = await publicClient.getTransactionReceipt({
              hash: txHash as `0x${string}`
            });

            if (receipt) {
              log.debug('✅ Receipt retrieved via fallback method');
              return receipt;
            }
          }
        } catch (fallbackError) {
          log.debug('Fallback transaction check failed', {
            error: String(fallbackError).substring(0, 200)
          });
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
        log.debug(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  log.debug('All receipt retrieval attempts failed', {
    txHash: txHash.substring(0, 10) + '...',
    attempts: maxRetries + 1
  });

  throw lastError;
}

/**
 * Main function to update dream contract with conditional personality evolution
 */
export async function updateDreamContract(
  tokenId: number,
  dreamHash: string,
  personalityImpact?: EvolutionFields['personalityImpact'],
  dreamCount?: number
): Promise<ContractUpdateResult> {
  const updateStartTime = Date.now();
  const isEvolutionDream = !!personalityImpact;

  log.debug('Starting contract update', {
    tokenId,
    dreamHash: dreamHash.substring(0, 10) + '...',
    isEvolutionDream,
    dreamCount,
    hasPersonalityImpact: !!personalityImpact
  });

  // Special logging for evolution dreams
  if (isEvolutionDream) {
    log.debug('🎯 ========================================');
    log.debug('🎯 PROCESSING EVOLUTION DREAM CONTRACT UPDATE!');
    log.debug('🎯 ========================================');
    log.debug('🎯 Token ID: ' + tokenId);
    log.debug('🎯 Dream Count: ' + dreamCount + ' -> Next: ' + (dreamCount + 1));
    log.debug('🎯 This is dream #' + (dreamCount + 1) + ' (Evolution milestone!)');
    log.debug('🎯 Personality will be permanently evolved on-chain!');
    log.debug('🎯 ========================================');
  }

  try {
    // Validate inputs
    const validationResult = validateContractInputs(tokenId, dreamHash, personalityImpact);
    if (!validationResult.isValid) {
      throw new Error(`Contract input validation failed: ${validationResult.error}`);
    }

    // Get viem clients for transaction
    const [walletClient, walletErr] = await getViemSigner();
    if (!walletClient || walletErr) {
      throw new Error(`WalletClient error: ${walletErr?.message || 'No wallet client available'}`);
    }

    // Get account from walletClient
    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error('No account available');
    }

    const contractConfig = getContractConfig();
    
    // Prepare personality impact data
    const contractImpact = preparePersonalityImpact(personalityImpact, isEvolutionDream);

    log.debug('Prepared contract data', {
      contractAddress: contractConfig.address,
      impactData: {
        moodShift: contractImpact.moodShift,
        evolutionWeight: contractImpact.evolutionWeight,
        newFeaturesCount: contractImpact.newFeatures.length,
        isMinimalImpact: !isEvolutionDream
      }
    });

    // Execute transaction
    const txResult = await executeContractTransaction(
      walletClient,
      account,
      tokenId,
      dreamHash,
      contractImpact,
      isEvolutionDream
    );

    const totalTime = Date.now() - updateStartTime;

    log.debug('Contract update completed successfully', {
      txHash: txResult.txHash?.substring(0, 10) + '...',
      gasUsed: txResult.gasUsed,
      blockNumber: txResult.blockNumber,
      totalTime,
      isEvolutionDream
    });

    if (isEvolutionDream) {
      log.debug('✨ ========================================');
      log.debug('✨ EVOLUTION DREAM SUCCESSFULLY PROCESSED!');
      log.debug('✨ ========================================');
      log.debug('✨ Transaction hash: ' + txResult.txHash?.substring(0, 10) + '...');
      log.debug('✨ Block number: ' + txResult.blockNumber);
      log.debug('✨ Gas used: ' + txResult.gasUsed);
      log.debug('✨ Total processing time: ' + totalTime + 'ms');
      log.debug('✨ AGENT PERSONALITY HAS EVOLVED ON-CHAIN!');
      log.debug('✨ ========================================');
    }

    return {
      success: true,
      txHash: txResult.txHash,
      gasUsed: txResult.gasUsed,
      blockNumber: txResult.blockNumber,
      isEvolutionDream,
      metadata: {
        tokenId,
        dreamHash,
        updateTime: totalTime,
        confirmationTime: txResult.confirmationTime
      }
    };

  } catch (error) {
    const errorMessage = formatErrorForTerminal(error);
    const totalTime = Date.now() - updateStartTime;

    log.debug('Contract update failed', {
      error: errorMessage,
      totalTime,
      tokenId,
      isEvolutionDream,
      originalError: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      error: errorMessage,
      isEvolutionDream,
      metadata: {
        tokenId,
        dreamHash,
        updateTime: totalTime
      }
    };
  }
}


/**
 * Execute the contract transaction using viem
 */
async function executeContractTransaction(
  walletClient: WalletClient,
  account: `0x${string}`,
  tokenId: number,
  dreamHash: string,
  personalityImpact: ReturnType<typeof preparePersonalityImpact>,
  isEvolutionDream: boolean
): Promise<{
  txHash: string;
  gasUsed?: string;
  blockNumber?: number;
  confirmationTime?: number;
}> {
  const transactionStartTime = Date.now();

  log.debug('Executing processDailyDream transaction', {
    tokenId,
    dreamHash: dreamHash.substring(0, 10) + '...',
    isEvolutionDream
  });

  const contractConfig = getContractConfig();

  // Get public client for simulation
  const [publicClient, publicErr] = await getViemProvider();
  if (!publicClient || publicErr) {
    throw new Error(`PublicClient error: ${publicErr?.message || 'No public client available'}`);
  }

  // Simulate the transaction first
  log.debug('Simulating transaction...');
  const { request } = await publicClient.simulateContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'processDailyDream',
    args: [BigInt(tokenId), `0x${dreamHash.replace('0x', '')}` as `0x${string}`, personalityImpact],
    account,
    chain: getActiveChain()
  });

  log.debug('Simulation successful, executing transaction...');

  // Execute the transaction with explicit chain and account
  const txHash = await walletClient.writeContract({
    ...request,
    chain: getActiveChain(),
    account: account
  });

  log.debug('Transaction sent, waiting for confirmation', {
    txHash: txHash.substring(0, 10) + '...'
  });

  // Wait for confirmation with retry logic
  const receipt = await waitForReceiptWithRetry(publicClient, txHash);
  const confirmationTime = Date.now() - transactionStartTime;

  log.debug('Transaction confirmed', {
    txHash: txHash.substring(0, 10) + '...',
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed?.toString(),
    confirmationTime
  });

  return {
    txHash,
    gasUsed: receipt.gasUsed?.toString(),
    blockNumber: Number(receipt.blockNumber),
    confirmationTime
  };
}

/**
 * Prepare personality impact data for contract
 */
function preparePersonalityImpact(
  personalityImpact: EvolutionFields['personalityImpact'] | undefined,
  isEvolutionDream: boolean
) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (isEvolutionDream && personalityImpact) {
    log.debug('Preparing evolution dream personality impact');
    log.debug('🔧 ========================================');
    log.debug('🔧 PREPARING PERSONALITY EVOLUTION DATA');
    log.debug('🔧 ========================================');
    
    // Clamp values to contract ranges and validate
    const clampedImpact = clampToContractRanges(personalityImpact);
    
    log.debug('🔧 Raw trait changes:');
    log.debug('🔧   Creativity: ' + personalityImpact.creativityChange + ' -> ' + clampedImpact.creativityChange);
    log.debug('🔧   Analytical: ' + personalityImpact.analyticalChange + ' -> ' + clampedImpact.analyticalChange);
    log.debug('🔧   Empathy: ' + personalityImpact.empathyChange + ' -> ' + clampedImpact.empathyChange);
    log.debug('🔧   Intuition: ' + personalityImpact.intuitionChange + ' -> ' + clampedImpact.intuitionChange);
    log.debug('🔧   Resilience: ' + personalityImpact.resilienceChange + ' -> ' + clampedImpact.resilienceChange);
    log.debug('🔧   Curiosity: ' + personalityImpact.curiosityChange + ' -> ' + clampedImpact.curiosityChange);
    log.debug('🔧 Mood shift: ' + clampedImpact.moodShift);
    log.debug('🔧 Evolution weight: ' + clampedImpact.evolutionWeight + ' (1-100 scale)');
    log.debug('🔧 New features to add: ' + clampedImpact.newFeatures.length);
    log.debug('🔧 ========================================');
    
    // Add timestamps to new features
    const featuresWithTimestamp = clampedImpact.newFeatures.map(feature => ({
      name: feature.name,
      description: feature.description,
      intensity: feature.intensity,
      addedAt: BigInt(currentTimestamp)
    }));

    return {
      creativityChange: clampedImpact.creativityChange,
      analyticalChange: clampedImpact.analyticalChange,
      empathyChange: clampedImpact.empathyChange,
      intuitionChange: clampedImpact.intuitionChange,
      resilienceChange: clampedImpact.resilienceChange,
      curiosityChange: clampedImpact.curiosityChange,
      moodShift: clampedImpact.moodShift,
      evolutionWeight: clampedImpact.evolutionWeight,
      newFeatures: featuresWithTimestamp
    };
  } else {
    log.debug('Preparing standard dream minimal personality impact');
    
    // Create minimal impact for standard dreams
    return {
      creativityChange: 0,
      analyticalChange: 0,
      empathyChange: 0,
      intuitionChange: 0,
      resilienceChange: 0,
      curiosityChange: 0,
      moodShift: 'neutral',
      evolutionWeight: 1, // Minimal weight
      newFeatures: [] // No new features
    };
  }
}

/**
 * Validate contract inputs
 */
function validateContractInputs(
  tokenId: number,
  dreamHash: string,
  personalityImpact?: EvolutionFields['personalityImpact']
): { isValid: boolean; error?: string } {
  // Validate tokenId
  if (typeof tokenId !== 'number' || tokenId <= 0 || !Number.isInteger(tokenId)) {
    return { isValid: false, error: 'TokenId must be a positive integer' };
  }

  // Validate dreamHash
  if (typeof dreamHash !== 'string' || dreamHash.length === 0) {
    return { isValid: false, error: 'DreamHash must be a non-empty string' };
  }

  if (!dreamHash.startsWith('0x') || dreamHash.length !== 66) {
    return { isValid: false, error: 'DreamHash must be a valid bytes32 hex string (0x + 64 chars)' };
  }

  // Validate personalityImpact if provided
  if (personalityImpact) {
    // Basic validation - detailed validation is done in the validator
    if (typeof personalityImpact !== 'object') {
      return { isValid: false, error: 'PersonalityImpact must be an object' };
    }

    if (typeof personalityImpact.moodShift !== 'string' || personalityImpact.moodShift.trim().length === 0) {
      return { isValid: false, error: 'PersonalityImpact moodShift must be a non-empty string' };
    }

    if (typeof personalityImpact.evolutionWeight !== 'number' || 
        personalityImpact.evolutionWeight < 1 || 
        personalityImpact.evolutionWeight > 100) {
      return { isValid: false, error: 'PersonalityImpact evolutionWeight must be between 1 and 100' };
    }
  }

  return { isValid: true };
}

/**
 * Check if agent can process dream today (optional validation)
 */
export async function canProcessDreamToday(tokenId: number): Promise<{
  canProcess: boolean;
  error?: string;
  cooldownRemaining?: number;
}> {
  log.debug('Checking if agent can process dream today', { tokenId });

  try {
    const [publicClient, err] = await getViemProvider();
    if (!publicClient || err) {
      throw new Error(`PublicClient error: ${err?.message || 'No public client available'}`);
    }

    const contractConfig = getContractConfig();
    
    // Call canProcessDreamToday view function
    const canProcess = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'canProcessDreamToday',
      args: [BigInt(tokenId)]
    });
    
    log.debug('Dream processing check completed', { tokenId, canProcess });
    
    return { canProcess: canProcess as boolean };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Dream processing check failed', { error: errorMessage });
    
    // If the check fails, we assume processing is allowed (fail-safe)
    return { 
      canProcess: true, 
      error: errorMessage 
    };
  }
}

/**
 * Get current agent memory for context
 */
export async function getAgentMemory(tokenId: number): Promise<{
  success: boolean;
  memory?: any;
  error?: string;
}> {
  log.debug('Getting agent memory', { tokenId });

  try {
    const [publicClient, err] = await getViemProvider();
    if (!publicClient || err) {
      throw new Error(`PublicClient error: ${err?.message || 'No public client available'}`);
    }

    const contractConfig = getContractConfig();
    
    // Call getAgentMemory view function
    const memory = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getAgentMemory',
      args: [BigInt(tokenId)]
    }) as any;
    
    log.debug('Agent memory retrieved', { 
      tokenId,
      hasMemoryCore: memory.memoryCoreHash !== '0x0000000000000000000000000000000000000000000000000000000000000000',
      hasDailyDreams: memory.currentDreamDailyHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
    
    return { 
      success: true, 
      memory: {
        memoryCoreHash: memory.memoryCoreHash,
        currentDreamDailyHash: memory.currentDreamDailyHash,
        currentConvDailyHash: memory.currentConvDailyHash,
        lastDreamMonthlyHash: memory.lastDreamMonthlyHash,
        lastConvMonthlyHash: memory.lastConvMonthlyHash,
        lastConsolidation: memory.lastConsolidation?.toString(),
        currentMonth: memory.currentMonth,
        currentYear: memory.currentYear
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Failed to get agent memory', { error: errorMessage });
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Estimate gas for the transaction (useful for UI feedback)
 */
export async function estimateGasForDreamUpdate(
  tokenId: number,
  dreamHash: string,
  personalityImpact?: EvolutionFields['personalityImpact']
): Promise<{
  success: boolean;
  gasEstimate?: string;
  error?: string;
}> {
  log.debug('Estimating gas for dream update', { tokenId, isEvolution: !!personalityImpact });

  try {
    const [publicClient, err] = await getViemProvider();
    if (!publicClient || err) {
      throw new Error(`PublicClient error: ${err?.message || 'No public client available'}`);
    }

    const contractConfig = getContractConfig();
    const contractImpact = preparePersonalityImpact(personalityImpact, !!personalityImpact);
    
    // Estimate gas using a dummy account
    const gasEstimate = await publicClient.estimateContractGas({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'processDailyDream',
      account: '0x0000000000000000000000000000000000000000' as `0x${string}`, // dummy account for estimation
      args: [BigInt(tokenId), `0x${dreamHash.replace('0x', '')}` as `0x${string}`, contractImpact]
    });
    
    log.debug('Gas estimation completed', { 
      gasEstimate: gasEstimate.toString(),
      isEvolution: !!personalityImpact
    });
    
    return { 
      success: true, 
      gasEstimate: gasEstimate.toString() 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Gas estimation failed', { error: errorMessage });
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}
