/**
 * @fileoverview AI service for processing queries through 0G Network
 * @description Manages AI model discovery, service acknowledgment, query processing,
 * and dynamic cost calculation with real-time balance tracking.
 */

const OpenAIModule = require('openai');
const OpenAI = OpenAIModule.default || OpenAIModule;
require('../config/envLoader');
const masterWallet = require('./masterWallet');
const virtualBrokers = require('./virtualBrokers');
const { createLogger } = require('../lib/logger');

const log = createLogger('AIService');

const DEFAULT_MODEL = process.env.MODEL_PICKED || "llama-3.3-70b-instruct";
const PROVIDER_TIMEOUT = 30000;
const BALANCE_EXPIRATION = 5 * 60 * 1000;
const MIN_BALANCE_THRESHOLD = 0.0001;
const MIN_PROFIT_MARGIN = 0.00001;
const MAX_PROFIT_MARGIN = 0.0005;
const SERVICE_CACHE_TTL = 5 * 60 * 1000;

interface DiscoveredService {
  provider: string;
  model: string;
  url: string;
  inputPrice: bigint;
  outputPrice: bigint;
  verifiability: string;
  serviceType: string;
  updatedAt: bigint;
  isAvailable: boolean;
}

interface AIRequest {
  userWalletAddress: string;
  query: string;
  model?: string;
}

interface AIResponse {
  response: string;
  model: string;
  cost: number;
  chatId: string;
  responseTime: number;
  isValid: boolean;
}

class AIService {
  private availableServices: any[] = [];
  private acknowledgedProviders: Set<string> = new Set();
  private discoveredServices: Map<string, DiscoveredService> = new Map();
  private lastDiscoveryTime: number = 0;
  private modelToProviderCache: Map<string, string> = new Map();
  private failedProviders: Map<string, { modelName: string; lastAttempt: number; attempts: number }> = new Map();
  private recoveryIntervalId: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      log.info('Default Model Configuration', { defaultModel: DEFAULT_MODEL });

      await masterWallet.initialize();

      await this.discoverAndCacheServices();

      if (process.env.TEST_ENV === 'true') {
        log.info('AI Service initialized successfully');
        log.info('Discovered models from 0G Network', { count: this.discoveredServices.size });
      }
    } catch (error: any) {
      log.error('Failed to initialize AI Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize AI service with timeout for parallel startup
   */
  async initializeWithTimeout(timeoutMs: number = 10000): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI Service initialization timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      await Promise.race([
        this.initialize(),
        timeoutPromise
      ]);
    } catch (error: any) {
      if (error.message.includes('timeout')) {
        log.warn('AI Service initialization timeout - 0G Network may be unavailable');
        // Initialize minimal state for fallback mode
        await masterWallet.initialize();
        log.info('Master Wallet ready (Gemini fallback mode)');
      } else {
        throw error;
      }
    }
  }

  /**
   * Discover and cache available AI services from 0G Network
   * @private
   */
  private async discoverAndCacheServices(): Promise<void> {
    const currentTimestamp = Date.now();
    if (this.lastDiscoveryTime && (currentTimestamp - this.lastDiscoveryTime) < SERVICE_CACHE_TTL) {
      if (process.env.TEST_ENV === 'true') {
        log.debug('Using cached service discovery');
      }
      return;
    }

    try {
      const masterBroker = masterWallet.getBroker();
      const availableServices = await masterBroker.inference.listService();
      
      this.discoveredServices.clear();

      if (process.env.TEST_ENV === 'true') {
        const uniqueServiceTypes = availableServices.map((service: any) => service.serviceType).filter((value: any, index: any, array: any) => array.indexOf(value) === index);
        log.debug('Discovered service types', { types: uniqueServiceTypes.join(', ') });
        log.debug('Total services found', { count: availableServices.length });
      }
      
      /* Filter AI models - support both 'inference' (legacy) and 'chatbot' (new API) */
      for (const serviceItem of availableServices) {
        if ((serviceItem.serviceType === 'inference' || serviceItem.serviceType === 'chatbot') && serviceItem.model) {
          const discoveredServiceEntry: DiscoveredService = {
            provider: serviceItem.provider,
            model: serviceItem.model,
            url: serviceItem.url,
            inputPrice: serviceItem.inputPrice,
            outputPrice: serviceItem.outputPrice,
            verifiability: serviceItem.verifiability || 'none',
            serviceType: serviceItem.serviceType,
            updatedAt: serviceItem.updatedAt,
            isAvailable: true
          };
          
          this.discoveredServices.set(serviceItem.model, discoveredServiceEntry);

          this.modelToProviderCache.set(serviceItem.model, serviceItem.provider);

          // Log provider pricing details for SDK 0.4.4 planning
          if (process.env.TEST_ENV === 'true') {
            const totalPricePerToken = Number(serviceItem.inputPrice) + Number(serviceItem.outputPrice);
            const costPer1KTokens = (totalPricePerToken * 1000 / 1e18);
            const initialDeposit = (totalPricePerToken * 2000000 / 1e18); // SDK topUpTargetThreshold = 2M

            log.debug('Provider Price', {
              model: serviceItem.model,
              address: serviceItem.provider,
              inputPrice: `${(Number(serviceItem.inputPrice) / 1e18).toFixed(12)} OG/token`,
              outputPrice: `${(Number(serviceItem.outputPrice) / 1e18).toFixed(12)} OG/token`,
              costPer1KTokens: `~${costPer1KTokens.toFixed(10)} OG`,
              requiredDeposit: `~${initialDeposit.toFixed(4)} OG`,
              verifiability: serviceItem.verifiability || 'none'
            });
          }

          await this.acknowledgeProvider(serviceItem.provider, serviceItem.model);
        }
      }

      this.availableServices = availableServices;
      this.lastDiscoveryTime = currentTimestamp;

      if (process.env.TEST_ENV === 'true') {
        log.debug('Discovered inference models', {
          inferenceModels: this.discoveredServices.size,
          totalServices: availableServices.length
        });
        log.debug('Available models', {
          models: Array.from(this.discoveredServices.keys()).join(', ')
        });
      }
    } catch (error: any) {
      log.error('Failed to discover AI services', { error: error.message });
      /* Don't throw - we can still use Gemini as fallback */
    }
  }

  /**
   * Acknowledge provider signer for a model with timeout
   * @private
   */
  private async acknowledgeProvider(providerAddress: string, modelName: string): Promise<void> {
    if (this.acknowledgedProviders.has(providerAddress)) {
      return;
    }

    try {
      const masterBroker = masterWallet.getBroker();

      // Add 30-second timeout per provider (SDK 0.4.4 requires multiple transactions + TEE verification)
      const acknowledgePromise = masterBroker.inference.acknowledgeProviderSigner(providerAddress);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Provider acknowledgment timeout')), 30000);
      });

      await Promise.race([acknowledgePromise, timeoutPromise]);

      this.acknowledgedProviders.add(providerAddress);

      if (process.env.TEST_ENV === 'true') {
        log.debug('Acknowledged provider', { model: modelName, provider: providerAddress });
      }
    } catch (error: any) {
      if (error.message.includes('already acknowledged')) {
        this.acknowledgedProviders.add(providerAddress);
        if (process.env.TEST_ENV === 'true') {
          log.debug('Provider already acknowledged', { model: modelName });
        }
      } else if (error.message.includes('timeout')) {
        log.warn('Provider acknowledgment timeout - skipping', { model: modelName });
        this.addToFailedProviders(providerAddress, modelName);
      } else {
        log.warn('Failed to acknowledge provider - skipping', { model: modelName, error: error.message });
        this.addToFailedProviders(providerAddress, modelName);
      }
    }
  }

  async analyzeDream(request: AIRequest): Promise<AIResponse> {
    const { userWalletAddress, query, model = DEFAULT_MODEL } = request;
    const queryStartTime = Date.now();
    
    try {
      if (!userWalletAddress || !userWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      if (!query || query.trim().length === 0) {
        throw new Error('Query cannot be empty');
      }

      await this.discoverAndCacheServices();
      
      const discoveredService = this.discoveredServices.get(model);
      if (!discoveredService) {
        const availableModelsList = Array.from(this.discoveredServices.keys());
        throw new Error(`Model not available: ${model}. Available models: ${availableModelsList.join(', ') || 'No models discovered. Using Gemini fallback.'}`);
      }
      
      const providerAddress = discoveredService.provider;

      // Log selected model
      log.info('Selected Model', { model, provider: providerAddress });
      if (process.env.TEST_ENV === 'true') {
        log.debug('Service details', {
          url: discoveredService.url,
          inputPrice: discoveredService.inputPrice.toString()
        });
      }

      // Estimate cost for pre-check (user needs some minimum balance)
      const estimatedCost = virtualBrokers.estimateQueryCost(query, model);
      
      // Check if user has sufficient balance for estimated cost
      const hasBalance = await virtualBrokers.hasBalance(userWalletAddress, estimatedCost);
      if (!hasBalance) {
        const balance = await virtualBrokers.checkBalance(userWalletAddress);
        throw new Error(`Insufficient balance. Estimated cost: ${estimatedCost} OG, Available: ${balance.balance} OG`);
      }

      // Check and refill master wallet if needed
      await masterWallet.checkAndRefill();

      // Get initial Master Wallet balance for dynamic cost calculation
      const initialBalance = await masterWallet.getLedgerBalance();

      if (process.env.TEST_ENV === 'true') {
        log.debug('Initial Master Wallet balance', { balance: `${initialBalance} OG` });
        log.debug('Estimated cost', { cost: `${estimatedCost} OG` });
      }

      // Get service metadata
      const broker = masterWallet.getBroker();
      const { endpoint, model: actualModel } = await broker.inference.getServiceMetadata(providerAddress);

      // Generate authentication headers
      const headers = await broker.inference.getRequestHeaders(providerAddress, query);

      // Create OpenAI client with timeout for 0G Network providers
      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: '',
        timeout: 60000, // 60 second timeout (0G providers can be slower than standard APIs)
        maxRetries: 0   // Disable auto-retry (we handle retries ourselves)
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
        log.debug('Sending AI query', {
          wallet: userWalletAddress,
          queryPreview: query.substring(0, 100) + '...',
          model: actualModel,
          endpoint
        });
      }

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: query }],
        model: actualModel,
      }, {
        headers: requestHeaders,
      });

      const aiResponse = completion.choices[0].message.content || '';
      const chatId = completion.id;
      const responseTime = Date.now() - queryStartTime;

      if (process.env.TEST_ENV === 'true') {
        log.debug('AI query completed', {
          responseTime: `${responseTime}ms`,
          chatId,
          responsePreview: aiResponse.substring(0, 200) + '...'
        });
      }

      // Process response and verify
      const isValid = await broker.inference.processResponse(
        providerAddress,
        aiResponse,
        chatId
      );

      // Get final Master Wallet balance for dynamic cost calculation
      const finalBalance = await masterWallet.getLedgerBalance();
      const realCost = Math.max(0, initialBalance - finalBalance); // Ensure non-negative

      if (process.env.TEST_ENV === 'true') {
        log.debug('Query cost calculation', {
          finalBalance: `${finalBalance} OG`,
          realCost: `${realCost} OG`,
          verificationStatus: isValid ? 'Valid' : 'Invalid'
        });
      }

      // Deduct real cost from user balance (we already checked they have estimated cost)
      // If real cost > estimated cost, user might go negative, but we'll handle this
      try {
        await virtualBrokers.deductFunds(
          userWalletAddress, 
          realCost, 
          `AI Query: ${model} - "${query.substring(0, 50)}..." (Real cost: ${realCost} OG)`
        );
      } catch (balanceError: any) {
        // If user doesn't have enough for real cost, deduct what they have
        const userBalance = await virtualBrokers.checkBalance(userWalletAddress);
        const deductedAmount = Math.min(realCost, userBalance.balance);
        
        if (deductedAmount > 0) {
          await virtualBrokers.deductFunds(
            userWalletAddress, 
            deductedAmount, 
            `AI Query: ${model} - "${query.substring(0, 50)}..." (Partial payment: ${deductedAmount}/${realCost} OG)`
          );
        }

        log.warn('User had insufficient balance for real cost', {
          wallet: userWalletAddress,
          realCost: `${realCost} OG`,
          deducted: `${deductedAmount} OG`
        });
      }

      if (process.env.TEST_ENV === 'true') {
        log.debug('AI query completed', {
          wallet: userWalletAddress,
          responseTime: `${responseTime}ms`,
          realCost: `${realCost} OG`
        });
      }

      return {
        response: aiResponse,
        model: actualModel,
        cost: realCost,
        chatId: chatId,
        responseTime: responseTime,
        isValid: !!isValid // Convert null to false
      };

    } catch (error: any) {
      const responseTime = Date.now() - queryStartTime;

      log.error('AI query failed', { wallet: userWalletAddress, error: error.message });

      if (process.env.TEST_ENV === 'true') {
        log.error('Error details', { stack: error.stack });
      }

      throw {
        error: error.message,
        responseTime: responseTime,
        model: model,
        isValid: false
      };
    }
  }



  async getAvailableModels(): Promise<{
    models: string[];
    services: any[];
  }> {
    // Refresh discovery if needed
    await this.discoverAndCacheServices();
    
    const models = Array.from(this.discoveredServices.keys());
    const services = Array.from(this.discoveredServices.values()).map(service => ({
      provider: service.provider,
      model: service.model,
      serviceType: service.serviceType,
      url: service.url,
      inputPrice: service.inputPrice.toString(),
      outputPrice: service.outputPrice.toString(),
      verifiability: service.verifiability,
      isAvailable: service.isAvailable
    }));
    
    return { models, services };
  }

  async discoverServices(): Promise<DiscoveredService[]> {
    // Refresh discovery
    await this.discoverAndCacheServices();
    
    // Return discovered services as array
    return Array.from(this.discoveredServices.values());
  }

  /**
   * Get service by provider address
   * @param providerAddress - Provider address to lookup
   * @returns DiscoveredService or null if not found
   */
  async getServiceByProviderAddress(providerAddress: string): Promise<DiscoveredService | null> {
    // Ensure services are discovered
    await this.discoverAndCacheServices();
    
    // Find service by provider address
    for (const service of this.discoveredServices.values()) {
      if (service.provider.toLowerCase() === providerAddress.toLowerCase()) {
        return service;
      }
    }
    
    return null;
  }

  /**
   * Get service by model name (for backward compatibility)
   * @param modelName - Model name to lookup
   * @returns DiscoveredService or null if not found
   */
  async getServiceByModelName(modelName: string): Promise<DiscoveredService | null> {
    // Ensure services are discovered
    await this.discoverAndCacheServices();
    
    // Find service by model name
    return this.discoveredServices.get(modelName) || null;
  }

  /**
   * ✅ Get provider address by model name - FAST CACHE LOOKUP
   * @param modelName - Model name to lookup
   * @returns Provider address or null if not found
   */
  async getProviderByModelName(modelName: string): Promise<string | null> {
    // Ensure services are discovered and cache is populated
    await this.discoverAndCacheServices();
    
    // Fast cache lookup
    return this.modelToProviderCache.get(modelName) || null;
  }

  /**
   * ✅ Get all available models from cache - FAST LOOKUP
   * @returns Array of model names
   */
  getAvailableModelNames(): string[] {
    return Array.from(this.modelToProviderCache.keys());
  }

  /**
   * ✅ Clear model cache (useful for testing)
   */
  clearModelCache(): void {
    this.modelToProviderCache.clear();
    this.lastDiscoveryTime = 0; // Force re-discovery
  }

  async getServiceStatus(): Promise<{
    totalServices: number;
    acknowledgedProviders: number;
    failedProviders: number;
    masterWalletBalance: number;
    isReady: boolean;
    isRecoveryActive: boolean;
  }> {
    try {
      const walletInfo = await masterWallet.getWalletInfo();

      return {
        totalServices: this.availableServices.length,
        acknowledgedProviders: this.acknowledgedProviders.size,
        failedProviders: this.failedProviders.size,
        masterWalletBalance: walletInfo.ledgerBalance,
        isReady: this.availableServices.length > 0 && this.acknowledgedProviders.size > 0,
        isRecoveryActive: !!this.recoveryIntervalId
      };
    } catch (error: any) {
      log.error('Failed to get service status', { error: error.message });
      throw error;
    }
  }

  /**
   * Add failed provider to recovery list
   * @private
   */
  private addToFailedProviders(providerAddress: string, modelName: string): void {
    const existing = this.failedProviders.get(providerAddress);
    this.failedProviders.set(providerAddress, {
      modelName,
      lastAttempt: Date.now(),
      attempts: (existing?.attempts || 0) + 1
    });

    // Start recovery mechanism if not already running
    if (!this.recoveryIntervalId) {
      this.startProviderRecovery();
    }
  }

  /**
   * Start background provider recovery mechanism
   * @private
   */
  private startProviderRecovery(): void {
    if (this.recoveryIntervalId) {
      return; // Already running
    }

    log.info('Starting background provider recovery (5min intervals)');

    this.recoveryIntervalId = setInterval(async () => {
      await this.retryFailedProviders();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Retry failed providers in background
   */
  async retryFailedProviders(): Promise<void> {
    if (this.failedProviders.size === 0) {
      return;
    }

    if (process.env.TEST_ENV === 'true') {
      log.debug('Retrying failed providers', { count: this.failedProviders.size });
    }

    const currentTime = Date.now();
    const retryDelay = 5 * 60 * 1000; // 5 minutes

    for (const [providerAddress, info] of this.failedProviders.entries()) {
      // Skip if attempted recently
      if (currentTime - info.lastAttempt < retryDelay) {
        continue;
      }

      // Skip if too many attempts (max 3)
      if (info.attempts >= 3) {
        if (process.env.TEST_ENV === 'true') {
          log.warn('Giving up on provider after 3 attempts', { model: info.modelName });
        }
        this.failedProviders.delete(providerAddress);
        continue;
      }

      try {
        const masterBroker = masterWallet.getBroker();
        await Promise.race([
          masterBroker.inference.acknowledgeProviderSigner(providerAddress),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 15000)
          )
        ]);

        // Success - move to acknowledged
        this.acknowledgedProviders.add(providerAddress);
        this.failedProviders.delete(providerAddress);

        if (process.env.TEST_ENV === 'true') {
          log.info('Recovered provider', { model: info.modelName, provider: providerAddress });
        }
      } catch (error) {
        // Update attempt info
        this.failedProviders.set(providerAddress, {
          ...info,
          lastAttempt: currentTime,
          attempts: info.attempts + 1
        });

        if (process.env.TEST_ENV === 'true') {
          log.debug('Provider still unavailable', {
            model: info.modelName,
            attempt: `${info.attempts + 1}/3`
          });
        }
      }
    }

    // Stop recovery if no more failed providers
    if (this.failedProviders.size === 0 && this.recoveryIntervalId) {
      clearInterval(this.recoveryIntervalId);
      this.recoveryIntervalId = null;
      log.info('All providers recovered - stopping background recovery');
    }
  }

  async cleanup(): Promise<void> {
    // Stop recovery mechanism
    if (this.recoveryIntervalId) {
      clearInterval(this.recoveryIntervalId);
      this.recoveryIntervalId = null;
    }

    this.availableServices = [];
    this.acknowledgedProviders.clear();
    this.failedProviders.clear();
    await masterWallet.cleanup();
  }


  async getBalance(walletAddress: string): Promise<any> {
    const balance = await masterWallet.getWalletInfo();
    return { balance };
  }
}

module.exports = new AIService(); 