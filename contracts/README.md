# Aishi Smart Contracts

## Overview

Smart contract implementation for the Aishi iNFT system featuring personality evolution, memory consolidation, and autonomous agent behavior on the 0G Network Galileo testnet.

## Architecture

### Smart Contracts
- **AishiAgent.sol** - Main iNFT contract implementing ERC-7857 standard with personality evolution mechanics
- **AishiVerifier.sol** - Ownership verification contract for secure agent operations

### ABI Management Pipeline
The project implements an automated ABI export and TypeScript generation workflow:
1. Contract deployment automatically exports ABI to frontend
2. Wagmi CLI generates fully-typed TypeScript interfaces
3. Centralized configuration provides type-safe contract access

## Prerequisites

- Node.js v18+
- npm or yarn
- WSL environment (for Windows users)
- Access to 0G Network Galileo testnet

## Installation

Dependencies are installed from the **repository root** (npm workspaces):

```bash
# From Aishi-master/
npm install
```

Do not run a separate `npm install` in this folder.

```bash
# External environment configuration (WSL)
# Place .env file at: /mnt/c/Users/kubas/Desktop/env/contracts/.env
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
WALLET_PRIVATE_KEY=your_private_key_here
TREASURY_ADDRESS=0x_treasury_wallet_address
DREAMSCAPE_TEST=true  # Enable test mode logging
```

The project uses external environment loading for security. Environment files are stored outside the repository at `/mnt/c/Users/kubas/Desktop/env/contracts/.env`.

## Available Commands

```bash
# Compilation
npm run compile         # Standard compilation
npm run compile:wsl     # Compilation with external .env

# Deployment
npm run deploy          # Deploy to Galileo testnet
npm run deploy:wsl      # Deploy with external .env
npm run deploy:local    # Deploy to local Hardhat network

# Testing
npm run test:complete     # Run complete test suite
npm run test:complete:wsl # Test with external .env
```

## Deployment Workflow

### Step 1: Deploy Smart Contracts

```bash
cd contracts/
npm run deploy:wsl
```

This command:
- Compiles all Solidity contracts
- Deploys AishiVerifier contract
- Deploys AishiAgent contract with verifier address
- Automatically exports ABI to `app/src/abi/AishiAgentABI.json`
- Generates deployment summary

Output structure:
```json
{
  "contractName": "AishiAgent",
  "address": "0x5Bc063f0eeFa5D90831FD2b4AF33D1529c993bFe",
  "network": "galileo",
  "chainId": 16602,
  "abi": [...],
  "deployedAt": "2024-11-23T15:30:45.123Z"
}
```

### Step 2: Generate TypeScript Types

```bash
cd ../app/
npm run generate-abi
```

This command:
- Reads exported ABI from `src/abi/AishiAgentABI.json`
- Generates `src/generated.ts` with typed interfaces
- Creates type-safe contract configurations

### Step 3: Frontend Integration

The frontend uses a centralized configuration pattern:

```typescript
// app/src/hooks/agentHooks/config/contractConfig.ts
import { aishiAgentAbi } from '../../../generated';

export const getContractConfig = () => ({
  address: process.env.NEXT_PUBLIC_AISHI_AGENT_ADDRESS || '0x5Bc...',
  abi: aishiAgentAbi,
  chainId: 16602
});
```

All hooks and services use this centralized configuration for consistency.

## Network Configuration

### Galileo Testnet
- **Chain ID**: 16602
- **RPC URL**: https://evmrpc-testnet.0g.ai
- **Explorer**: https://explorer-testnet.0g.ai
- **Faucet**: https://faucet.0g.ai

### Local Development
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545

## Project Structure

```
contracts/
├── contracts/           # Solidity smart contracts
│   ├── AishiAgent.sol
│   └── AishiVerifier.sol
├── scripts/            
│   ├── deploy/         # Deployment scripts
│   │   └── deploy-aishi.js
│   └── test-complete-suite.js
├── deployments/        # Deployment artifacts
├── hardhat.config.js   # Hardhat configuration
└── package.json        # Project dependencies
```

## Complete Development Flow

### Making Contract Changes

1. **Modify Contract**
   ```solidity
   // contracts/AishiAgent.sol
   function newFeature() public { ... }
   ```

2. **Compile and Deploy**
   ```bash
   npm run compile:wsl
   npm run deploy:wsl
   ```

3. **Generate Types**
   ```bash
   cd ../app
   npm run generate-abi
   ```

4. **Use in Frontend**
   ```typescript
   const contractConfig = getContractConfig();
   const contract = new Contract(contractConfig.address, contractConfig.abi, signer);
   await contract.newFeature();
   ```

## Testing

The project includes a comprehensive test suite covering:
- Personality evolution mechanics
- Memory consolidation workflows
- Dream processing with cooldowns
- Conversation recording
- Milestone achievements

Run tests:
```bash
npm run test:complete:wsl
```

## Contract Features

### Personality System
- Six core traits: Creativity, Analytical, Empathy, Intuition, Resilience, Curiosity
- Dynamic evolution through interactions
- Bounded trait values (0-100)

### Memory Architecture
- Daily dream and conversation storage
- Monthly consolidation mechanisms
- Yearly memory core generation
- Off-chain storage via 0G Network

### Intelligence Evolution
- Experience-based progression
- Milestone rewards
- Streak bonuses
- Level-based capabilities

## Deployment Addresses

Current deployment addresses are stored in:
- `deployments/deployment-addresses.json` - Address registry
- `DEPLOYMENT_SUMMARY.md` - Human-readable deployment log

## Security Considerations

- Private keys stored externally
- Ownership verification via ERC-7857
- Cooldown mechanisms prevent spam
- Treasury address for fee collection

## License

MIT