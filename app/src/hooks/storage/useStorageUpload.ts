'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '../useWallet';
import { uploadFileComplete } from '../../lib/0g/uploader';
import { calculateBasicStorageFee, FeeInfo, getProvider, getSigner } from '../../lib/0g/fees';
import { getNetworkConfig, getDefaultNetworkType, NetworkType } from '../../lib/0g/network';
import { logger } from '@/lib/logger';

interface UploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
}

interface UseStorageUploadReturn {
  // Methods
  calculateFees: (file: File) => void;
  uploadFile: (file: File) => Promise<UploadResult>;
  
  // State
  isLoading: boolean;
  error: string | null;
  status: string;
  progress: number;
  rootHash: string | null;
  
  // Fee Info
  feeInfo: FeeInfo | null;
  
  // Wallet & Network
  isWalletConnected: boolean;
  walletAddress: string;
  networkType: NetworkType;
  getCurrentNetwork: () => ReturnType<typeof getNetworkConfig>;
}

export function useStorageUpload(): UseStorageUploadReturn {
  const log = logger.child({ component: 'useStorageUpload' });
  const { isConnected, address } = useWallet();

  // Upload state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [rootHash, setRootHash] = useState<string | null>(null);

  // Fee state
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);

  // Network state
  const [networkType] = useState<NetworkType>(getDefaultNetworkType());

  const calculateFees = useCallback((file: File) => {
    try {
      setError(null);
      const fees = calculateBasicStorageFee(file.size);
      setFeeInfo(fees);

      log.debug('Calculated fees', { fees });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(`Fee calculation failed: ${errorMsg}`);
      log.error('Fee calculation error', { error });
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    if (!isConnected || !address) {
      const error = 'Wallet not connected';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setRootHash(null);
    
    try {
      setStatus('Preparing file upload...');
      setProgress(10);

      // Get network config
      const networkConfig = getNetworkConfig(networkType);
      
      setStatus('Uploading to 0G Storage...');
      setProgress(30);

      log.debug('Starting upload', {
        fileName: file.name,
        fileSize: file.size,
        networkType,
        storageRpc: networkConfig.storageRpc
      });

      // Get provider and signer
      const [provider, providerErr] = await getProvider();
      if (!provider || providerErr) {
        throw new Error(`Provider error: ${providerErr?.message}`);
      }

      const [signer, signerErr] = await getSigner(provider);
      if (!signer || signerErr) {
        throw new Error(`Signer error: ${signerErr?.message}`);
      }

      // Upload using lib function
      const result = await uploadFileComplete(
        file,
        networkConfig.storageRpc,
        networkConfig.l1Rpc,
        signer
      );

      setProgress(80);
      
      if (result.success) {
        setStatus('Upload completed successfully!');
        setProgress(100);
        setRootHash(result.rootHash || null);

        log.debug('Upload successful', {
          rootHash: result.rootHash,
          txHash: result.txHash,
          alreadyExists: result.alreadyExists
        });

        return {
          success: true,
          rootHash: result.rootHash,
          txHash: result.txHash,
          alreadyExists: result.alreadyExists
        };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(errorMsg);
      setStatus(`Upload failed: ${errorMsg}`);
      setProgress(0);

      log.error('Upload error', { error });

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, networkType]);

  const getCurrentNetwork = useCallback(() => {
    return getNetworkConfig(networkType);
  }, [networkType]);

  return {
    // Methods
    calculateFees,
    uploadFile,
    
    // State
    isLoading,
    error,
    status,
    progress,
    rootHash,
    
    // Fee Info
    feeInfo,
    
    // Wallet & Network
    isWalletConnected: isConnected,
    walletAddress: address || '',
    networkType,
    getCurrentNetwork
  };
} 