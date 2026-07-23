#!/usr/bin/env node

/**
 * @fileoverview ABI Export and Generation Module
 * @description Export contract ABIs and generate TypeScript types
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

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

// Contract configurations
const CONTRACTS = {
  AishiAgent: {
    name: 'AishiAgent',
    artifact: 'contracts/AishiAgent.sol/AishiAgent.json',
    description: 'Main iNFT agent contract'
  },
  AishiVerifier: {
    name: 'AishiVerifier',
    artifact: 'contracts/AishiVerifier.sol/AishiVerifier.json',
    description: 'Ownership verification contract'
  }
};

class ABIGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.projectRoot = path.resolve(__dirname, '../..');
    this.artifactsDir = path.join(this.projectRoot, 'build', 'artifacts');
    this.frontendAbiDir = path.resolve(this.projectRoot, '../../app/src/abi');
    this.deploymentsFile = path.join(this.projectRoot, 'deployment-addresses.json');
  }

  /**
   * Get user input
   */
  async question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  /**
   * Check if artifacts exist
   */
  checkArtifacts() {
    log.step(1, 'Checking build artifacts...');

    if (!fs.existsSync(this.artifactsDir)) {
      log.error('No artifacts found. Please compile contracts first.');
      return false;
    }

    const missing = [];

    for (const [key, contract] of Object.entries(CONTRACTS)) {
      const artifactPath = path.join(this.artifactsDir, contract.artifact);

      if (!fs.existsSync(artifactPath)) {
        missing.push(contract.name);
      }
    }

    if (missing.length > 0) {
      log.error('Missing artifacts for:');
      missing.forEach(m => console.log(`  - ${m}`));
      return false;
    }

    log.success('All required artifacts found');
    return true;
  }

  /**
   * Load deployment addresses
   */
  loadDeploymentAddresses() {
    log.step(2, 'Loading deployment addresses...');

    if (!fs.existsSync(this.deploymentsFile)) {
      log.warning('No deployment addresses found');
      return null;
    }

    try {
      const deployments = JSON.parse(fs.readFileSync(this.deploymentsFile, 'utf8'));

      // Find the most recent deployment
      const networks = Object.keys(deployments);

      if (networks.length === 0) {
        log.warning('No deployments found');
        return null;
      }

      // Priority: mainnet > testnet > local
      let selectedNetwork = null;
      let addresses = {};

      if (deployments['0g-mainnet']) {
        selectedNetwork = '0g-mainnet';
        addresses = deployments['0g-mainnet'];
      } else if (deployments['galileo']) {
        selectedNetwork = 'galileo';
        addresses = deployments['galileo'];
      } else if (deployments['hardhat']) {
        selectedNetwork = 'hardhat';
        addresses = deployments['hardhat'];
      } else {
        selectedNetwork = networks[0];
        addresses = deployments[networks[0]];
      }

      console.log(`\nUsing addresses from: ${colors.cyan}${selectedNetwork}${colors.reset}`);

      return {
        network: selectedNetwork,
        addresses: addresses
      };
    } catch (error) {
      log.error(`Failed to load deployments: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract and format ABI
   */
  extractABI(artifactPath, contractName, deploymentInfo) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Find address for this contract
    let contractAddress = null;
    let chainId = null;

    if (deploymentInfo && deploymentInfo.addresses) {
      const contractData = deploymentInfo.addresses[contractName];

      if (contractData && contractData.address) {
        contractAddress = contractData.address;
      }

      // Determine chain ID
      switch (deploymentInfo.network) {
        case 'galileo':
          chainId = 16602;
          break;
        case '0g-mainnet':
          chainId = 16661;
          break;
        case 'hardhat':
          chainId = 31337;
          break;
      }
    }

    return {
      contractName: contractName,
      address: contractAddress || '0x0000000000000000000000000000000000000000',
      network: deploymentInfo?.network || 'unknown',
      chainId: chainId || 0,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export ABIs to frontend
   */
  async exportABIs(deploymentInfo) {
    log.step(3, 'Exporting ABIs to frontend...');

    // Create ABI directory if it doesn't exist
    if (!fs.existsSync(this.frontendAbiDir)) {
      fs.mkdirSync(this.frontendAbiDir, { recursive: true });
      log.info(`Created ABI directory: ${this.frontendAbiDir}`);
    }

    const exported = [];

    for (const [key, contract] of Object.entries(CONTRACTS)) {
      try {
        const artifactPath = path.join(this.artifactsDir, contract.artifact);
        const abiData = this.extractABI(artifactPath, contract.name, deploymentInfo);

        // Write ABI file
        const outputPath = path.join(this.frontendAbiDir, `${contract.name}ABI.json`);
        fs.writeFileSync(outputPath, JSON.stringify(abiData, null, 2));

        console.log(`  Exported: ${colors.green}✓${colors.reset} ${contract.name}ABI.json`);
        exported.push(contract.name);

      } catch (error) {
        console.log(`  Failed: ${colors.red}✗${colors.reset} ${contract.name} - ${error.message}`);
      }
    }

    if (exported.length > 0) {
      log.success(`Exported ${exported.length} ABI file(s)`);
    }

    return exported;
  }

  /**
   * Generate TypeScript types with Wagmi
   */
  async generateTypes() {
    log.step(4, 'Generating TypeScript types...');

    const appDir = path.resolve(this.projectRoot, '../../app');

    // Check if wagmi is installed
    const wagmiConfigPath = path.join(appDir, 'wagmi.config.ts');

    if (!fs.existsSync(wagmiConfigPath)) {
      log.warning('Wagmi config not found in app directory');
      return false;
    }

    try {
      console.log('Running wagmi generate...');

      // Run wagmi generate
      execSync('npm run generate-abi', {
        cwd: appDir,
        stdio: 'inherit'
      });

      log.success('TypeScript types generated');
      return true;

    } catch (error) {
      log.warning(`Type generation failed: ${error.message}`);
      console.log(`\nTo generate types manually, run:`);
      console.log(`  ${colors.cyan}cd ../app && npm run generate-abi${colors.reset}`);
      return false;
    }
  }

  /**
   * Create TypeScript config for contracts
   */
  createTypeScriptConfig(exported) {
    log.step(5, 'Creating TypeScript configuration...');

    const configPath = path.join(this.frontendAbiDir, 'contracts.ts');

    const config = `/**
 * @fileoverview Contract configurations
 * @generated ${new Date().toISOString()}
 */

${exported.map(name => `import ${name}ABI from './${name}ABI.json';`).join('\n')}

export const contracts = {
${exported.map(name => `  ${name}: {
    abi: ${name}ABI.abi,
    address: ${name}ABI.address as \`0x\${string}\`,
    chainId: ${name}ABI.chainId
  }`).join(',\n')}
} as const;

export type ContractName = keyof typeof contracts;
`;

    try {
      fs.writeFileSync(configPath, config);
      log.success('TypeScript config created');
      return true;
    } catch (error) {
      log.warning(`Failed to create config: ${error.message}`);
      return false;
    }
  }

  /**
   * Display summary
   */
  displaySummary(exported, typesGenerated) {
    console.log('\n' + '='.repeat(50));
    log.success('ABI GENERATION COMPLETED');
    console.log('='.repeat(50));

    console.log('\nGenerated files:');

    exported.forEach(name => {
      console.log(`  - ${colors.cyan}${name}ABI.json${colors.reset}`);
    });

    if (typesGenerated) {
      console.log(`  - ${colors.cyan}src/generated.ts${colors.reset} (TypeScript types)`);
    }

    console.log('\nNext steps:');
    console.log('  1. Verify ABIs in frontend application');
    console.log('  2. Update contract addresses if needed');
    console.log('  3. Test frontend integration');
  }

  /**
   * Main generation flow
   */
  async run() {
    console.log('='.repeat(50));
    console.log(`${colors.bright}    ABI GENERATION MODULE${colors.reset}`);
    console.log('='.repeat(50));

    try {
      // Check artifacts
      if (!this.checkArtifacts()) {
        throw new Error('Missing required artifacts');
      }

      // Load deployment addresses
      const deploymentInfo = this.loadDeploymentAddresses();

      if (!deploymentInfo) {
        const proceed = await this.question(
          `\n${colors.yellow}No deployment addresses found. Continue anyway? (y/n):${colors.reset} `
        );

        if (proceed.toLowerCase() !== 'y') {
          log.warning('Generation cancelled');
          process.exit(0);
        }
      }

      // Export ABIs
      const exported = await this.exportABIs(deploymentInfo);

      if (exported.length === 0) {
        throw new Error('No ABIs exported');
      }

      // Create TypeScript config
      this.createTypeScriptConfig(exported);

      // Generate types
      const typesGenerated = await this.generateTypes();

      // Display summary
      this.displaySummary(exported, typesGenerated);

    } catch (error) {
      console.log('\n' + '='.repeat(50));
      log.error(`ABI generation failed: ${error.message}`);
      console.log('='.repeat(50));
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new ABIGenerator();
  generator.run();
}

module.exports = ABIGenerator;