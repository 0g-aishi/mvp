'use client';

import { useState, useCallback } from 'react';
import { downloadByRootHashAPI, downloadBlobAsFile } from '../../lib/0g/downloader';
import { getNetworkConfig, getDefaultNetworkType, NetworkType } from '../../lib/0g/network';
import { logger } from '@/lib/logger';

interface DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

interface UseStorageDownloadReturn {
  // Methods
  downloadFile: (rootHash: string) => Promise<DownloadResult>;
  downloadAndSave: (rootHash: string, fileName?: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  status: string;
  progress: number;
}

export function useStorageDownload(): UseStorageDownloadReturn {
  const log = logger.child({ component: 'useStorageDownload' });

  // Download state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // Network state
  const [networkType] = useState<NetworkType>(getDefaultNetworkType());

  const downloadFile = useCallback(async (rootHash: string): Promise<DownloadResult> => {
    if (!rootHash || !rootHash.trim()) {
      const error = 'Root hash is required';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setStatus('');
    
    try {
      setStatus('Preparing download...');
      setProgress(10);

      // Get network config
      const networkConfig = getNetworkConfig(networkType);
      
      setStatus('Downloading from 0G Storage...');
      setProgress(30);

      log.debug('Starting download', {
        rootHash,
        networkType,
        storageRpc: networkConfig.storageRpc
      });

      // Download using lib function
      const [fileData, downloadError] = await downloadByRootHashAPI(
        rootHash,
        networkConfig.storageRpc
      );

      setProgress(80);
      
      if (downloadError || !fileData) {
        throw downloadError || new Error('Download failed - no data received');
      }
      
      setStatus('Download completed successfully!');
      setProgress(100);

      log.debug('Download successful', {
        rootHash,
        dataSize: fileData.byteLength
      });

      return {
        success: true,
        data: fileData
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(errorMsg);
      setStatus(`Download failed: ${errorMsg}`);
      setProgress(0);

      log.error('Download error', { error });

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [networkType]);

  const downloadAndSave = useCallback(async (rootHash: string, fileName?: string): Promise<void> => {
    const result = await downloadFile(rootHash);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Download failed');
    }
    
    // Generate filename if not provided
    const finalFileName = fileName || `download-${rootHash.slice(-8)}.bin`;
    
    try {
      setStatus('Saving file...');
      downloadBlobAsFile(result.data, finalFileName);
      setStatus('File saved successfully!');

      log.debug('File saved', { fileName: finalFileName });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(`Failed to save file: ${errorMsg}`);
      throw error;
    }
  }, [downloadFile]);

  return {
    // Methods
    downloadFile,
    downloadAndSave,
    
    // State
    isLoading,
    error,
    status,
    progress
  };
} 