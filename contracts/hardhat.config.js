require('@nomicfoundation/hardhat-ethers');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('./config/envLoader');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache", 
    sources: "contracts",
    deploy: "scripts/deploy",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1 // Optimized for Mainnet
      },
      viaIR: true // Fixes "Stack too deep" errors
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      allowBlocksWithSameTimestamp: true,
      blockGasLimit: 100000000,
      gas: 100000000,
      accounts: [
        {
          privateKey: process.env.WALLET_PRIVATE_KEY || "0x" + "1".repeat(64),
          balance: "1000000000000000000000",
        }
      ],
      live: false,
      saveDeployments: true,
      tags: ["test", "local"]
    },
    galileo: {
      url: "https://evmrpc-testnet.0g.ai",
      accounts: [process.env.WALLET_PRIVATE_KEY || ""],
      chainId: 16602, // Updated to correct Galileo chain ID
      live: true,
      saveDeployments: true,
      tags: ["testnet"]
    },
    "0g-mainnet": {
      url: process.env.MAINNET_RPC_URL || "http://evmrpc.0g.ai",
      accounts: [process.env.WALLET_PRIVATE_KEY || ""],
      chainId: parseInt(process.env.MAINNET_CHAIN_ID) || 16661,
      live: true,
      saveDeployments: true,
      tags: ["mainnet"],
      gasPrice: "auto", // Let the network determine gas price
      timeout: 60000, // 60 second timeout for mainnet operations
      confirmations: 2 // Wait for 2 block confirmations on mainnet
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0,
      hardhat: 0,
      galileo: 0,
      "0g-mainnet": 0,
    },
  },
  external: {
    contracts: [
      {
        artifacts: "build/artifacts",
      },
    ],
    deployments: {
      hardhat: ["deployments/hardhat"],
      galileo: ["deployments/galileo"],
      "0g-mainnet": ["deployments/0g-mainnet"],
    },
  }
}; 