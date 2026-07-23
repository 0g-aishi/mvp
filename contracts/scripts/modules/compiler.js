#!/usr/bin/env node

/**
 * @fileoverview Smart Contract Compilation Module
 * @description Professional compilation with network-specific optimization
 * @version 2.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`\n${colors.cyan}[Step ${num}]${colors.reset} ${msg}`)
};

// Network configurations for optimization
const NETWORK_CONFIGS = {
  testnet: {
    name: 'Testnet',
    optimizer: {
      enabled: true,
      runs: 200 // Balanced for testing
    }
  },
  mainnet: {
    name: 'Mainnet',
    optimizer: {
      enabled: true,
      runs: 1 // Maximum size optimization for mainnet
    }
  },
  local: {
    name: 'Local Development',
    optimizer: {
      enabled: false,
      runs: 200
    }
  }
};

class ContractCompiler {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.projectRoot = path.resolve(__dirname, '../..');
    this.contractsDir = path.join(this.projectRoot, 'contracts');
    this.buildDir = path.join(this.projectRoot, 'build');
    this.configFile = path.join(this.projectRoot, 'hardhat.config.js');
  }

  /**
   * Get user input
   */
  async question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  /**
   * Display compilation menu
   */
  async selectNetwork() {
    console.log(`\n${colors.cyan}Select compilation target:${colors.reset}\n`);
    console.log('  1. Testnet (Galileo)');
    console.log('  2. Mainnet (0G Network)');
    console.log('  3. Local Development');
    console.log('\n' + '-'.repeat(50));

    const choice = await this.question(`\n${colors.cyan}Your choice [1-3]:${colors.reset} `);

    switch (choice.trim()) {
      case '1':
        return 'testnet';
      case '2':
        return 'mainnet';
      case '3':
        return 'local';
      default:
        log.warning('Invalid choice. Using testnet configuration.');
        return 'testnet';
    }
  }

  /**
   * Check contract files
   */
  async analyzeContracts() {
    log.step(1, 'Analyzing contract files...');

    try {
      const contractFiles = fs.readdirSync(this.contractsDir)
        .filter(f => f.endsWith('.sol'));

      const allFiles = contractFiles;

      if (allFiles.length === 0) {
        throw new Error('No Solidity contracts found');
      }

      console.log(`\nFound ${contractFiles.length} contract(s):`);
      allFiles.forEach(file => {
        const filePath = path.join(this.contractsDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  [Contract]  ${file} (${size} KB)`);
      });

      return allFiles;
    } catch (error) {
      log.error(`Failed to analyze contracts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update hardhat config for selected network
   */
  updateHardhatConfig(network) {
    log.step(2, `Configuring for ${NETWORK_CONFIGS[network].name}...`);

    const config = NETWORK_CONFIGS[network];

    // Read current config
    let configContent = fs.readFileSync(this.configFile, 'utf8');

    // Update optimizer settings
    const optimizerRegex = /optimizer:\s*{[^}]*}/s;
    const newOptimizer = `optimizer: {
        enabled: ${config.optimizer.enabled},
        runs: ${config.optimizer.runs}${config.optimizer.enabled ? ' // Optimized for ' + config.name : ''}
      }`;

    if (optimizerRegex.test(configContent)) {
      configContent = configContent.replace(optimizerRegex, newOptimizer);
    }

    // Save updated config
    fs.writeFileSync(this.configFile, configContent);
    log.success('Configuration updated');
  }

  /**
   * Run compilation
   */
  async compile() {
    log.step(3, 'Compiling contracts...');

    try {
      // Execute hardhat compile
      const output = execSync('npx hardhat compile', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      // Parse output for important info
      const lines = output.split('\n').filter(l => l.trim());

      // Check for warnings
      const warnings = lines.filter(l => l.includes('Warning'));
      if (warnings.length > 0) {
        log.warning(`Compilation completed with ${warnings.length} warning(s)`);
        warnings.forEach(w => console.log(`  ${colors.yellow}!${colors.reset} ${w}`));
      } else {
        log.success('Compilation completed successfully');
      }

      return true;
    } catch (error) {
      // Check if it's just warnings
      if (error.stdout && error.stdout.includes('Compiled')) {
        log.success('Compilation completed with warnings');
        return true;
      }

      log.error('Compilation failed');
      console.error(error.stderr || error.message);
      return false;
    }
  }

  /**
   * Analyze build artifacts
   */
  async analyzeBuildArtifacts() {
    log.step(4, 'Analyzing build artifacts...');

    const artifactsDir = path.join(this.buildDir, 'artifacts', 'contracts');

    if (!fs.existsSync(artifactsDir)) {
      log.warning('No artifacts found');
      return;
    }

    const contracts = [];

    // Helper function to process artifacts from a directory
    const processArtifactsDir = (dirPath, isLibrary = false) => {
      if (!fs.existsSync(dirPath)) return;

      const dirs = fs.readdirSync(dirPath)
        .filter(d => fs.statSync(path.join(dirPath, d)).isDirectory());

      for (const dir of dirs) {
        const files = fs.readdirSync(path.join(dirPath, dir))
          .filter(f => f.endsWith('.json') && !f.includes('.dbg.json'));

        for (const file of files) {
          const artifactPath = path.join(dirPath, dir, file);
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

          if (artifact.bytecode && artifact.bytecode !== '0x') {
            const bytecodeSize = (artifact.bytecode.length - 2) / 2;
            const deployedSize = artifact.deployedBytecode ?
              (artifact.deployedBytecode.length - 2) / 2 : 0;

            contracts.push({
              name: artifact.contractName,
              bytecodeSize,
              deployedSize,
              hasConstructor: artifact.bytecode !== artifact.deployedBytecode,
              isLibrary
            });
          }
        }
      }
    };

    // Process main contracts
    processArtifactsDir(artifactsDir, false);

    if (contracts.length > 0) {
      console.log('\n' + colors.cyan + 'Contract Sizes:' + colors.reset);
      console.log('-'.repeat(60));
      console.log('Contract'.padEnd(25) + 'Bytecode'.padEnd(15) + 'Deployed'.padEnd(15) + 'Status');
      console.log('-'.repeat(60));

      contracts.forEach(contract => {
        const maxSize = 24576; // 24KB limit
        const bytecodePercent = ((contract.bytecodeSize / maxSize) * 100).toFixed(1);
        const deployedPercent = ((contract.deployedSize / maxSize) * 100).toFixed(1);

        const statusColor = contract.deployedSize > maxSize ? colors.red :
          contract.deployedSize > maxSize * 0.9 ? colors.yellow :
            colors.green;

        console.log(
          contract.name.padEnd(25) +
          `${contract.bytecodeSize}B`.padEnd(15) +
          `${contract.deployedSize}B`.padEnd(15) +
          statusColor + `${deployedPercent}%` + colors.reset
        );
      });

      console.log('-'.repeat(60));
      console.log(`${colors.dim}Maximum contract size: 24,576 bytes${colors.reset}`);
    }

    return contracts;
  }

  /**
   * Generate compilation report
   */
  generateReport(network, contracts) {
    log.step(5, 'Generating compilation report...');

    const reportPath = path.join(this.projectRoot, 'compilation-report.json');

    const mainContracts = contracts || [];

    const report = {
      timestamp: new Date().toISOString(),
      network: NETWORK_CONFIGS[network].name,
      optimizer: NETWORK_CONFIGS[network].optimizer,
      contracts: mainContracts,
      summary: {
        totalContracts: mainContracts.length,
        mainContractSize: mainContracts.find(c => c.name === 'AishiAgent')?.deployedSize || 0
      },
      compiler: {
        version: '0.8.20',
        settings: {
          viaIR: true
        }
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.success(`Report saved to: compilation-report.json`);
  }

  /**
   * Main compilation flow
   */
  async run() {
    console.log('='.repeat(50));
    console.log(`${colors.bright}    CONTRACT COMPILATION MODULE${colors.reset}`);
    console.log('='.repeat(50));

    try {
      // Select network
      const network = await this.selectNetwork();
      console.log('');
      log.info(`Selected: ${NETWORK_CONFIGS[network].name}`);

      // Analyze contracts
      await this.analyzeContracts();

      // Update configuration
      this.updateHardhatConfig(network);

      // Compile
      const success = await this.compile();

      if (success) {
        // Analyze artifacts
        const contracts = await this.analyzeBuildArtifacts();

        // Generate report
        this.generateReport(network, contracts);

        console.log('\n' + '='.repeat(50));
        log.success('Compilation process completed');
        console.log('='.repeat(50));
      } else {
        throw new Error('Compilation failed');
      }

    } catch (error) {
      console.log('\n' + '='.repeat(50));
      log.error(`Compilation failed: ${error.message}`);
      console.log('='.repeat(50));
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const compiler = new ContractCompiler();
  compiler.run();
}

module.exports = ContractCompiler;