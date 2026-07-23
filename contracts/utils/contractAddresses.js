const fs = require('fs');
const path = require('path');

// Debug logging helper
const debugLog = (message, data = null) => {
  if (process.env.DREAMSCAPE_TEST === 'true') {
    console.log(`[🔮 CONTRACTS] ${message}`, data || '');
  }
};

/**
 * Get contract addresses for a specific network
 * @param {string} network - Network name (e.g., 'galileo', 'hardhat')
 * @returns {object} Contract addresses and info
 */
const getContractAddresses = (network = 'galileo') => {
  const deploymentsFile = path.join(__dirname, '..', 'deployment-addresses.json');
  
  try {
    if (!fs.existsSync(deploymentsFile)) {
      debugLog('Deployment addresses file not found', { path: deploymentsFile });
      return {
        network,
        contracts: {},
        error: 'Deployment file not found. Run deployment first.'
      };
    }
    
    const content = fs.readFileSync(deploymentsFile, 'utf8');
    const deployments = JSON.parse(content);
    
    if (!deployments[network]) {
      debugLog('Network not found in deployments', { network, available: Object.keys(deployments) });
      return {
        network,
        contracts: {},
        error: `Network '${network}' not found in deployments`
      };
    }
    
    const networkData = deployments[network];
    debugLog('Contract addresses loaded', { network, contracts: Object.keys(networkData) });
    
    return {
      network,
      contracts: networkData,
      lastUpdate: networkData.lastUpdate,
      isValid: true
    };
    
  } catch (error) {
    console.error('❌ Failed to read deployment addresses:', error.message);
    debugLog('Error reading deployment addresses', error.message);
    
    return {
      network,
      contracts: {},
      error: error.message
    };
  }
};

/**
 * Get specific contract address
 * @param {string} contractName - Contract name
 * @param {string} network - Network name
 * @returns {string|null} Contract address
 */
const getContractAddress = (contractName, network = 'galileo') => {
  const result = getContractAddresses(network);
  
  if (!result.isValid) {
    debugLog(`Failed to get ${contractName} address`, result.error);
    return null;
  }
  
  const contractData = result.contracts[contractName];
  
  if (!contractData) {
    debugLog(`Contract ${contractName} not found`, { available: Object.keys(result.contracts) });
    return null;
  }
  
  // Handle both old format (string) and new format (object with address)
  const address = typeof contractData === 'string' ? contractData : contractData.address;
  
  debugLog(`Retrieved ${contractName} address`, { address, network });
  return address;
};

/**
 * Get DreamAgentNFT contract info
 * @param {string} network - Network name
 * @returns {object} Contract info including supply data
 */
const getDreamAgentNFTInfo = (network = 'galileo') => {
  const result = getContractAddresses(network);
  
  if (!result.isValid) {
    return { error: result.error };
  }
  
  const nftData = result.contracts.DreamAgentNFT;
  
  if (!nftData) {
    return { error: 'DreamAgentNFT not deployed' };
  }
  
  // Handle both old format (string) and new format (object)
  if (typeof nftData === 'string') {
    return {
      address: nftData,
      name: 'Dreamscape AI Agents',
      symbol: 'DREAM',
      maxAgents: '1000',
      network
    };
  }
  
  return {
    address: nftData.address,
    name: nftData.name || 'Dreamscape AI Agents',
    symbol: nftData.symbol || 'DREAM',
    totalAgents: nftData.totalAgents || '0',
    maxAgents: nftData.maxAgents || '1000',
    remainingSupply: nftData.remainingSupply || nftData.maxAgents || '1000',
    verifier: nftData.verifier,
    deployedAt: nftData.deployedAt,
    network
  };
};

/**
 * Check if contracts are deployed and ready
 * @param {string} network - Network name
 * @returns {object} Deployment status
 */
const checkDeploymentStatus = (network = 'galileo') => {
  const result = getContractAddresses(network);
  
  if (!result.isValid) {
    return {
      deployed: false,
      error: result.error,
      missing: ['SimpleDreamVerifier', 'DreamAgentNFT']
    };
  }
  
  const verifierAddress = getContractAddress('SimpleDreamVerifier', network);
  const nftAddress = getContractAddress('DreamAgentNFT', network);
  
  const missing = [];
  if (!verifierAddress) missing.push('SimpleDreamVerifier');
  if (!nftAddress) missing.push('DreamAgentNFT');
  
  const deployed = missing.length === 0;
  
  debugLog('Deployment status checked', { 
    deployed, 
    verifier: !!verifierAddress, 
    nft: !!nftAddress,
    missing 
  });
  
  return {
    deployed,
    contracts: {
      SimpleDreamVerifier: verifierAddress,
      DreamAgentNFT: nftAddress
    },
    missing,
    network,
    lastUpdate: result.lastUpdate
  };
};

module.exports = {
  getContractAddresses,
  getContractAddress,
  getDreamAgentNFTInfo,
  checkDeploymentStatus
}; 