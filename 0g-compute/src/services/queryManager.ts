const ethers = require('ethers');
const aiService = require('./aiService');
const virtualBrokers = require('./virtualBrokers');
const masterWallet = require('./masterWallet');
const database = require('../database/database');
const { createLogger } = require('../lib/logger');
const env = require('./.hg/database.env');

const log = createLogger('QueryManager');

interface QueryTask {
  id: string;
  userWalletAddress: string;
  query: string;
  model: string;
  timestamp: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

class QueryManagerService {
  private queue: Array<QueryTask> = [];
  private processing = false;
  private maxConcurrent = parseInt(process.env.MAX_CONCURRENT_QUERIES || '10');
  private activeQueries = 0;

  constructor() {
    // Start queue processor
    this.startQueueProcessor();

    if (process.env.TEST_ENV === 'true') {
      log.info('Query Manager initialized', { maxConcurrent: this.maxConcurrent });
    }
  }

  /**
   * Add query to processing queue - this is now the main entry point
   * @param userWalletAddress - User's wallet address
   * @param query - Query text to process
   * @param modelId - Model ID from frontend (can be model name or will be resolved to provider address)
   */
  async processQuery(userWalletAddress: string, query: string, modelId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: QueryTask = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userWalletAddress,
        query,
        model: modelId || process.env.MODEL_PICKED || 'llama-3.3-70b-instruct',
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.queue.push(task);

      if (process.env.TEST_ENV === 'true') {
        log.info('Added query to queue', { queryId: task.id, queueLength: this.queue.length, model: task.model });
      }
    });
  }

  /**
   * Process queries from queue with concurrency control
   */
  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      // Process multiple queries if we have capacity
      while (this.queue.length > 0 && this.activeQueries < this.maxConcurrent) {
        const task = this.queue.shift();
        if (!task) break;

        this.activeQueries++;

        if (process.env.TEST_ENV === 'true') {
          log.info('Processing query', { queryId: task.id, active: this.activeQueries, max: this.maxConcurrent });
        }

        // Process query atomically (async, don't wait)
        this.processQueryAtomically(task)
          .then(result => {
            task.resolve(result);
          })
          .catch(error => {
            task.reject(error);
          })
          .finally(() => {
            this.activeQueries--;

            if (process.env.TEST_ENV === 'true') {
              log.info('Completed query', { queryId: task.id, active: this.activeQueries, max: this.maxConcurrent });
            }
          });
      }
    }, 50); // Check queue every 50ms for faster processing
  }

  /**
   * Process single query atomically to prevent race conditions
   */
  private async processQueryAtomically(task: QueryTask): Promise<any> {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!task.userWalletAddress || !task.userWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      if (!task.query || task.query.trim().length === 0) {
        throw new Error('Query cannot be empty');
      }

      // Enhanced debug logging for troubleshooting
      if (process.env.TEST_ENV === 'true') {
        const normalizedAddress = task.userWalletAddress.toLowerCase();
        log.debug('Processing for wallet', { queryId: task.id, wallet: task.userWalletAddress, normalized: normalizedAddress });

        // Check if broker exists in database
        const broker = database.getBroker(normalizedAddress);
        log.debug('Broker exists check', { queryId: task.id, exists: !!broker });

        if (broker) {
          const estimatedCost = virtualBrokers.estimateQueryCost(task.query, task.model);
          log.debug('Broker details', {
            queryId: task.id,
            balance: broker.balance.toFixed(8),
            estimatedCost: estimatedCost.toFixed(8),
            sufficientBalance: broker.balance >= estimatedCost
          });
        } else {
          log.debug('Virtual broker NOT found in database', { queryId: task.id, message: 'User must create broker first: POST /api/create-broker' });
        }
      }

      // Log selected model
      log.info('Selected model', { model: task.model, queryId: task.id });

      // ✅ Resolve model to provider address using cache (eliminuje hardcoded fallback)
      let providerAddress: string;
      let modelName: string;

      // Use fast cache lookup for provider address
      const cachedProviderAddress = await aiService.getProviderByModelName(task.model);
      if (cachedProviderAddress) {
        providerAddress = cachedProviderAddress;
        modelName = task.model;

        if (process.env.TEST_ENV === 'true') {
          log.info('Model resolved from cache', { model: task.model, provider: providerAddress });
        }
      } else {
        // If not in cache, get all available models for error message
        const availableModels = aiService.getAvailableModelNames();
        throw new Error(`Model not available: ${task.model}. Available models: ${availableModels.length > 0 ? availableModels.join(', ') : 'No models discovered. Try refreshing model discovery.'}`);
      }

      // Estimate cost for pre-check
      const estimatedCost = virtualBrokers.estimateQueryCost(task.query, task.model);
      
      // ATOMIC OPERATION: Check and reserve user balance
      const reservationSuccess = await this.atomicBalanceReservation(task.userWalletAddress, estimatedCost, task.id);
      if (!reservationSuccess) {
        // Enhanced error handling - distinguish between "no broker" and "insufficient funds"
        try {
          const balance = await virtualBrokers.checkBalance(task.userWalletAddress);
          throw new Error(`Insufficient balance. Estimated cost: ${estimatedCost.toFixed(8)} OG, Available: ${balance.balance.toFixed(8)} OG`);
        } catch (balanceError: any) {
          if (balanceError.message.includes('No virtual broker found')) {
            throw new Error(`Virtual broker not found for ${task.userWalletAddress}. Please create a broker first: POST /api/create-broker with { "walletAddress": "${task.userWalletAddress}" }`);
          }
          throw balanceError;
        }
      }

      // Check and refill master wallet if needed
      await masterWallet.checkAndRefill();

      // ATOMIC OPERATION: Execute AI query with balance tracking
      const result = await this.executeAIQueryWithTracking(task, providerAddress, estimatedCost);

      const responseTime = Date.now() - startTime;

      if (process.env.TEST_ENV === 'true') {
        log.info('Query completed atomically', { queryId: task.id, responseTime });
      }

      return {
        ...result,
        responseTime,
        queryId: task.id
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      log.error('Query failed', { queryId: task.id, error: error.message });

      // Release any reserved balance on error
      await this.releaseReservedBalance(task.userWalletAddress, task.id);
      
      throw {
        error: error.message,
        responseTime: responseTime,
        model: task.model,
        queryId: task.id,
        isValid: false
      };
    }
  }

  /**
   * Atomically reserve user balance to prevent race conditions
   */
  private async atomicBalanceReservation(userAddress: string, amount: number, queryId: string): Promise<boolean> {
    try {
      const normalizedAddress = userAddress.toLowerCase();
      
      // Get current broker state
      const broker = database.getBroker(normalizedAddress);
      if (!broker || broker.balance < amount) {
        return false;
      }

      // Atomically update balance and record transaction
      try {
        const newBalance = broker.balance - amount;
        database.updateBalance(normalizedAddress, newBalance);
        
        // Record reservation
        database.addTransaction({
          walletAddress: normalizedAddress,
          type: 'ai_query',
          amount: amount,
          description: `Balance reserved for query ${queryId}`,
          txHash: undefined
        });

        if (process.env.TEST_ENV === 'true') {
          log.info('Reserved balance for query', { queryId, amount: amount.toFixed(8), newBalance: newBalance.toFixed(8) });
        }

        return true;
      } catch (updateError: any) {
        log.error('Failed to update balance for query', { queryId, error: updateError.message });
        return false;
      }
    } catch (error: any) {
      log.error('Failed to reserve balance for query', { queryId, error: error.message });
      return false;
    }
  }

  /**
   * Execute AI query with Master Wallet balance tracking
   */
  private async executeAIQueryWithTracking(task: QueryTask, providerAddress: string, estimatedCost: number): Promise<any> {
    // Get initial Master Wallet balance
    const initialBalance = await masterWallet.getLedgerBalance();

    if (process.env.TEST_ENV === 'true') {
      log.info('Initial Master Wallet balance', { balance: initialBalance.toFixed(8), queryId: task.id });
    }

    // Get service metadata
    const broker = masterWallet.getBroker();
    const { endpoint, model: actualModel } = await broker.inference.getServiceMetadata(providerAddress);

    // Generate authentication headers
    const headers = await broker.inference.getRequestHeaders(providerAddress, task.query);

    // Create OpenAI client with timeout for 0G Network providers
    const OpenAI = require('openai');
    const openai = new (OpenAI.default || OpenAI)({
      baseURL: endpoint,
      apiKey: '',
      timeout: 60000, // 60 second timeout (0G providers can be slower than standard APIs)
      maxRetries: 0   // Disable auto-retry (we handle retries at queue level)
    });

    // Prepare headers
    const requestHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        requestHeaders[key] = value;
      }
    });

    // Send query to AI service
    if (process.env.TEST_ENV === 'true') {
      log.info('Sending AI query', { queryId: task.id, queryPreview: task.query.substring(0, 100), model: actualModel });
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: task.query }],
      model: actualModel,
    }, {
      headers: requestHeaders,
    });

    const aiResponse = completion.choices[0].message.content || '';
    const chatId = completion.id;

    // Process response and verify
    const isValid = await broker.inference.processResponse(
      providerAddress,
      aiResponse,
      chatId
    );

    // Get final Master Wallet balance and calculate real cost
    const finalBalance = await masterWallet.getLedgerBalance();
    const realCost = Math.max(0, initialBalance - finalBalance);

    if (process.env.TEST_ENV === 'true') {
      log.info('Final Master Wallet balance and cost', {
        queryId: task.id,
        finalBalance: finalBalance.toFixed(8),
        realCost: realCost.toFixed(8)
      });
    }

    // Adjust user balance based on real cost vs estimated cost
    await this.adjustUserBalance(task.userWalletAddress, estimatedCost, realCost, task.id);

    return {
      response: aiResponse,
      model: actualModel,
      cost: realCost,
      chatId: chatId,
      isValid: !!isValid
    };
  }

  /**
   * Adjust user balance based on real cost vs estimated cost
   */
  private async adjustUserBalance(userAddress: string, estimatedCost: number, realCost: number, queryId: string): Promise<void> {
    const difference = realCost - estimatedCost;
    
    if (Math.abs(difference) < 0.000001) {
      // Costs are essentially the same, no adjustment needed
      if (process.env.TEST_ENV === 'true') {
        log.info('No balance adjustment needed', { queryId });
      }
      return;
    }

    try {
      if (difference > 0) {
        // Real cost was higher - deduct additional amount
        await virtualBrokers.deductFunds(
          userAddress,
          difference,
          `Additional cost for query ${queryId}: ${difference} OG`
        );

        if (process.env.TEST_ENV === 'true') {
          log.info('Deducted additional cost', { queryId, amount: difference.toFixed(8) });
        }
      } else {
        // Real cost was lower - refund difference
        await database.addToBalance(userAddress.toLowerCase(), Math.abs(difference));
        
        database.addTransaction({
          walletAddress: userAddress.toLowerCase(),
          type: 'deposit',
          amount: Math.abs(difference),
          description: `Refund for query ${queryId}: ${Math.abs(difference)} OG`,
          txHash: undefined
        });

        if (process.env.TEST_ENV === 'true') {
          log.info('Refunded excess cost', { queryId, amount: Math.abs(difference).toFixed(8) });
        }
      }
    } catch (error: any) {
      log.error('Failed to adjust balance for query', { queryId, error: error.message });
    }
  }

  /**
   * Release reserved balance in case of error
   */
  private async releaseReservedBalance(userAddress: string, queryId: string): Promise<void> {
    try {
      // This would require additional tracking of reservations
      // For now, we'll just log the intent
      if (process.env.TEST_ENV === 'true') {
        log.info('Releasing reserved balance for failed query', { queryId });
      }
    } catch (error: any) {
      log.error('Failed to release reserved balance', { queryId, error: error.message });
    }
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): { queueLength: number; activeQueries: number; maxConcurrent: number } {
    return {
      queueLength: this.queue.length,
      activeQueries: this.activeQueries,
      maxConcurrent: this.maxConcurrent
    };
  }
}

module.exports = new QueryManagerService(); 