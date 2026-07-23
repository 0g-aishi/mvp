#!/usr/bin/env node

/**
 * @fileoverview Professional Web3 Contract Management System
 * @description Main entry point for contract operations - compile, deploy, clean, ABI generation
 * @version 2.0.0
 * @year 2025
 */

const readline = require('readline');
const path = require('path');
const { spawn } = require('child_process');

// Load environment configuration
require('../config/envLoader');

// ANSI color codes for professional terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Professional logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  debug: (msg) => process.env.DEBUG && console.log(`${colors.dim}[DEBUG]${colors.reset} ${msg}`)
};

// Menu options configuration
const MENU_OPTIONS = {
  1: {
    label: 'Compile Contracts',
    module: './modules/compiler.js',
    description: 'Compile Solidity contracts with optimization'
  },
  2: {
    label: 'Deploy Contracts',
    module: './modules/deployer.js',
    description: 'Deploy to testnet/mainnet with safety checks'
  },
  3: {
    label: 'Clean Build Files',
    module: './modules/cleaner.js',
    description: 'Remove cache and artifacts'
  },
  4: {
    label: 'Generate ABI & Types',
    module: './modules/abi-generator.js',
    description: 'Export ABI and generate TypeScript types'
  },
  5: {
    label: 'Verify Contracts',
    module: './modules/verifier.js',
    description: 'Verify contracts on block explorer'
  },
  6: {
    label: 'Settings',
    module: './modules/settings.js',
    description: 'Configure environment and preferences'
  }
};

class ContractManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Display professional header
   */
  displayHeader() {
    console.clear();
    console.log('='.repeat(50));
    console.log(`${colors.bright}     CONTRACT MANAGEMENT SYSTEM 2025${colors.reset}`);
    console.log(`${colors.dim}        Professional Web3 Development${colors.reset}`);
    console.log('='.repeat(50));
    console.log('');
  }

  /**
   * Display main menu
   */
  displayMenu() {
    console.log(`${colors.cyan}Select operation:${colors.reset}\n`);

    Object.entries(MENU_OPTIONS).forEach(([key, option]) => {
      console.log(`  ${colors.bright}${key}.${colors.reset} ${option.label}`);
      console.log(`     ${colors.dim}${option.description}${colors.reset}`);
    });

    console.log(`\n  ${colors.bright}0.${colors.reset} Exit`);
    console.log('\n' + '-'.repeat(50));
  }

  /**
   * Get user input with validation
   */
  async getUserChoice() {
    return new Promise((resolve) => {
      this.rl.question(`\n${colors.cyan}Your choice [0-6]:${colors.reset} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Execute selected module
   */
  async executeModule(modulePath) {
    try {
      log.info(`Loading module: ${modulePath}`);

      // Check if module exists
      const fullPath = path.join(__dirname, modulePath);

      // Run module as child process for better isolation
      return new Promise((resolve, reject) => {
        const child = spawn('node', [fullPath], {
          stdio: 'inherit',
          env: { ...process.env }
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Module exited with code ${code}`));
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });

    } catch (error) {
      log.error(`Failed to execute module: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate environment setup
   */
  validateEnvironment() {
    const requiredVars = ['WALLET_PRIVATE_KEY'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      log.warning('Missing environment variables:');
      missing.forEach(v => console.log(`  - ${v}`));
      console.log('\nPlease configure your environment at:');
      console.log(`  ${colors.cyan}/mnt/c/Users/kubas/Desktop/env/contracts/.env${colors.reset}`);
      return false;
    }

    return true;
  }

  /**
   * Main application loop
   */
  async run() {
    this.displayHeader();

    // Validate environment
    if (!this.validateEnvironment()) {
      console.log('');
      log.warning('Some features may not work without proper configuration.');
      console.log('');
    }

    let running = true;

    while (running) {
      this.displayMenu();
      const choice = await this.getUserChoice();

      if (choice === '0') {
        running = false;
        log.info('Exiting Contract Management System');
        this.rl.close();
        process.exit(0);
      }

      const option = MENU_OPTIONS[choice];

      if (option) {
        console.log('\n' + '='.repeat(50));
        log.info(`Starting: ${option.label}`);
        console.log('='.repeat(50) + '\n');

        try {
          await this.executeModule(option.module);
          console.log('\n' + '='.repeat(50));
          log.success(`${option.label} completed`);
          console.log('='.repeat(50));
        } catch (error) {
          console.log('\n' + '='.repeat(50));
          log.error(`${option.label} failed: ${error.message}`);
          console.log('='.repeat(50));
        }

        // Wait for user to continue
        await new Promise(resolve => {
          this.rl.question(`\n${colors.dim}Press Enter to continue...${colors.reset}`, resolve);
        });

        // Clear screen for next iteration
        this.displayHeader();

      } else {
        log.warning('Invalid option. Please select 0-6.');
      }
    }
  }

  /**
   * Cleanup on exit
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }
}

// Error handling
process.on('SIGINT', () => {
  console.log('\n');
  log.warning('Operation cancelled by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at: ${promise}`);
  console.error(reason);
  process.exit(1);
});

// Main execution
async function main() {
  const manager = new ContractManager();

  try {
    await manager.run();
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    manager.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { ContractManager, log };