/**
 * @fileoverview Main server entry point for Dreamscape 0G Compute Backend
 * @description Initializes Express server with security middleware, API routes, and all core services.
 * Handles service initialization, graceful shutdown, and global error handling.
 */

const express: typeof import('express') = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('./config/envLoader');
const apiRoutes = require('./routes/api');
const { generalLimiter } = require('./middleware/rateLimiter');
const aiService = require('./services/aiService');
const masterWallet = require('./services/masterWallet');
const virtualBrokers = require('./services/virtualBrokers');
const queryManager = require('./services/queryManager');
const consolidationChecker = require('./services/consolidationChecker');
const geminiService = require('./services/geminiService');
const { createLogger } = require('./lib/logger');

const log = createLogger('Server');

const expressApplication = express();
const SERVER_PORT = process.env.PORT || 3001;

// Trust proxy headers from Nginx (localhost) and Cloudflare
// Using specific number of proxies for security
expressApplication.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

expressApplication.use(helmet());
expressApplication.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3003',
  credentials: true
}));

expressApplication.use('/api', generalLimiter);

expressApplication.use(express.json({ limit: '10mb' }));
expressApplication.use(express.urlencoded({ extended: true }));

expressApplication.use((request, response, next) => {
  if (process.env.TEST_ENV === 'true') {
    log.debug(`${request.method} ${request.path}`);
  }
  next();
});

expressApplication.use('/api', apiRoutes);

expressApplication.get('/', (request, response) => {
  response.json({
    service: 'Dreamscape 0G Compute Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      'create-broker': 'POST /api/create-broker',
      'fund': 'POST /api/fund',
      'balance': 'GET /api/balance/:walletAddress',
      '0g-compute': 'POST /api/0g-compute',
      'models': 'GET /api/models',
      'master-wallet-address': 'GET /api/master-wallet-address',
      'estimate-cost': 'POST /api/estimate-cost',
      'consolidation-status': 'GET /api/consolidation/:walletAddress',
      'consolidation-check': 'POST /api/consolidation/check',
      'consolidation-start': 'POST /api/consolidation/start',
      'consolidation-stop': 'POST /api/consolidation/stop',
      'transactions': 'GET /api/transactions/:walletAddress',
      'gemini': 'POST /api/gemini',
      'gemini-status': 'GET /api/gemini/status',
      'voice-intent': 'POST /api/voice/intent',
      'voice-transcribe': 'POST /api/voice/transcribe',
      'voice-synthesize': 'POST /api/voice/synthesize',
      'voice-interact': 'POST /api/voice/interact',
      'voice-voices': 'GET /api/voice/voices',
      'voice-status': 'GET /api/voice/status'
    }
  });
});

expressApplication.use('*', (request, response) => {
  response.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: request.originalUrl,
    timestamp: new Date().toISOString()
  });
});

expressApplication.use((errorObject: any, request: any, response: any, next: any) => {
  log.error('Unhandled error', { error: errorObject });

  response.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: errorObject.stack })
  });
});

/**
 * Initialize all backend services in proper order
 * @returns {Promise<void>}
 */
async function initializeAllBackendServices() {
  log.info('Starting Aishi compute API');

  try {
    const optionalStarts: Promise<unknown>[] = [];

    const geminiReady = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      process.env.VERTEX_AI_PROJECT &&
      process.env.VERTEX_AI_LOCATION
    );
    if (geminiReady) {
      optionalStarts.push(geminiService.initialize());
    }

    if (masterWallet.isConfigured()) {
      optionalStarts.push(aiService.initializeWithTimeout(10000));
    }

    if (optionalStarts.length > 0) {
      const results = await Promise.allSettled(optionalStarts);
      for (const result of results) {
        if (result.status === 'rejected') {
          log.warn('Optional AI provider not ready', { error: result.reason?.message });
        }
      }
    }

    if (masterWallet.isConfigured()) {
      await masterWallet.startTransactionMonitor(async (senderAddress: string, transactionAmount: number, transactionHash: string) => {
        try {
          await virtualBrokers.processFundingTransaction(senderAddress, transactionAmount, transactionHash);
          log.info(`Auto-funded broker ${senderAddress} with ${transactionAmount} OG`);
        } catch (error: any) {
          log.error(`Failed to auto-fund broker ${senderAddress}`, { error: error.message });
        }
      });
    }

    log.info('Configuration:', {
      masterWallet: masterWallet.isConfigured() ? masterWallet.getWalletAddress() : 'not configured',
      rpcUrl: process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai',
      database: process.env.DATABASE_PATH || './data/brokers.db',
      port: SERVER_PORT,
      environment: process.env.NODE_ENV || 'development',
      maxConcurrentQueries: process.env.MAX_CONCURRENT_QUERIES || '5'
    });

    const currentQueueStatus = queryManager.getQueueStatus();
    log.info('Query Manager ready', {
      queueLength: currentQueueStatus.queueLength,
      activeQueries: `${currentQueueStatus.activeQueries}/${currentQueueStatus.maxConcurrent}`
    });

    const consolidationCheckIntervalMinutes = parseInt(process.env.CONSOLIDATION_CHECK_INTERVAL_MINUTES || '60');
    consolidationChecker.startChecker(consolidationCheckIntervalMinutes);
    log.info('Consolidation Checker started', { intervalMinutes: consolidationCheckIntervalMinutes });

  } catch (error: any) {
    log.error('Service initialization had errors; HTTP API will still start', { error: error.message });
  }
}

process.on('SIGTERM', performGracefulShutdown);
process.on('SIGINT', performGracefulShutdown);

/**
 * Perform graceful shutdown of all services
 * @returns {Promise<void>}
 */
async function performGracefulShutdown() {
  log.info('Graceful shutdown initiated');

  try {
    log.info('Stopping Consolidation Checker');
    consolidationChecker.stopChecker();

    log.info('Cleaning up Query Manager');
    /* QueryManager cleanup would happen here if needed */

    await aiService.cleanup();
    await geminiService.cleanup();
    await masterWallet.cleanup();

    log.info('Services cleaned up successfully');
    process.exit(0);
  } catch (error: any) {
    log.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

/**
 * Start the Express server and initialize all services
 * @returns {Promise<void>}
 */
async function startExpressServer() {
  try {
    await initializeAllBackendServices();

    const httpServer = expressApplication.listen(SERVER_PORT, () => {
      log.info(`Aishi compute API on http://localhost:${SERVER_PORT}`);
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      log.error('Failed to bind HTTP port', { error: error.message, port: SERVER_PORT });
      process.exit(1);
    });

  } catch (error: any) {
    log.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('uncaughtException', (uncaughtError) => {
  log.error('Uncaught Exception', { error: uncaughtError });
  process.exit(1);
});

process.on('unhandledRejection', (rejectionReason, rejectedPromise) => {
  log.error('Unhandled Rejection', { reason: rejectionReason, promise: rejectedPromise });
  process.exit(1);
});

startExpressServer();

module.exports = expressApplication; 