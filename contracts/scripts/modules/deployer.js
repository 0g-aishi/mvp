#!/usr/bin/env node

/**
 * @fileoverview Smart Contract Deployment Module
 * @description Professional deployment with mainnet safety features
 * @version 2.0.0
 */

const { ethers } = require('hardhat');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment
require('../../config/envLoader');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  danger: (msg) => console.log(`${colors.bgRed}${colors.bright} ${msg} ${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.cyan}[Step ${num}]${colors.reset} ${msg}`)
};

// Network configurations
const NETWORKS = {
  testnet: {
    name: 'Galileo Testnet',
    chainId: 16602,
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    explorer: 'https://chainscan-testnet.0g.ai',
    symbol: '0G',
    networkName: 'galileo',
    isMainnet: false
  },
  mainnet: {
    name: '0G Mainnet',
    chainId: 16661,
    rpcUrl: process.env.MAINNET_RPC_URL || 'http://evmrpc.0g.ai',
    explorer: process.env.MAINNET_BLOCK_EXPLORER || 'https://chainscan.0g.ai',
    symbol: '0G',
    networkName: '0g-mainnet',
    isMainnet: true
  },
  local: {
    name: 'Local Hardhat',
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    explorer: null,
    symbol: 'ETH',
    networkName: 'hardhat',
    isMainnet: false
  }
};

class ContractDeployer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.projectRoot = path.resolve(__dirname, '../..');
    this.deploymentsFile = path.join(this.projectRoot, 'deployment-addresses.json');
    this.mainnetDeploymentsFile = path.join(this.projectRoot, 'mainnet-deployments.json');
  }

  /**
   * Get user input
   */
  async question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Select deployment network
   */
  async selectNetwork() {
    console.log(`\n${colors.cyan}Select deployment network:${colors.reset}\n`);
    console.log('  1. Galileo Testnet (16602)');
    console.log(`  2. 0G Mainnet (16661) ${colors.bgRed} REAL MONEY ${colors.reset}`);
    console.log('  3. Local Hardhat (31337)');
    console.log('\n' + '-'.repeat(50));

    const choice = await this.question(`\n${colors.cyan}Your choice [1-3]:${colors.reset} `);

    switch (choice.trim()) {
      case '1':
        return NETWORKS.testnet;
      case '2':
        return NETWORKS.mainnet;
      case '3':
        return NETWORKS.local;
      default:
        log.warning('Invalid choice. Exiting.');
        process.exit(0);
    }
  }

  /**
   * Validate environment for deployment
   */
  validateEnvironment(network) {
    log.step(1, 'Validating environment...');

    const requiredVars = ['WALLET_PRIVATE_KEY'];

    if (network.isMainnet) {
      requiredVars.push('TREASURY_ADDRESS');
    }

    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      log.error('Missing required environment variables:');
      missing.forEach(v => console.log(`  - ${v}`));
      return false;
    }

    // Validate private key format
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey.match(/^0x[a-fA-F0-9]{64}$/)) {
      log.error('Invalid private key format');
      return false;
    }

    log.success('Environment validated');
    return true;
  }

  /**
   * Check wallet balance
   */
  async checkWalletBalance(network) {
    log.step(2, 'Checking wallet balance...');

    try {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

      const balance = await wallet.provider.getBalance(wallet.address);
      const balanceEther = ethers.formatEther(balance);

      console.log(`\nWallet Details:`);
      console.log(`  Address: ${colors.cyan}${wallet.address}${colors.reset}`);
      console.log(`  Balance: ${colors.green}${balanceEther} ${network.symbol}${colors.reset}`);

      // Check minimum balance
      const minBalance = network.isMainnet ? 0.5 : 0.1;
      if (parseFloat(balanceEther) < minBalance) {
        log.error(`Insufficient balance. Minimum required: ${minBalance} ${network.symbol}`);
        return false;
      }

      return { address: wallet.address, balance: balanceEther };
    } catch (error) {
      log.error(`Failed to check balance: ${error.message}`);
      return false;
    }
  }

  /**
   * Estimate deployment costs
   */
  async estimateGasCosts(network) {
    log.step(3, 'Estimating deployment costs...');

    const gasEstimates = {
      verifier: 500000n,
      agent: 3000000n,
      total: 3500000n
    };

    const gasPrice = 10n * 10n ** 9n; // 10 Gwei
    const totalCostWei = gasEstimates.total * gasPrice;
    const totalCostEther = ethers.formatEther(totalCostWei);

    console.log(`\nEstimated Gas Costs:`);
    console.log(`  Verifier Contract: ~${gasEstimates.verifier.toString()} gas`);
    console.log(`  Agent Contract: ~${gasEstimates.agent.toString()} gas`);
    console.log(`  Estimated Total: ${colors.yellow}~${totalCostEther} ${network.symbol}${colors.reset}`);

    return totalCostEther;
  }

  /**
   * Mainnet safety confirmations
   */
  async confirmMainnetDeployment(network, walletInfo) {
    console.log('\n' + '='.repeat(60));
    log.danger('   MAINNET DEPLOYMENT WARNING   ');
    console.log('='.repeat(60));

    console.log(`\n${colors.red}${colors.bright}You are about to deploy to MAINNET!${colors.reset}`);
    console.log(`${colors.yellow}This will use REAL MONEY and cannot be undone.${colors.reset}`);

    console.log('\nDeployment Details:');
    console.log(`  Network: ${network.name}`);
    console.log(`  Chain ID: ${network.chainId}`);
    console.log(`  Deployer: ${walletInfo.address}`);
    console.log(`  Balance: ${walletInfo.balance} ${network.symbol}`);

    if (process.env.TREASURY_ADDRESS) {
      console.log(`  Treasury: ${colors.cyan}${process.env.TREASURY_ADDRESS}${colors.reset}`);
    }

    // First confirmation
    const confirm1 = await this.question(`\n${colors.red}Are you SURE you want to deploy to MAINNET? (yes/no):${colors.reset} `);

    if (confirm1.toLowerCase() !== 'yes') {
      log.warning('Deployment cancelled');
      return false;
    }

    // Second confirmation
    const confirm2 = await this.question(`\n${colors.red}Type "DEPLOY MAINNET" to confirm:${colors.reset} `);

    if (confirm2 !== 'DEPLOY MAINNET') {
      log.warning('Deployment cancelled - confirmation mismatch');
      return false;
    }

    // Countdown
    console.log(`\n${colors.yellow}Starting deployment in 10 seconds...${colors.reset}`);
    console.log(`${colors.dim}Press Ctrl+C to cancel${colors.reset}`);

    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r${colors.red}${i}${colors.reset} `);
      await this.sleep(1000);
    }

    console.log('\n');
    return true;
  }

  /**
   * Deploy contracts
   */
  async deployContracts(network) {
    log.step(4, 'Deploying contracts...');

    try {
      // Run deployment script
      const command = `npx hardhat run scripts/deploy/deploy-aishi.js --network ${network.networkName}`;

      log.info(`Executing deployment...`);

      execSync(command, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: { ...process.env }
      });

      log.success('Contracts deployed successfully');
      return true;
    } catch (error) {
      log.error(`Deployment failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Save mainnet deployment
   */
  saveMainnetDeployment(network, deploymentData) {
    log.step(5, 'Saving mainnet deployment record...');

    let mainnetDeployments = {};

    if (fs.existsSync(this.mainnetDeploymentsFile)) {
      try {
        mainnetDeployments = JSON.parse(fs.readFileSync(this.mainnetDeploymentsFile, 'utf8'));
      } catch (error) {
        log.warning('Could not read existing mainnet deployments');
      }
    }

    if (!mainnetDeployments[network.networkName]) {
      mainnetDeployments[network.networkName] = [];
    }

    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      network: network.name,
      chainId: network.chainId,
      deployer: deploymentData.deployer,
      contracts: deploymentData.contracts,
      gasUsed: deploymentData.gasUsed,
      transactionHashes: deploymentData.txHashes
    };

    mainnetDeployments[network.networkName].push(record);

    fs.writeFileSync(this.mainnetDeploymentsFile, JSON.stringify(mainnetDeployments, null, 2));
    log.success('Mainnet deployment saved');
  }

  /**
   * Display deployment summary
   */
  displaySummary(network, deploymentData) {
    console.log('\n' + '='.repeat(60));
    log.success('DEPLOYMENT COMPLETED');
    console.log('='.repeat(60));

    if (deploymentData && deploymentData.contracts) {
      console.log('\nDeployed Contracts:');
      Object.entries(deploymentData.contracts).forEach(([name, address]) => {
        console.log(`  ${name}: ${colors.cyan}${address}${colors.reset}`);
        if (network.explorer) {
          console.log(`    View: ${network.explorer}/address/${address}`);
        }
      });
    }

    console.log('\nNext Steps:');
    console.log('  1. Verify contracts on block explorer');
    console.log('  2. Update frontend configuration');
    console.log('  3. Run integration tests');
    console.log('  4. Generate and export ABI files');
  }

  /**
   * Main deployment flow
   */
  async run() {
    console.log('='.repeat(50));
    console.log(`${colors.bright}    CONTRACT DEPLOYMENT MODULE${colors.reset}`);
    console.log('='.repeat(50));

    try {
      // Select network
      const network = await this.selectNetwork();
      console.log('');
      log.info(`Selected: ${network.name}`);

      // Validate environment
      if (!this.validateEnvironment(network)) {
        throw new Error('Environment validation failed');
      }

      // Check balance
      const walletInfo = await this.checkWalletBalance(network);
      if (!walletInfo) {
        throw new Error('Wallet validation failed');
      }

      // Estimate costs
      await this.estimateGasCosts(network);

      // Mainnet confirmation
      if (network.isMainnet) {
        const confirmed = await this.confirmMainnetDeployment(network, walletInfo);
        if (!confirmed) {
          process.exit(0);
        }
      } else {
        const confirm = await this.question(`\nProceed with deployment? (y/n): `);
        if (confirm.toLowerCase() !== 'y') {
          log.warning('Deployment cancelled');
          process.exit(0);
        }
      }

      // Deploy contracts
      const success = await this.deployContracts(network);

      if (success) {
        // Read deployment data
        let deploymentData = null;
        if (fs.existsSync(this.deploymentsFile)) {
          const deployments = JSON.parse(fs.readFileSync(this.deploymentsFile, 'utf8'));
          if (deployments[network.networkName]) {
            deploymentData = {
              deployer: walletInfo.address,
              contracts: {}
            };

            Object.entries(deployments[network.networkName]).forEach(([key, value]) => {
              if (value.address) {
                deploymentData.contracts[key] = value.address;
              }
            });
          }
        }

        // Save mainnet deployment
        if (network.isMainnet && deploymentData) {
          this.saveMainnetDeployment(network, deploymentData);
        }

        // Display summary
        this.displaySummary(network, deploymentData);
      }

    } catch (error) {
      console.log('\n' + '='.repeat(50));
      log.error(`Deployment failed: ${error.message}`);
      console.log('='.repeat(50));
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n\n');
  log.warning('Deployment cancelled by user');
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  const deployer = new ContractDeployer();
  deployer.run();
}

module.exports = ContractDeployer;