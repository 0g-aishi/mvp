// @ts-nocheck
/**
 * @fileoverview Conversation Contract Updater for Terminal XState
 * @description Updates smart contract with conversation records
 */

import { getActiveChain } from '../../config/chains';
import { getViemProvider, getViemSigner } from '../../lib/0g/fees';
import type { PublicClient, WalletClient } from 'viem';
import { formatErrorForTerminal } from '../utils/viemErrorParser';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'ConversationContractUpdater' });

// Context types from contract
enum ContextType {
  DREAM_DISCUSSION = 0,
  GENERAL_CHAT = 1,
  PERSONALITY_QUERY = 2,
  THERAPEUTIC = 3,
  ADVICE_SEEKING = 4
}

/**
 * Map conversation type string to contract enum
 */
function mapConversationType(type: string): ContextType {
  switch (type) {
    case 'dream_discussion':
      return ContextType.DREAM_DISCUSSION;
    case 'general_chat':
      return ContextType.GENERAL_CHAT;
    case 'personality_query':
      return ContextType.PERSONALITY_QUERY;
    case 'therapeutic':
      return ContextType.THERAPEUTIC;
    case 'advice_seeking':
      return ContextType.ADVICE_SEEKING;
    default:
      return ContextType.GENERAL_CHAT;
  }
}

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
 * Update contract with conversation record
 */
export async function updateConversationContract(
  tokenId: number,
  conversationHash: string,
  conversationType: string
) {
  log.debug('Updating conversation contract', {
    tokenId,
    conversationHash: conversationHash ? conversationHash.substring(0, 10) + '...' : 'undefined',
    conversationType
  });

  try {
    // Get contract config
    const { getContractConfig } = await import('../../hooks/agentHooks/config/contractConfig');
    const contractConfig = getContractConfig();

    // Get providers
    const [publicClient, publicErr] = await getViemProvider();
    if (!publicClient || publicErr) {
      throw new Error(`PublicClient error: ${publicErr?.message || 'No public client available'}`);
    }

    const [walletClient, walletErr] = await getViemSigner();
    if (!walletClient || walletErr) {
      throw new Error(`WalletClient error: ${walletErr?.message || 'No wallet client available'}`);
    }

    // Get account from walletClient
    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error('No account available');
    }

    // Map conversation type to contract enum
    const contextType = mapConversationType(conversationType);

    log.debug('Preparing contract call', {
      contractAddress: contractConfig.address,
      contextType,
      account: account
    });

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'recordConversation',
      args: [tokenId, conversationHash as `0x${string}`, contextType],
      account: account,
      chain: getActiveChain()
    });

    log.debug('Contract simulation successful');

    // Execute the transaction with explicit chain and account
    const txHash = await walletClient.writeContract({
      ...request,
      chain: getActiveChain(),
      account: account
    });

    log.debug('Transaction submitted', { txHash });

    // Wait for confirmation with retry logic
    const receipt = await waitForReceiptWithRetry(publicClient, txHash);

    log.debug('Transaction confirmed', {
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    return {
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    const errorMessage = formatErrorForTerminal(error);

    log.debug('Error updating conversation contract', {
      error: errorMessage,
      originalError: error instanceof Error ? error.message : String(error)
    });

    throw new Error(errorMessage);
  }
}