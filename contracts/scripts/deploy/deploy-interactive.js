const { ethers } = require("hardhat");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Import EnvLoader to ensure environment variables are loaded
require("../../config/envLoader");

// Color codes for better console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  // Foreground colors
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },

  // Background colors
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  }
};

// Pretty print helpers
const log = {
  info: (msg) => console.log(`${colors.fg.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.fg.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.fg.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.fg.red}❌${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`\n${colors.fg.cyan}[Step ${num}]${colors.reset} ${msg}`),
  highlight: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
  danger: (msg) => console.log(`${colors.bg.red}${colors.fg.white}${colors.bright} ${msg} ${colors.reset}`)
};

// Network configurations
const NETWORKS = {
  1: {
    name: "Galileo Testnet",
    networkName: "galileo",
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    explorer: "https://chainscan-testnet.0g.ai",
    symbol: "0G",
    isMainnet: false,
    envCheck: []
  },
  2: {
    name: "0G Mainnet",
    networkName: "0g-mainnet",
    chainId: 16661,
    rpcUrl: process.env.MAINNET_RPC_URL || "http://evmrpc.0g.ai",
    explorer: process.env.MAINNET_BLOCK_EXPLORER || "https://chainscan.0g.ai",
    symbol: process.env.MAINNET_TOKEN_SYMBOL || "0G",
    isMainnet: true,
    envCheck: ["MAINNET_RPC_URL", "WALLET_PRIVATE_KEY", "TREASURY_ADDRESS"]
  },
  3: {
    name: "Local Hardhat",
    networkName: "hardhat",
    chainId: 31337,
    rpcUrl: "http://localhost:8545",
    explorer: null,
    symbol: "ETH",
    isMainnet: false,
    envCheck: []
  }
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question for async/await
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Countdown with cancellation option
async function countdown(seconds, message = "Deploying in") {
  console.log("\n" + colors.fg.yellow + "Press Ctrl+C to cancel at any time" + colors.reset);

  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r${message} ${colors.fg.red}${i}${colors.reset} seconds...`);
    await sleep(1000);
  }

  process.stdout.write("\r" + " ".repeat(50) + "\r"); // Clear the line
}

// Check wallet balance
async function checkBalance(network, address) {
  try {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    log.error(`Failed to check balance: ${error.message}`);
    return null;
  }
}

// Estimate deployment costs
async function estimateDeploymentCost() {
  // Rough estimates based on typical contract deployment
  const gasEstimates = {
    verifier: 500000n, // 500k gas for Verifier
    agent: 3000000n,   // 3M gas for Agent contract
    total: 3500000n    // Total estimate
  };

  const gasPrice = 10n * 10n**9n; // 10 Gwei estimate
  const totalCostWei = gasEstimates.total * gasPrice;
  const totalCostEther = ethers.formatEther(totalCostWei);

  return {
    gasEstimates,
    gasPrice: ethers.formatUnits(gasPrice, "gwei"),
    totalCost: totalCostEther
  };
}

// Validate environment variables
function validateEnvironment(network) {
  const missing = [];

  for (const envVar of network.envCheck) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    log.error(`Missing required environment variables:`);
    missing.forEach(v => console.log(`  - ${v}`));
    return false;
  }

  return true;
}

// Save mainnet deployment separately for safety
async function saveMainnetDeployment(verifierAddress, agentAddress, network, deployer) {
  const mainnetFile = path.join(__dirname, "../..", "mainnet-deployments.json");

  let deployments = {};

  // Read existing deployments
  if (fs.existsSync(mainnetFile)) {
    try {
      const content = fs.readFileSync(mainnetFile, 'utf8');
      deployments = JSON.parse(content);
    } catch (error) {
      log.warning(`Could not read existing mainnet deployments: ${error.message}`);
    }
  }

  // Create new deployment record
  const deploymentId = Date.now().toString();
  const deployment = {
    id: deploymentId,
    network: network.name,
    chainId: network.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer,
    contracts: {
      verifier: verifierAddress,
      agent: agentAddress
    },
    explorer: {
      verifier: `${network.explorer}/address/${verifierAddress}`,
      agent: `${network.explorer}/address/${agentAddress}`
    }
  };

  // Ensure network structure exists
  if (!deployments[network.networkName]) {
    deployments[network.networkName] = [];
  }

  // Add new deployment
  deployments[network.networkName].push(deployment);

  // Save to file
  try {
    fs.writeFileSync(mainnetFile, JSON.stringify(deployments, null, 2));
    log.success(`Mainnet deployment saved to: ${mainnetFile}`);
    return deploymentId;
  } catch (error) {
    log.error(`Failed to save mainnet deployment: ${error.message}`);
    return null;
  }
}

// Run deployment using existing deploy-aishi.js script
async function runDeployment(network) {
  log.step(1, "Starting deployment process...");

  try {
    // Build the hardhat command
    const command = `npx hardhat run scripts/deploy/deploy-aishi.js --network ${network.networkName}`;

    log.info(`Executing: ${command}`);
    console.log("");

    // Execute deployment
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, "../..")
    });

    log.success("Deployment completed successfully!");

    // Read deployment addresses for mainnet safety backup
    if (network.isMainnet) {
      const deploymentsFile = path.join(__dirname, "../..", "deployment-addresses.json");

      if (fs.existsSync(deploymentsFile)) {
        try {
          const content = fs.readFileSync(deploymentsFile, 'utf8');
          const deployments = JSON.parse(content);

          if (deployments[network.networkName]) {
            const verifier = deployments[network.networkName].AishiVerifier;
            const agent = deployments[network.networkName].AishiAgent;

            if (verifier && agent) {
              const deployer = process.env.WALLET_PRIVATE_KEY ?
                new ethers.Wallet(process.env.WALLET_PRIVATE_KEY).address :
                "unknown";

              await saveMainnetDeployment(
                verifier.address,
                agent.address,
                network,
                deployer
              );
            }
          }
        } catch (error) {
          log.warning(`Could not backup mainnet deployment: ${error.message}`);
        }
      }
    }

    return true;
  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    return false;
  }
}

// Main interactive deployment function
async function main() {
  console.clear();
  console.log("=".repeat(60));
  log.highlight("   🚀 AISHI INTERACTIVE DEPLOYMENT SYSTEM");
  console.log("=".repeat(60));

  // Display network options
  console.log("\n📡 Available Networks:\n");

  for (const [key, network] of Object.entries(NETWORKS)) {
    const mainnetWarning = network.isMainnet ?
      ` ${colors.bg.red}${colors.fg.white} ⚠️  REAL MONEY ${colors.reset}` :
      "";

    console.log(`  ${key}. ${network.name} (Chain ID: ${network.chainId})${mainnetWarning}`);
  }

  console.log("\n" + "-".repeat(60));

  // Get user selection
  const choice = await question("\n🎯 Select network (1-3): ");
  const selectedNetwork = NETWORKS[choice];

  if (!selectedNetwork) {
    log.error("Invalid selection. Exiting.");
    rl.close();
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  log.info(`Selected: ${colors.bright}${selectedNetwork.name}${colors.reset}`);
  console.log("=".repeat(60));

  // Display network details
  console.log("\n📊 Network Details:");
  console.log(`  • Name: ${selectedNetwork.name}`);
  console.log(`  • Chain ID: ${selectedNetwork.chainId}`);
  console.log(`  • RPC URL: ${selectedNetwork.rpcUrl}`);
  console.log(`  • Symbol: ${selectedNetwork.symbol}`);
  if (selectedNetwork.explorer) {
    console.log(`  • Explorer: ${selectedNetwork.explorer}`);
  }

  // Validate environment
  console.log("\n" + "-".repeat(60));
  log.step(1, "Validating environment...");

  if (!validateEnvironment(selectedNetwork)) {
    log.error("Environment validation failed. Please check your .env file.");
    rl.close();
    process.exit(1);
  }

  log.success("Environment validated successfully!");

  // Check wallet and balance
  if (process.env.WALLET_PRIVATE_KEY) {
    try {
      const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY);
      const address = wallet.address;

      console.log("\n💳 Deployer Wallet:");
      console.log(`  • Address: ${colors.fg.cyan}${address}${colors.reset}`);

      const balance = await checkBalance(selectedNetwork, address);

      if (balance !== null) {
        const balanceColor = parseFloat(balance) < 0.5 ? colors.fg.red : colors.fg.green;
        console.log(`  • Balance: ${balanceColor}${balance} ${selectedNetwork.symbol}${colors.reset}`);

        if (parseFloat(balance) < 0.1) {
          log.error("Insufficient balance for deployment!");
          rl.close();
          process.exit(1);
        }
      }
    } catch (error) {
      log.warning(`Could not verify wallet: ${error.message}`);
    }
  }

  // Estimate costs
  console.log("\n" + "-".repeat(60));
  log.step(2, "Estimating deployment costs...");

  const costs = await estimateDeploymentCost();
  console.log("\n💰 Estimated Costs:");
  console.log(`  • Verifier Contract: ~${ethers.formatUnits(costs.gasEstimates.verifier, 0)} gas`);
  console.log(`  • Agent Contract: ~${ethers.formatUnits(costs.gasEstimates.agent, 0)} gas`);
  console.log(`  • Estimated Gas Price: ${costs.gasPrice} Gwei`);
  console.log(`  • Total Estimated Cost: ${colors.fg.yellow}~${costs.totalCost} ${selectedNetwork.symbol}${colors.reset}`);

  // MAINNET SAFETY CHECKS
  if (selectedNetwork.isMainnet) {
    console.log("\n" + "=".repeat(60));
    log.danger("   ⚠️  MAINNET DEPLOYMENT WARNING ⚠️   ");
    console.log("=".repeat(60));

    console.log(`\n${colors.fg.red}${colors.bright}You are about to deploy to MAINNET!${colors.reset}`);
    console.log(`${colors.fg.yellow}This will use REAL MONEY and cannot be undone.${colors.reset}`);

    console.log("\n📋 Pre-deployment Checklist:");
    console.log("  ☐ Have you tested on testnet?");
    console.log("  ☐ Have you reviewed the contract code?");
    console.log("  ☐ Do you have sufficient balance?");
    console.log("  ☐ Is the treasury address correct?");

    if (process.env.TREASURY_ADDRESS) {
      console.log(`\n🏦 Treasury Address: ${colors.fg.cyan}${process.env.TREASURY_ADDRESS}${colors.reset}`);
    }

    console.log("\n" + "-".repeat(60));

    // First confirmation
    const confirm1 = await question("\n❓ Are you SURE you want to deploy to MAINNET? (type 'yes' to continue): ");

    if (confirm1.toLowerCase() !== 'yes') {
      log.warning("Deployment cancelled by user.");
      rl.close();
      process.exit(0);
    }

    // Second confirmation
    const networkName = selectedNetwork.name.toUpperCase();
    const confirm2 = await question(`\n❓ Type "${networkName}" to confirm deployment to mainnet: `);

    if (confirm2 !== networkName) {
      log.warning("Deployment cancelled - confirmation text did not match.");
      rl.close();
      process.exit(0);
    }

    // Final countdown
    console.log("\n" + "=".repeat(60));
    await countdown(10, "Starting MAINNET deployment in");
    console.log("\n" + "=".repeat(60));
  } else {
    // Testnet/Local confirmation
    console.log("\n" + "-".repeat(60));
    const confirm = await question("\n❓ Proceed with deployment? (y/n): ");

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log.warning("Deployment cancelled by user.");
      rl.close();
      process.exit(0);
    }
  }

  // Run deployment
  console.log("\n" + "=".repeat(60));
  log.highlight("   🚀 INITIATING DEPLOYMENT");
  console.log("=".repeat(60));

  const success = await runDeployment(selectedNetwork);

  if (success) {
    console.log("\n" + "=".repeat(60));
    log.highlight("   🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));

    if (selectedNetwork.isMainnet) {
      console.log(`\n${colors.fg.green}✨ Mainnet deployment completed successfully!${colors.reset}`);
      console.log(`\n📝 Deployment has been saved to mainnet-deployments.json`);
    }

    console.log("\n🎯 Next Steps:");
    console.log("  1. Verify contracts on block explorer");
    console.log("  2. Update frontend configuration");
    console.log("  3. Test all contract functions");

    if (selectedNetwork.explorer) {
      console.log(`\n🔍 View on Explorer: ${selectedNetwork.explorer}`);
    }
  } else {
    console.log("\n" + "=".repeat(60));
    log.error("   DEPLOYMENT FAILED");
    console.log("=".repeat(60));

    console.log("\n📋 Troubleshooting:");
    console.log("  1. Check your wallet balance");
    console.log("  2. Verify network connectivity");
    console.log("  3. Review error messages above");
    console.log("  4. Check environment variables");
  }

  rl.close();
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  console.log("\n\n");
  log.warning("Deployment cancelled by user (Ctrl+C)");
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n");
      log.error(`Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;