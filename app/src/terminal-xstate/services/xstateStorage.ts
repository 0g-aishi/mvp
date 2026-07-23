/**
 * @fileoverview XState Storage Service for 0G Network Integration
 * @description Provides upload/download operations for blob storage using 0G Network infrastructure
 */

import { uploadFileComplete } from '../../lib/0g/uploader';
import { downloadByRootHashAPI } from '../../lib/0g/downloader';
import { getNetworkConfig, getDefaultNetworkType, NetworkType } from '../../lib/0g/network';
import { getProvider, getSigner } from '../../lib/0g/fees';
import { safeJsonStringifyPretty } from '../utils/jsonSerializer';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'xstateStorage' });

export interface UploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
  message?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

export interface StorageContext {
  networkType: NetworkType;
  walletAddress?: string;
}

/**
 * Storage service factory for XState machines
 */
export class XStateStorageService {
  private networkType: NetworkType;
  private networkConfig: ReturnType<typeof getNetworkConfig>;

  constructor(context?: StorageContext) {
    this.networkType = context?.networkType || getDefaultNetworkType();
    this.networkConfig = getNetworkConfig(this.networkType);
    
    log.debug('Storage service initialized', {
      networkType: this.networkType,
      storageRpc: this.networkConfig.storageRpc,
      l1Rpc: this.networkConfig.l1Rpc
    });
  }

  /**
   * Uploads a blob to 0G Storage
   */
  async uploadBlob(file: File): Promise<UploadResult> {
    try {
      log.debug('Starting blob upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Get provider and signer
      const [provider, providerErr] = await getProvider();
      if (!provider || providerErr) {
        throw new Error(`Provider error: ${providerErr?.message || 'No provider'}`);
      }

      const [signer, signerErr] = await getSigner(provider);
      if (!signer || signerErr) {
        throw new Error(`Signer error: ${signerErr?.message || 'No signer'}`);
      }

      // Upload using lib function
      const result = await uploadFileComplete(
        file,
        this.networkConfig.storageRpc,
        this.networkConfig.l1Rpc,
        signer
      );

      log.debug('Upload completed', {
        success: result.success,
        rootHash: result.rootHash,
        alreadyExists: result.alreadyExists
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.debug('Upload failed', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Downloads a blob from 0G Storage by root hash
   */
  async downloadBlob(rootHash: string): Promise<DownloadResult> {
    try {
      log.debug('Starting blob download', { rootHash });

      if (!rootHash || !rootHash.trim()) {
        throw new Error('Root hash is required');
      }

      // Download using lib function
      const [fileData, downloadError] = await downloadByRootHashAPI(
        rootHash,
        this.networkConfig.storageRpc
      );

      if (downloadError || !fileData) {
        throw downloadError || new Error('Download failed - no data received');
      }

      log.debug('Download completed', {
        rootHash,
        dataSize: fileData.byteLength
      });

      return {
        success: true,
        data: fileData
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.debug('Download failed', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Creates a File object from ArrayBuffer data
   */
  createFileFromBuffer(buffer: ArrayBuffer, fileName: string, mimeType = 'application/json'): File {
    const blob = new Blob([buffer], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * Converts ArrayBuffer to JSON object
   */
  bufferToJson(buffer: ArrayBuffer): any {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      return JSON.parse(text);
    } catch (error) {
      log.debug('Failed to parse buffer as JSON', { error });
      throw new Error('Invalid JSON data in buffer');
    }
  }

  /**
   * Converts JSON object to File for upload
   */
  jsonToFile(data: any, fileName: string): File {
    const jsonString = safeJsonStringifyPretty(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return new File([blob], fileName, { type: 'application/json' });
  }

  /**
   * Uploads JSON data as a file
   */
  async uploadJson(data: any, fileName: string): Promise<UploadResult> {
    const file = this.jsonToFile(data, fileName);
    return this.uploadBlob(file);
  }

  /**
   * Downloads and parses JSON data
   */
  async downloadJson(rootHash: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const result = await this.downloadBlob(rootHash);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    try {
      const jsonData = this.bufferToJson(result.data);
      return { success: true, data: jsonData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse JSON' 
      };
    }
  }

  /**
   * Gets current network configuration
   */
  getNetworkInfo() {
    return {
      networkType: this.networkType,
      networkName: this.networkConfig.name,
      storageRpc: this.networkConfig.storageRpc,
      l1Rpc: this.networkConfig.l1Rpc
    };
  }
}

/**
 * Factory function for creating storage service instances
 */
export function createStorageService(context?: StorageContext): XStateStorageService {
  return new XStateStorageService(context);
}

/**
 * XState service creator for use in machines with fromPromise
 */
export const storageServiceCreator = {
  uploadBlob: (file: File) => {
    const service = createStorageService();
    return service.uploadBlob(file);
  },
  
  downloadBlob: (rootHash: string) => {
    const service = createStorageService();
    return service.downloadBlob(rootHash);
  },
  
  uploadJson: (data: any, fileName: string) => {
    const service = createStorageService();
    return service.uploadJson(data, fileName);
  },
  
  downloadJson: (rootHash: string) => {
    const service = createStorageService();
    return service.downloadJson(rootHash);
  }
};

/**
 * Standalone helper functions for simpler imports
 * Used by chat and conversation services
 */
export async function uploadToStorage(data: any, fileName: string, onStatus?: (message: string) => void): Promise<UploadResult> {
  const service = new XStateStorageService();
  
  // If data is string (JSON), parse it first to validate
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
  
  log.debug('uploadToStorage called', {
    fileName,
    dataType: typeof data,
    isString: typeof data === 'string'
  });

  onStatus?.('Uploading conversation data...');
  const result = await service.uploadJson(jsonData, fileName);
  onStatus?.(result.success ? 'Upload successful' : `Upload failed: ${result.error || 'Unknown error'}`);
  return result;
}

export async function downloadFromStorage(rootHash: string): Promise<string> {
  const service = new XStateStorageService();
  
  log.debug('downloadFromStorage called', {
    rootHash: rootHash.substring(0, 10) + '...'
  });
  
  const result = await service.downloadJson(rootHash);
  
  // Fixed: Check result.success instead of just !result
  if (!result.success || !result.data) {
    const errorMsg = result.error || `Download failed for rootHash: ${rootHash}`;
    log.debug('Download failed', { error: errorMsg, rootHash });
    throw new Error(errorMsg);
  }
  
  // Return as string for compatibility with existing code
  return typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
}