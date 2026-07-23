#!/usr/bin/env node

/**
 * @fileoverview Aishi Contract Deployment Script
 * @description Deploy AishiVerifier and AishiAgent contracts
 * @version 2.0.0
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

// Logging
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`\n${colors.cyan}[Step ${num}]${colors.reset} ${msg}`)
};

/**
 * Save deployment addresses
 */
function saveDeploymentAddress(contractName, address, network, extraData = {}) {
  const deploymentsFile = path.join(__dirname, "../..", "deployment-addresses.json");

  let deployments = {};

  if (fs.existsSync(deploymentsFile)) {
    try {
      deployments = JSON.parse(fs.readFileSync(deploymentsFile, 'utf8'));
    } catch (error) {
      log.warning('Creating new deployment file');
    }
  }

  if (!deployments[network]) {
    deployments[network] = {};
  }

  deployments[network][contractName] = {
    address: address,
    deployedAt: new Date().toISOString(),
    ...extraData
  };

  deployments[network].lastUpdate = new Date().toISOString();

  fs.writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
}

/**
 * Export ABI to frontend
 */
async function exportABIToFrontend(contractName, contractAddress, network) {
  try {
    const artifact = await hre.artifacts.readArtifact(contractName);

    const frontendPath = path.join(__dirname, "../../../app/src/abi");
    const abiFile = path.join(frontendPath, `${contractName}ABI.json`);

    if (!fs.existsSync(frontendPath)) {
      fs.mkdirSync(frontendPath, { recursive: true });
    }

    const chainId = network === "galileo" ? 16602 :
                    network === "0g-mainnet" ? 16661 : 31337;

    const abiData = {
      contractName: contractName,
      address: contractAddress,
      network: network,
      chainId: chainId,
      abi: artifact.abi,
      deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(abiFile, JSON.stringify(abiData, null, 2));
    log.success(`ABI exported to: ${abiFile}`);

    return true;
  } catch (error) {
    log.error(`Failed to export ABI: ${error.message}`);
    return false;
  }
}

/**
 * Main deployment function
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("    AISHI CONTRACT DEPLOYMENT");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  log.info(`Network: ${network}`);
  log.info(`Deployer: ${deployer.address}`);

  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  log.info(`Treasury: ${treasuryAddress}`);

  if (!process.env.TREASURY_ADDRESS) {
    log.warning("TREASURY_ADDRESS not set, using deployer address");
  }

  // Deploy Verifier
  log.step(1, "Deploying AishiVerifier...");

  const AishiVerifier = await ethers.getContractFactory("AishiVerifier");
  const verifier = await AishiVerifier.deploy();
  await verifier.waitForDeployment();

  const verifierAddress = await verifier.getAddress();
  log.success(`AishiVerifier deployed to: ${verifierAddress}`);

  saveDeploymentAddress("AishiVerifier", verifierAddress, network, {
    contractType: "verifier",
    gasUsed: (await verifier.deploymentTransaction().wait()).gasUsed.toString()
  });

  // Deploy Agent (single contract)
  log.step(2, "Deploying AishiAgent...");

  const AishiAgent = await ethers.getContractFactory("AishiAgent");
  const aishiAgent = await AishiAgent.deploy(verifierAddress, treasuryAddress);
  await aishiAgent.waitForDeployment();

  const agentAddress = await aishiAgent.getAddress();
  log.success(`AishiAgent deployed to: ${agentAddress}`);

  // Get contract info
  log.step(3, "Reading contract information...");

  try {
    const [name, symbol, totalAgents, mintingFee, priceStep, priceStepInterval] = await Promise.all([
      aishiAgent.name(),
      aishiAgent.symbol(),
      aishiAgent.totalAgents(),
      aishiAgent.MINTING_FEE(),
      aishiAgent.PRICE_STEP(),
      aishiAgent.PRICE_STEP_INTERVAL()
    ]);

    console.log("\nContract Information:");
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Total Agents: ${totalAgents} (unlimited supply)`);
    console.log(`  Base Mint Price: ${ethers.formatEther(mintingFee)} 0G`);
    console.log(`  Price Increase: ${ethers.formatEther(priceStep)} 0G every ${priceStepInterval} mints`);

    saveDeploymentAddress("AishiAgent", agentAddress, network, {
      name,
      symbol,
      totalAgents: totalAgents.toString(),
      baseMintingFee: ethers.formatEther(mintingFee),
      priceStep: ethers.formatEther(priceStep),
      priceStepInterval: priceStepInterval.toString(),
      treasury: treasuryAddress,
      verifier: verifierAddress,
      gasUsed: (await aishiAgent.deploymentTransaction().wait()).gasUsed.toString()
    });

  } catch (error) {
    log.warning(`Could not retrieve full contract info: ${error.message}`);
    saveDeploymentAddress("AishiAgent", agentAddress, network, {
      treasury: treasuryAddress,
      verifier: verifierAddress
    });
  }

  // Export ABIs
  log.step(4, "Exporting ABIs...");

  await exportABIToFrontend("AishiVerifier", verifierAddress, network);
  await exportABIToFrontend("AishiAgent", agentAddress, network);

  // Summary
  console.log("\n" + "=".repeat(60));
  log.success("DEPLOYMENT COMPLETED SUCCESSFULLY");
  console.log("=".repeat(60));

  console.log("\nDeployed Contracts:");
  console.log(`  AishiVerifier: ${verifierAddress}`);
  console.log(`  AishiAgent: ${agentAddress}`);
  console.log(`  Treasury: ${treasuryAddress}`);

  console.log("\nNext Steps:");
  console.log("  1. Verify contracts on block explorer");
  console.log("  2. Update frontend configuration");
  console.log("  3. Run integration tests");
}

// Export for hardhat-deploy
module.exports = async function (hre) {
  try {
    await main();
  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    console.error(error);
    throw error;
  }
};

module.exports.tags = ["AishiAgent", "all"];

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}