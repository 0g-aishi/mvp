# 0G Compute Backend

**Decentralized AI Inference Service** - TypeScript/Express.js proxy for 0G Network with Google Gemini AI integration, virtual brokers, and advanced rate limiting system.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![0G Network](https://img.shields.io/badge/0G%20Network-Testnet-orange.svg)](https://0g.ai/)

## 🚀 Quick Start

```bash
# From the repository root (installs this workspace + the rest of Aishi)
npm install

# Development (WSL recommended)
npm run dev:wsl

# Production
npm run build && npm start
```

**Server will be available at:** `http://localhost:3001`

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [Gemini AI Profiles](#-gemini-ai-profiles)
- [Configuration](#-configuration)
- [Development](#-development)
- [Rate Limiting](#-rate-limiting)
- [Troubleshooting](#-troubleshooting)

---

## 🏗️ Architecture

### Component Structure

```
0g-compute/
├── src/
│   ├── server.ts                    # Main Express server + middleware
│   ├── routes/api.ts               # 19 REST API endpoints
│   ├── services/
│   │   ├── aiService.ts            # Proxy → 0G Network
│   │   ├── geminiService.ts        # Google Vertex AI (3 profiles)
│   │   ├── virtualBrokers.ts       # Virtual broker system
│   │   ├── masterWallet.ts         # Centralized payment management
│   │   ├── queryManager.ts         # AI query queueing
│   │   └── consolidationChecker.ts # Auto data consolidation
│   ├── middleware/rateLimiter.ts   # 6-tier rate limiting
│   ├── database/database.ts        # SQLite + virtual broker management
│   └── config/envLoader.ts         # Centralized .env loading
├── test-gemini-profiles.js         # Interactive profile tester
└── data/brokers.db                 # SQLite database
```

### Data Flow

```
Frontend → ModelSelector → Backend Router
                             ↓
            ┌─────────────────────────────────┐
            │     /api/models/discover        │
            │     (all available models)      │
            └─────────────────────────────────┘
                             ↓
        ┌─────────────────────────────────────────┐
        │              Model Type?                 │
        └─────────────────────────────────────────┘
                  ↓                        ↓
           [Decentralized]            [Centralized]
                  ↓                        ↓
        /api/0g-compute              /api/gemini
                  ↓                        ↓
        aiService.processQuery()    geminiService.generateContent()
                  ↓                        ↓
           0G Network              Google Vertex AI
```

---

## 📡 API Endpoints

### 🏥 Health & Status

| Endpoint | Method | Description | Rate Limit |
|----------|---------|-------------|------------|
| `/api/health` | GET | Basic health check | - |
| `/api/status` | GET | Detailed service status | - |
| `/api/queue-status` | GET | Query processing queue | - |

### 👤 Broker Management

#### `POST /api/create-broker`
**Rate Limit:** 3 requests/hour per IP

```json
// Request
{
  "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556"
}

// Response
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556",
    "balance": 0,
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Virtual broker created successfully"
}
```

#### `POST /api/fund`
**Rate Limit:** 5 requests/10min per IP

```json
// Request
{
  "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556",
  "amount": 100.5,
  "txHash": "0xabc...def"
}

// Response
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556",
    "balance": 100.5,
    "transactions": [...]
  }
}
```

#### `GET /api/balance/:walletAddress`

```json
// Response
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556",
    "balance": 95.25,
    "transactions": [
      {
        "id": 1,
        "type": "funding",
        "amount": 100.5,
        "timestamp": "2025-01-15T10:00:00.000Z",
        "txHash": "0xabc...def"
      },
      {
        "id": 2,
        "type": "ai_query",
        "amount": -5.25,
        "timestamp": "2025-01-15T10:15:00.000Z",
        "model": "deepseek-r1-70b"
      }
    ]
  }
}
```

### 🤖 AI Models

#### `GET /api/models/discover`

```json
// Response
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "deepseek-r1-70b",
        "name": "DeepSeek R1 70B",
        "type": "decentralized",
        "provider": "0G Network",
        "verifiability": "TeeML",
        "inputPrice": "0.0001",
        "outputPrice": "0.0002",
        "available": true,
        "badge": "Verified"
      },
      {
        "id": "gemini-2.5-flash-thinking",
        "name": "Gemini 2.5 Flash (Thinking)",
        "type": "centralized",
        "provider": "Google Vertex AI",
        "verifiability": "none",
        "inputPrice": "0",
        "outputPrice": "0",
        "available": true,
        "badge": "Smart"
      }
    ]
  }
}
```

### 🧠 AI Processing

#### `POST /api/0g-compute` (0G Network Models)
**Rate Limit:** 20 requests/min per IP

```json
// Request
{
  "walletAddress": "0x742d35Cc697d3b1b3d61c3B30b8c9A146F6eF556",
  "query": "Analyze this dream: I was flying over mountains and felt completely free..."
}

// Response
{
  "success": true,
  "data": {
    "response": "This dream suggests a desire for freedom and transcendence...",
    "model": "deepseek-r1-70b",
    "cost": 0.05,
    "processingTime": 1500,
    "provider": "0G Network",
    "verifiability": "TeeML"
  }
}
```

#### `POST /api/gemini` (Google Gemini Models)
**Rate Limit:** 20 requests/min per IP

```json
// Request
{
  "prompt": "Explain quantum computing in simple terms",
  "profile": "thinking",  // or "fast", "auto"
  "temperature": 0.8,
  "maxTokens": 2000
}

// Response  
{
  "success": true,
  "data": "Quantum computing harnesses quantum mechanical phenomena...",
  "metadata": {
    "model": "gemini-2.5-flash",
    "profile": "thinking (Deep Reasoning)",
    "responseTime": 2100,
    "promptTokenCount": 45,
    "candidatesTokenCount": 567,
    "totalTokenCount": 612,
    "thinkingEnabled": true,
    "thinkingBudget": 12288
  },
  "message": "Gemini response generated successfully using thinking (Deep Reasoning)"
}
```

---

## 🧠 Gemini AI Profiles

### Available Profiles

| Profile | Name | Thinking Budget | Temperature | Use Case |
|---------|------|----------------|-------------|----------|
| `thinking` | Deep Reasoning | 12288 (50% max) | 0.8 | Complex analysis, reasoning |
| `fast` | Speed Mode | 0 (disabled) | 0.9 | Quick responses, high throughput |
| `auto` | Adaptive Mode | -1 (auto) | 0.8 | Automatic complexity adjustment |

### Profile Testing

Use the interactive tester:

```bash
node test-gemini-profiles.js
```

**Available options:**
- 🧠 Test Profile: thinking
- ⚡ Test Profile: fast  
- 🎯 Test Profile: auto
- 🏁 Compare All Profiles Performance
- 🔍 Test Model ID Extraction
- 📋 View Available Profiles
- 🩺 Check Backend Status
- 🎨 Custom Query Test

#### `GET /api/gemini/profiles`

```json
{
  "success": true,
  "data": {
    "profiles": {
      "thinking": {
        "name": "Deep Reasoning",
        "description": "Optimized for complex reasoning and analysis",
        "temperature": 0.8,
        "thinkingEnabled": true,
        "thinkingBudget": 12288
      },
      "fast": {
        "name": "Speed Mode",
        "description": "Optimized for quick responses and high throughput", 
        "temperature": 0.9,
        "thinkingEnabled": false,
        "thinkingBudget": 0
      }
    },
    "count": 3,
    "defaultProfile": "auto"
  }
}
```

---

## ⚙️ Configuration

### Required Environment Variables

**Google Vertex AI / Gemini:**
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
VERTEX_AI_PROJECT=your-gcp-project-id  
VERTEX_AI_LOCATION=us-central1
```

**0G Network:**
```env
PRIVATE_KEY=0x1234567890abcdef...  # Master Wallet private key
MODEL_PICKED=deepseek-r1-70b       # Default model for 0G queries
```

### Optional Environment Variables

```env
# Development
TEST_ENV=true                       # Enables debug logging
NODE_ENV=development
PORT=3001

# Logging
LOG_LEVEL=info                      # info, debug, warn, error

# External env loading
ENV_FILE_PATH=/external/path/.env   # Path to external .env file
```

### Setup Commands

```bash
# WSL Development (recommended)
npm run dev:wsl

# Windows Development  
npm run dev:windows

# Auto-detect environment
npm run dev

# Rebuild native dependencies (SQLite)
npm run rebuild

# Complete setup
npm run setup           # Auto-detect
npm run setup:wsl       # WSL specific
npm run setup:windows   # Windows specific
```

### External Environment Files

Project supports external .env files for security:

```bash
# Set external env path
export ENV_FILE_PATH="/mnt/c/Users/kubas/Desktop/env/dreamscape/.env"

# Then run normally
npm run dev
```

---

## 🔧 Development

### Available Commands

```bash
npm run dev          # Development server (ts-node, port 3001)
npm run dev:wsl      # Development with WSL environment variables
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled version from dist/
npm run test         # Build + Start
npm run rebuild      # Rebuild better-sqlite3 (if native bindings fail after install)
```

### Development Structure

```bash
# Terminal 1: Backend 0g-compute
cd 0g-compute
npm run dev:wsl

# Terminal 2: Frontend app  
cd ../app
npm run dev

# Terminal 3: Gemini testing
cd 0g-compute  
node test-gemini-profiles.js
```

### Debug Mode

```env
TEST_ENV=true
```

**Debug logs include:**
- Detailed request/response logging
- Token count tracking for Gemini
- Performance timing
- Profile selection decisions
- Error stack traces

### Database Management

**SQLite Database:** `data/brokers.db`

```sql
-- Virtual brokers table
CREATE TABLE brokers (
  walletAddress TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  createdAt TEXT,
  lastActivity TEXT,
  totalSpent REAL DEFAULT 0
);

-- Transactions table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  walletAddress TEXT,
  type TEXT,
  amount REAL,
  timestamp TEXT,
  txHash TEXT,
  model TEXT,
  FOREIGN KEY (walletAddress) REFERENCES brokers (walletAddress)
);
```

---

## 🛡️ Rate Limiting

### Rate Limit Tiers

| Limiter | Endpoint | Limit | Window | Purpose |
|---------|----------|-------|--------|---------|
| `generalLimiter` | `/api/*` | 100 req | 15 min | General protection |
| `aiQueryLimiter` | `/api/0g-compute`, `/api/gemini` | 20 req | 1 min | AI processing |
| `brokerCreationLimiter` | `/api/create-broker` | 3 req | 1 hour | Broker creation |
| `fundingLimiter` | `/api/fund` | 5 req | 10 min | Funding operations |
| `costEstimationLimiter` | `/api/estimate-cost` | 20 req | 5 min | Cost calculations |
| `strictLimiter` | `/api/consolidation/start`, `/api/consolidation/stop` | 5 req | 15 min | System operations |

### Rate Limit Headers

All responses include draft-8 compliant headers:

```
RateLimit-Policy: 20;w=60
RateLimit-Limit: 20  
RateLimit-Remaining: 15
RateLimit-Reset: 1642678800
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Segmentation Fault (exit code 139)

```bash
# Solution: rebuild SQLite native dependencies
npm run rebuild
```

#### 2. Gemini Authentication Error

```bash
# Check service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
gcloud auth application-default print-access-token  # test
```

#### 3. Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 60
}
```

**Solution:** Check appropriate rate limits and adjust request frequency.

#### 4. Fast Profile Performance Issue

**Problem:** Fast profile (22.4s) slower than thinking (21.7s)
**Status:** Known issue with `thinkingBudget: 0` in some SDK versions
**Workaround:** Use `auto` profile for quick responses

#### 5. 0G Network Connection Issues

```bash
# Check network availability
curl -X GET "https://evmrpc-testnet.0g.ai"

# Check Master Wallet balance
curl -X POST "https://evmrpc-testnet.0g.ai" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_MASTER_WALLET_ADDRESS","latest"],"id":1}'
```

### Debug Commands

```bash
# Check service status
curl http://localhost:3001/api/status

# Test Gemini profiles
curl -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test message","profile":"fast"}'

# Check rate limits (see headers in response)
curl -I http://localhost:3001/api/health
```

### Logs and Monitoring

**Log Location:** Console output (stdout/stderr)

**Log Filtering:**
```bash
# Errors only
npm run dev:wsl 2>&1 | grep -i error

# Gemini activity only
npm run dev:wsl 2>&1 | grep -i gemini

# Performance timing
npm run dev:wsl 2>&1 | grep -i "response.*ms"
```

---

## 🌐 Network Information

**0G Network Testnet (Galileo):**
- **Chain ID:** 16602
- **RPC URL:** `https://evmrpc-testnet.0g.ai`
- **Faucet:** `https://faucet.0g.ai`
- **Explorer:** `https://explorer-testnet.0g.ai`

**Model Pricing (estimated):**
- DeepSeek R1 70B: ~$0.0001/1K input tokens
- Llama 3.3 70B: ~$0.0002/1K input tokens  
- Gemini 2.5 Flash: Free (Vertex AI credits)

---

## 📚 Additional Resources

- **0G Network Docs:** https://docs.0g.ai
- **Google Vertex AI:** https://cloud.google.com/vertex-ai/docs
- **Express Rate Limiting:** https://express-rate-limit.mintlify.app
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

---

## 📄 License

This project is part of the Dreamscape iNFT ecosystem.

---

*Last updated: 2025-01-15*