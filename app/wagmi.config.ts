/**
 * @fileoverview Wagmi CLI configuration for TypeScript ABI generation
 * @description Automatically generates type-safe contract interfaces from existing ABI files
 */

import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'

// Import existing ABI files
import AishiAgentABI from './src/abi/AishiAgentABI.json'
import AishiVerifierABI from './src/abi/AishiVerifierABI.json'

// Import deployment addresses to get correct addresses for each network
const deployments = require('../contracts/deployment-addresses.json')

// Get addresses for each network
const testnetAddresses = deployments.galileo || {}
const mainnetAddresses = deployments['0g-mainnet'] || {}

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'AishiAgent',
      abi: AishiAgentABI.abi as any,
      address: {
        16602: (testnetAddresses.AishiAgent?.address || '0x6Ea891A7223459aCC46030aae203DCC218a388C6') as `0x${string}`, // Galileo testnet
        16661: (mainnetAddresses.AishiAgent?.address || '0xaf7ebF0a6a0e0b8781E3b3D989cc72c2d85BBCb6') as `0x${string}`, // 0G mainnet
      },
    },
    {
      name: 'AishiVerifier',
      abi: AishiVerifierABI.abi as any,
      address: {
        16602: (testnetAddresses.AishiVerifier?.address || '0x978a566B8817f14fEAaA783177E41e2d6dCA000C') as `0x${string}`, // Galileo testnet
        16661: (mainnetAddresses.AishiVerifier?.address || '0x14e54c132A82d6c5ac3723a47b2AE9002b9b78b8') as `0x${string}`, // 0G mainnet
      },
    },
  ],
  plugins: [
    react()
  ],
})