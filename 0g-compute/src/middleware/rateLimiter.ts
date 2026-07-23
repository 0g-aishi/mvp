/**
 * @fileoverview Express rate limiting middleware for API protection
 * @description Implements multiple rate limiting strategies for different endpoint types,
 * including general API protection, AI query throttling, broker creation limits,
 * and sensitive endpoint restrictions. Uses modern RateLimit headers (draft-8).
 */

const rateLimit = require('express-rate-limit');
const { createLogger } = require('../lib/logger');

const log = createLogger('RateLimiter');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  validate: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    log.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again in 15 minutes.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

const aiQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 20,
  validate: false,
  message: {
    success: false,
    error: 'Too many AI requests. AI processing is limited to 20 requests per minute.',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: any, res: any) => {
    log.warn('AI query rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. AI processing is limited to 20 requests per minute.',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString()
    });
  }
});

const brokerCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  validate: false,
  message: {
    success: false,
    error: 'Too many broker creation attempts. Limited to 3 per hour.',
    retryAfter: '1 hour',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    log.warn('Broker creation rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: 'Too many broker creation attempts. Limited to 3 per hour.',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
});

const costEstimationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  validate: false,
  message: {
    success: false,
    error: 'Too many cost estimation requests. Limited to 20 per 5 minutes.',
    retryAfter: '5 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    log.warn('Cost estimation rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: 'Too many cost estimation requests. Limited to 20 per 5 minutes.',
      retryAfter: '5 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

const fundingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  validate: false,
  message: {
    success: false,
    error: 'Too many funding requests. Limited to 5 per 10 minutes.',
    retryAfter: '10 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    log.warn('Funding rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: 'Too many funding requests. Limited to 5 per 10 minutes.',
      retryAfter: '10 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  validate: false,
  message: {
    success: false,
    error: 'Rate limit exceeded for sensitive endpoint. Limited to 5 requests per 15 minutes.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    log.warn('Strict rate limit exceeded', { ip: req.ip, endpoint: req.path });
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for sensitive endpoint. Limited to 5 requests per 15 minutes.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  generalLimiter,
  aiQueryLimiter,
  brokerCreationLimiter,
  costEstimationLimiter,
  fundingLimiter,
  strictLimiter
};

