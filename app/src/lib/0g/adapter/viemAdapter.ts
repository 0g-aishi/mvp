/**
 * @fileoverview Adapter converting viem/wagmi interfaces to ethers for 0G SDK compatibility
 * @description Provides bridge between modern viem/wagmi stack and ethers-based @0glabs/0g-ts-sdk,
 * allowing full migration to viem while maintaining 0G SDK functionality
 */

import { ethers } from 'ethers';
import type { WalletClient, PublicClient } from 'viem';
import { type Hex } from 'viem';
import { getAccount, getWalletClient } from '@wagmi/core';
import wagmiConfig from '../../../config/wagmiClient';
import { getActiveChain } from '../../../config/chains';

/**
 * Converts viem WalletClient to ethers Signer for 0G SDK compatibility
 * @param walletClient Viem wallet client instance
 * @returns Ethers signer that 0G SDK can use
 */
export async function walletClientToEthersSigner(
  walletClient: WalletClient
): Promise<ethers.Signer> {
  const { account, chain, transport } = walletClient;
  
  if (!account || !chain) {
    throw new Error('WalletClient must have account and chain');
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };

  // Create ethers provider using the same RPC endpoint
  const provider = new ethers.BrowserProvider(window.ethereum, network);
  
  // Get signer from the provider
  const signer = await provider.getSigner(account.address);
  
  return signer;
}

/**
 * Converts viem PublicClient to ethers Provider for 0G SDK compatibility
 * @param publicClient Viem public client instance
 * @returns Ethers provider that 0G SDK can use
 */
export function publicClientToEthersProvider(
  publicClient: PublicClient
): ethers.JsonRpcProvider {
  const { chain, transport } = publicClient;
  
  if (!chain) {
    throw new Error('PublicClient must have chain');
  }

  // Extract RPC URL from transport
  let rpcUrl = chain.rpcUrls.default.http[0];
  
  // If transport has a specific URL, use it
  if (transport.type === 'http' && transport.url) {
    rpcUrl = transport.url;
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };

  return new ethers.JsonRpcProvider(rpcUrl, network);
}

/**
 * Creates ethers Contract instance from viem contract parameters
 * @param address Contract address
 * @param abi Contract ABI
 * @param signerOrProvider Ethers signer or provider
 * @returns Ethers Contract instance for 0G SDK
 */
export function createEthersContract(
  address: string,
  abi: any[],
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, abi, signerOrProvider);
}

/**
 * Converts viem hex string to ethers hex string (ensures 0x prefix)
 * @param hex Viem hex value
 * @returns Ethers-compatible hex string
 */
export function viemHexToEthersHex(hex: Hex): string {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
}

/**
 * Converts viem bigint to ethers BigNumber
 * @param value Viem bigint value
 * @returns Ethers BigNumber
 */
export function viemBigIntToEthersBigNumber(value: bigint): ethers.BigNumberish {
  return value.toString();
}

/**
 * Converts ethers BigNumber to viem bigint
 * @param value Ethers BigNumber
 * @returns Viem bigint
 */
export function ethersBigNumberToViemBigInt(value: ethers.BigNumberish): bigint {
  return BigInt(value.toString());
}

/**
 * Helper to get ethers signer from window.ethereum for 0G SDK
 * @param chainId Optional chain ID to connect to
 * @returns Ethers signer ready for 0G SDK
 */
export async function getEthersSignerForZeroG(chainId?: number): Promise<ethers.Signer> {
  // Prefer the connected RainbowKit/wagmi wallet client
  try {
    const activeChain = getActiveChain();
    const account = getAccount(wagmiConfig);
    if (account?.isConnected) {
      const walletClient = await getWalletClient(wagmiConfig, { chainId: chainId ?? activeChain.id });
      if (walletClient) {
        return await walletClientToEthersSigner(walletClient);
      }
    }
  } catch (e) {
    // Fall through to window.ethereum fallback
  }

  // Fallback to the injected provider for backward compatibility
  if (!window.ethereum) {
    throw new Error('No ethereum provider found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Switch chain if needed
  if (chainId) {
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(chainId)) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    }
  }

  return signer;
}

/**
 * Helper to get ethers provider for 0G SDK from RPC URL
 * @param rpcUrl RPC endpoint URL
 * @param chainId Optional chain ID
 * @returns Ethers provider ready for 0G SDK
 */
export function getEthersProviderForZeroG(
  rpcUrl: string, 
  chainId?: number
): ethers.JsonRpcProvider {
  const network = chainId ? { chainId, name: 'custom' } : undefined;
  return new ethers.JsonRpcProvider(rpcUrl, network);
}

/**
 * Adapter class for seamless integration between viem and 0G SDK
 */
export class ZeroGAdapter {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;

  constructor(
    rpcUrl: string,
    walletClient?: WalletClient
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (walletClient) {
      // We'll set signer asynchronously
      this.initSigner(walletClient);
    }
  }

  private async initSigner(walletClient: WalletClient) {
    this.signer = await walletClientToEthersSigner(walletClient);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getSigner(): Promise<ethers.Signer> {
    if (!this.signer) {
      // Fallback to getting signer from window.ethereum
      this.signer = await getEthersSignerForZeroG();
    }
    return this.signer;
  }

  /**
   * Wraps 0G SDK upload function with viem-compatible interface
   */
  async uploadToZeroG(
    file: File,
    options?: {
      tags?: string;
      expectedReplica?: number;
      skipTx?: boolean;
      fee?: bigint; // viem bigint
    }
  ) {
    const signer = await this.getSigner();
    
    // Convert viem types to ethers types for 0G SDK
    const ethersOptions = options ? {
      ...options,
      fee: options.fee ? BigInt(options.fee) : BigInt(0)
    } : undefined;

    // Here we'll call the actual 0G SDK upload
    // This will be implemented when we refactor uploader.ts
    return { success: true, mockImplementation: true };
  }
}

/**
 * Factory function to create adapter from viem clients
 */
export function createZeroGAdapter(
  publicClient: PublicClient,
  walletClient?: WalletClient
): ZeroGAdapter {
  const provider = publicClientToEthersProvider(publicClient);
  const rpcUrl = publicClient.chain?.rpcUrls.default.http[0] || '';
  
  return new ZeroGAdapter(rpcUrl, walletClient);
}
