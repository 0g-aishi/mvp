const express: typeof import('express') = require('express');
const virtualBrokers = require('../services/virtualBrokers');
const aiService = require('../services/aiService');
const masterWallet = require('../services/masterWallet');
const queryManager = require('../services/queryManager');
const consolidationChecker = require('../services/consolidationChecker');
const DatabaseService = require('../database/database');
const geminiService = require('../services/geminiService');
const GeminiService = geminiService.GeminiService;
const speechToTextService = require('../services/speechToTextService');
const textToSpeechService = require('../services/textToSpeechService');
const voiceService = require('../services/voiceService');
const {
  aiQueryLimiter,
  brokerCreationLimiter,
  costEstimationLimiter,
  fundingLimiter,
  strictLimiter
} = require('../middleware/rateLimiter');
const { createLogger } = require('../lib/logger');

const log = createLogger('API');
const router = express.Router();

// Helper function for error responses
const handleError = (res: any, error: any, defaultMessage: string) => {
  const message = error.message || defaultMessage;
  const statusCode = error.statusCode || 500;

  log.error('API Error', { message });
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

// Helper function for success responses
const handleSuccess = (res: any, data: any, message?: string) => {
  res.json({
    success: true,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  });
};

/**
 * POST /api/create-broker
 * Creates a new virtual broker for user
 * PROTECTED: Limited to 3 creations per hour per IP
 */
router.post('/create-broker', brokerCreationLimiter, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
        timestamp: new Date().toISOString()
      });
    }

    const broker = await virtualBrokers.createBroker(walletAddress);

    if (process.env.TEST_ENV === 'true') {
      log.info('Created broker', { walletAddress });
    }

    handleSuccess(res, broker, 'Virtual broker created successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to create virtual broker');
  }
});

/**
 * POST /api/fund
 * Funds a virtual broker account
 * PROTECTED: Limited to 5 funding operations per 10 minutes per IP
 */
router.post('/fund', fundingLimiter, async (req, res) => {
  try {
    const { walletAddress, amount, txHash } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress and amount are required',
        timestamp: new Date().toISOString()
      });
    }

    const broker = await virtualBrokers.fundBroker({
      walletAddress,
      amount: parseFloat(amount),
      txHash
    });

    if (process.env.TEST_ENV === 'true') {
      log.info('Funded broker', { walletAddress, amount });
    }

    handleSuccess(res, broker, 'Broker funded successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to fund broker');
  }
});

/**
 * GET /api/balance/:walletAddress
 * Checks broker balance and transaction history
 */
router.get('/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
        timestamp: new Date().toISOString()
      });
    }

    const balance = await virtualBrokers.checkBalance(walletAddress);

    if (process.env.TEST_ENV === 'true') {
      log.info('Balance check', { walletAddress, balance: balance.balance });
    }

    handleSuccess(res, balance, 'Balance retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve balance');
  }
});

/**
 * POST /api/0g-compute
 * Main endpoint for 0G Network AI processing (dreams, chats, etc.)
 * PROTECTED: Limited to 20 AI queries per minute per IP
 * Accepts modelId from frontend for dynamic model selection
 */
router.post('/0g-compute', aiQueryLimiter, async (req, res) => {
  try {
    const { walletAddress, query, modelId } = req.body;

    if (!walletAddress || !query) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress and query are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate not zero address (indicates frontend bug - wallet not connected/synced)
    if (walletAddress === '0x0000000000000000000000000000000000000000') {
      log.error('Zero address detected in 0G compute request');
      log.error('This indicates wallet not connected or agent not synced in frontend');
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address (zero address). Please ensure wallet is connected and agent is synced before using 0G Network models.',
        timestamp: new Date().toISOString()
      });
    }

    // Use modelId from frontend if provided, fallback to env variable
    const selectedModel = modelId || process.env.MODEL_PICKED || 'llama-3.3-70b-instruct';

    if (process.env.TEST_ENV === 'true') {
      log.info('Model selection', { requested: modelId, using: selectedModel });
    }
    
    const result = await queryManager.processQuery(
      walletAddress,
      query,
      selectedModel
    );

    if (process.env.TEST_ENV === 'true') {
      log.info('AI analysis completed', { walletAddress, model: selectedModel });
    }

    // Unified response format (consistent with Gemini endpoint)
    // Main content in 'data' field (string), metadata in 'metadata' object
    const responseText = result.response || '';
    const metadata = {
      model: result.model || selectedModel,
      responseTime: result.responseTime || 0,
      cost: result.cost || 0,
      chatId: result.chatId,
      isValid: result.isValid || false,
      queryId: result.queryId,
      modelUsed: selectedModel,
      modelSource: modelId ? 'frontend' : 'env_default',
      provider: '0G Network'
    };

    // Return in unified format (data = string, metadata = object)
    res.json({
      success: true,
      data: responseText,
      metadata: metadata,
      message: 'AI processing completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    handleError(res, error, 'Failed to process AI query');
  }
});

/**
 * GET /api/models
 * Gets available AI models and services
 */
router.get('/models', async (req, res) => {
  try {
    const models = await aiService.getAvailableModels();

    if (process.env.TEST_ENV === 'true') {
      log.info('Retrieved available models', { count: models.models.length });
    }

    handleSuccess(res, models, 'Available models retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve available models');
  }
});

/**
 * GET /api/models/discover
 * Discovers available models from 0G Network and includes Gemini
 */
router.get('/models/discover', async (req, res) => {
  try {
    // Get discovered services from 0G Network
    const discoveredServices = await aiService.discoverServices();
    
    // Format models for frontend
    const models = [
      // Decentralized models from 0G Network
      ...discoveredServices.map((service: any) => ({
        id: service.model,
        name: service.model,
        provider: service.provider,
        providerAddress: service.provider, // Add providerAddress for backend execution
        type: 'decentralized',
        verifiability: service.verifiability,
        inputPrice: service.inputPrice.toString(),
        outputPrice: service.outputPrice.toString(),
        available: service.isAvailable,
        badge: service.verifiability === 'TeeML' ? 'Verified' : null
      })),
      // Centralized Gemini models with different profiles
      {
        id: 'gemini-2.5-flash-thinking',
        name: 'Gemini 2.5 Flash (Thinking)',
        provider: 'Google Vertex AI',
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized',
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Smart'
      },
      {
        id: 'gemini-2.5-flash-fast',
        name: 'Gemini 2.5 Flash (Fast)',
        provider: 'Google Vertex AI', 
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized',
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Speed'
      },
      {
        id: 'gemini-2.5-flash-auto',
        name: 'Gemini 2.5 Flash (Auto)',
        provider: 'Google Vertex AI',
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized', 
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Adaptive'
      }
    ];

    if (process.env.TEST_ENV === 'true') {
      log.info('Models discovered', { decentralizedCount: discoveredServices.length });
    }

    handleSuccess(res, { models }, 'Models discovered successfully');
  } catch (error: any) {
    // On error, still return Gemini as fallback
    log.error('Failed to discover 0G models, returning Gemini only', { error: error.message });
    
    const fallbackModels = [
      {
        id: 'gemini-2.5-flash-thinking',
        name: 'Gemini 2.5 Flash (Thinking)',
        provider: 'Google Vertex AI',
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized',
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Fallback'
      },
      {
        id: 'gemini-2.5-flash-fast',
        name: 'Gemini 2.5 Flash (Fast)',
        provider: 'Google Vertex AI',
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized',
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Fallback'
      },
      {
        id: 'gemini-2.5-flash-auto',
        name: 'Gemini 2.5 Flash (Auto)',
        provider: 'Google Vertex AI',
        providerAddress: null, // Centralized models don't have providerAddress
        type: 'centralized',
        verifiability: 'none',
        inputPrice: '0',
        outputPrice: '0',
        available: true,
        badge: 'Fallback'
      }
    ];
    
    handleSuccess(res, { models: fallbackModels }, 'Using fallback model');
  }
});

/**
 * GET /api/status
 * Gets service status and health check
 */
router.get('/status', async (req, res) => {
  try {
    const [aiStatus, brokersSummary, walletInfo, queueStatus] = await Promise.all([
      aiService.getServiceStatus(),
      virtualBrokers.getAllBrokers(),
      masterWallet.getWalletInfo(),
      Promise.resolve(queryManager.getQueueStatus())
    ]);

    const status = {
      service: {
        name: 'Dreamscape 0G Compute',
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        isReady: aiStatus.isReady
      },
      ai: aiStatus,
      brokers: brokersSummary,
      masterWallet: walletInfo,
      queryManager: queueStatus
    };

    if (process.env.TEST_ENV === 'true') {
      log.info('Service status retrieved');
    }

    handleSuccess(res, status, 'Service status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve service status');
  }
});

/**
 * GET /api/master-wallet-address
 * Gets the Master Wallet address for funding
 */
router.get('/master-wallet-address', async (req, res) => {
  try {
    const address = masterWallet.getWalletAddress();

    if (process.env.TEST_ENV === 'true') {
      log.info('Master wallet address requested', { address });
    }

    handleSuccess(res, { address }, 'Master wallet address retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve master wallet address');
  }
});

/**
 * POST /api/estimate-cost
 * Estimates cost for AI query
 * PROTECTED: Limited to 20 cost estimations per 5 minutes per IP
 */
router.post('/estimate-cost', costEstimationLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
        timestamp: new Date().toISOString()
      });
    }

    // Backend zawsze używa MODEL_PICKED z .env
    const selectedModel = process.env.MODEL_PICKED || 'llama-3.3-70b-instruct';
    const cost = virtualBrokers.estimateQueryCost(query, selectedModel);

    if (process.env.TEST_ENV === 'true') {
      log.info('Cost estimation', { cost, model: selectedModel });
    }

    handleSuccess(res, { 
      estimatedCost: cost,
      model: selectedModel,
      queryLength: query.length,
      note: 'This is an approximate cost - actual cost may vary and will be calculated dynamically'
    }, 'Cost estimated successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to estimate cost');
  }
});

/**
 * GET /api/transactions/:walletAddress
 * Gets transaction history for a wallet
 */
router.get('/transactions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
        timestamp: new Date().toISOString()
      });
    }

    const balance = await virtualBrokers.checkBalance(walletAddress);

    if (process.env.TEST_ENV === 'true') {
      log.info('Transaction history', { walletAddress });
    }

    handleSuccess(res, {
      walletAddress: balance.walletAddress,
      transactions: balance.transactions.slice(0, limit)
    }, 'Transaction history retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve transaction history');
  }
});

/**
 * GET /api/queue-status
 * Gets query processing queue status
 */
router.get('/queue-status', (req, res) => {
  try {
    const queueStatus = queryManager.getQueueStatus();

    if (process.env.TEST_ENV === 'true') {
      log.info('Queue status retrieved');
    }

    handleSuccess(res, queueStatus, 'Queue status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve queue status');
  }
});

/**
 * GET /api/consolidation/:walletAddress
 * Gets consolidation status for a broker
 */
router.get('/consolidation/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
        timestamp: new Date().toISOString()
      });
    }

    const consolidationStatus = DatabaseService.getConsolidationStatus(walletAddress);

    if (!consolidationStatus) {
      return res.status(404).json({
        success: false,
        error: 'Broker not found',
        timestamp: new Date().toISOString()
      });
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('Consolidation status', { walletAddress });
    }

    handleSuccess(res, consolidationStatus, 'Consolidation status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve consolidation status');
  }
});

/**
 * POST /api/consolidation/check
 * Manually trigger consolidation check
 */
router.post('/consolidation/check', async (req, res) => {
  try {
    const results = await consolidationChecker.performConsolidationCheck();
    
    const summary = {
      totalBrokers: results.length,
      monthUpdates: results.filter((r: any) => r.needsMonthLearning).length,
      yearUpdates: results.filter((r: any) => r.needsYearLearning).length,
      updatedBrokers: results.filter((r: any) => r.needsMonthLearning || r.needsYearLearning).map((r: any) => r.walletAddress),
      details: results
    };

    if (process.env.TEST_ENV === 'true') {
      log.info('Manual consolidation check completed', { monthUpdates: summary.monthUpdates, yearUpdates: summary.yearUpdates });
    }

    handleSuccess(res, summary, 'Consolidation check completed successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to perform consolidation check');
  }
});

/**
 * GET /api/consolidation/status
 * Gets consolidation checker service status
 */
router.get('/consolidation/status', (req, res) => {
  try {
    const status = consolidationChecker.getStatus();

    if (process.env.TEST_ENV === 'true') {
      log.info('Consolidation checker status retrieved');
    }

    handleSuccess(res, status, 'Consolidation checker status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve consolidation checker status');
  }
});

/**
 * POST /api/consolidation/start
 * Start the consolidation checker
 * PROTECTED: Sensitive system operation - Limited to 5 requests per 15 minutes per IP
 */
router.post('/consolidation/start', strictLimiter, (req, res) => {
  try {
    const { intervalMinutes } = req.body;
    const interval = intervalMinutes ? parseInt(intervalMinutes) : 60;
    
    consolidationChecker.startChecker(interval);

    if (process.env.TEST_ENV === 'true') {
      log.info('Consolidation checker started', { intervalMinutes: interval });
    }

    handleSuccess(res, { 
      isRunning: true, 
      intervalMinutes: interval 
    }, 'Consolidation checker started successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to start consolidation checker');
  }
});

/**
 * POST /api/consolidation/stop
 * Stop the consolidation checker
 * PROTECTED: Sensitive system operation - Limited to 5 requests per 15 minutes per IP
 */
router.post('/consolidation/stop', strictLimiter, (req, res) => {
  try {
    consolidationChecker.stopChecker();

    if (process.env.TEST_ENV === 'true') {
      log.info('Consolidation checker stopped');
    }

    handleSuccess(res, { isRunning: false }, 'Consolidation checker stopped successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to stop consolidation checker');
  }
});

/**
 * POST /api/gemini
 * Modern Gemini endpoint with dynamic profile selection
 * Supports 3 profiles: thinking, fast, auto (no .env dependency)
 * PROTECTED: Limited to 20 AI queries per minute per IP
 */
router.post('/gemini', aiQueryLimiter, async (req, res) => {
  try {
    const { prompt, profile, modelId, temperature, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Ensure Gemini service is initialized
    if (!geminiService.isReady()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI service is not ready',
        timestamp: new Date().toISOString()
      });
    }

    // Determine profile from explicit parameter or extract from modelId
    let selectedProfile = profile || 'auto'; // default to 'auto'
    
    if (modelId && !profile) {
      // Extract profile from modelId (e.g., "gemini-2.5-flash-thinking" → "thinking")
      selectedProfile = GeminiService.extractProfileFromModelId(modelId);
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('Gemini request received', {
        promptLength: prompt.length,
        profile: selectedProfile,
        source: modelId ? `extracted from ${modelId}` : 'explicit/default',
        temperature: temperature || 'default'
      });
    }

    // Forward request to modern Gemini service with profile
    const result = await geminiService.generateContentWithProfile(
      prompt,
      selectedProfile,
      {
        temperature,
        maxTokens
      }
    );

    if (process.env.TEST_ENV === 'true') {
      log.info('Gemini response received', {
        responseTime: result.metadata.responseTime,
        profile: result.metadata.profile,
        thinkingEnabled: result.metadata.thinkingEnabled,
        thinkingBudget: result.metadata.thinkingBudget
      });
    }

    // Return enhanced response with profile metadata
    res.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        selectedProfile,
        profileSource: modelId ? 'modelId' : (profile ? 'explicit' : 'default')
      },
      message: `Gemini response generated successfully using ${result.metadata.profile}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    handleError(res, error, 'Failed to generate Gemini response');
  }
});

/**
 * GET /api/gemini/profiles
 * Get available Gemini profiles information
 */
router.get('/gemini/profiles', (req, res) => {
  try {
    const profiles = geminiService.getAvailableProfiles();

    if (process.env.TEST_ENV === 'true') {
      log.info('Gemini profiles requested');
    }

    handleSuccess(res, { 
      profiles,
      count: Object.keys(profiles).length,
      defaultProfile: 'auto'
    }, 'Gemini profiles retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve Gemini profiles');
  }
});

/**
 * GET /api/gemini/status
 * Check Gemini service status with profile information
 */
router.get('/gemini/status', (req, res) => {
  try {
    const status = geminiService.getStatus();

    if (process.env.TEST_ENV === 'true') {
      log.info('Gemini service status retrieved');
    }

    handleSuccess(res, status, 'Gemini service status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve Gemini service status');
  }
});


/**
 * GET /api/voice/status
 * Check voice services status
 */
router.get('/voice/status', (req, res) => {
  try {
    const sttStatus = speechToTextService.getStatus();
    const ttsStatus = textToSpeechService.getStatus();
    const geminiStatus = geminiService.getStatus();

    const status = {
      speechToText: sttStatus,
      textToSpeech: ttsStatus,
      gemini: geminiStatus,
      overall: sttStatus.isReady && ttsStatus.isReady && geminiStatus.isReady
    };

    if (process.env.TEST_ENV === 'true') {
      log.info('Voice service status retrieved');
    }

    handleSuccess(res, status, 'Voice service status retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve voice service status');
  }
});

/**
 * POST /api/voice/transcribe
 * Convert audio to text using Gemini Live API with automatic language detection
 * PROTECTED: Limited to 20 queries per minute per IP
 */
router.post('/voice/transcribe', aiQueryLimiter, async (req, res) => {
  try {
    const { audioBuffer, inputFormat } = req.body;

    if (!audioBuffer || !inputFormat) {
      return res.status(400).json({
        success: false,
        error: 'audioBuffer and inputFormat are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!speechToTextService.isFormatSupported(inputFormat)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported audio format: ${inputFormat}. Supported: ${speechToTextService.getSupportedFormats().join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('STT request', { format: inputFormat, size: audioBuffer.length });
    }

    const sttResult = await speechToTextService.transcribeAudio({
      audioBuffer: Buffer.from(audioBuffer, 'base64'),
      inputFormat
    });

    if (process.env.TEST_ENV === 'true') {
      log.info('STT completed', { language: sttResult.detectedLanguage, confidence: sttResult.confidence });
    }

    handleSuccess(res, sttResult, 'Audio transcribed successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to transcribe audio');
  }
});

/**
 * POST /api/voice/synthesize
 * Convert text to speech using Gemini Live API with voice selection
 * PROTECTED: Limited to 20 queries per minute per IP
 */
router.post('/voice/synthesize', aiQueryLimiter, async (req, res) => {
  try {
    const { text, voiceId, detectedLanguage, languageCode, emotionalTone, speed } = req.body;

    log.info('TTS request received', {
      voiceId,
      textLength: text?.length,
      detectedLanguage,
      languageCode,
      emotionalTone,
      speed
    });

    if (!text) {
      log.error('No text provided for TTS');
      return res.status(400).json({
        success: false,
        error: 'text is required',
        timestamp: new Date().toISOString()
      });
    }

    const selectedVoice = voiceId || 'aoede'; // DEFAULT TO NEW VOICE!
    const availableVoices = textToSpeechService.getAvailableVoices().map((v: any) => v.id);

    log.info('Voice validation', {
      selectedVoice,
      availableVoices,
      isValid: availableVoices.includes(selectedVoice)
    });

    if (!availableVoices.includes(selectedVoice)) {
      log.error('Unsupported voice');
      return res.status(400).json({
        success: false,
        error: `Unsupported voice: ${selectedVoice}. Available: ${availableVoices.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('TTS request processing', { voice: selectedVoice, textLength: text.length, language: detectedLanguage || 'auto' });
    }

    const ttsResult = await textToSpeechService.synthesizeSpeech({
      text,
      voiceId: selectedVoice,
      detectedLanguage,
      languageCode,
      emotionalTone,
      speed
    });

    if (process.env.TEST_ENV === 'true') {
      log.info('TTS completed', { voice: ttsResult.voiceUsed, audioSize: ttsResult.audioBuffer.length });
    }

    // Return audio as base64 encoded string
    const audioBase64 = ttsResult.audioBuffer.toString('base64');

    handleSuccess(res, {
      audioData: audioBase64,
      format: ttsResult.format,
      duration: ttsResult.duration,
      voiceUsed: ttsResult.voiceUsed,
      detectedLanguage: ttsResult.detectedLanguage,
      processingTime: ttsResult.processingTime
    }, 'Text synthesized to speech successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to synthesize speech');
  }
});

/**
 * POST /api/voice/interact
 * Simple voice pipeline: Audio → Text (for processing elsewhere)
 * PROTECTED: Limited to 10 queries per minute per IP
 */
router.post('/voice/interact', strictLimiter, async (req, res) => {
  try {
    const { audioBuffer, inputFormat, voiceId } = req.body;

    if (!audioBuffer || !inputFormat) {
      return res.status(400).json({
        success: false,
        error: 'audioBuffer and inputFormat are required',
        timestamp: new Date().toISOString()
      });
    }

    if (process.env.TEST_ENV === 'true') {
      log.info('Voice to text conversion', { format: inputFormat });
    }

    // Simple STT conversion
    const sttResult = await voiceService.convertSpeechToText({
      audioBuffer: Buffer.from(audioBuffer, 'base64'),
      inputFormat,
      voiceId: voiceId || 'aria'
    });

    if (process.env.TEST_ENV === 'true') {
      log.info('Voice converted', { language: sttResult.detectedLanguage, time: sttResult.totalProcessingTime });
    }

    handleSuccess(res, sttResult, 'Voice converted to text successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to process voice input');
  }
});

/**
 * GET /api/voice/voices
 * Get available voice profiles for TTS
 */
router.get('/voice/voices', (req, res) => {
  try {
    const voices = textToSpeechService.getAvailableVoices();

    if (process.env.TEST_ENV === 'true') {
      log.info('Voice profiles requested', { available: voices.length });
    }

    handleSuccess(res, {
      voices,
      count: voices.length,
      supportedLanguages: '24+ languages with automatic detection'
    }, 'Voice profiles retrieved successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve voice profiles');
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 