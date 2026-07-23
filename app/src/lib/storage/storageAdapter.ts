/**
 * @fileoverview Storage Adapter for switching between 0G Storage and AISHI Local Storage
 * @description Provides unified interface for storage operations with environment-based switching
 */

import { keccak256, toHex } from 'viem';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'StorageAdapter' });

/**
 * Check if we should use local AISHI storage instead of 0G
 */
export function useLocalStorage(): boolean {
  return process.env.NEXT_PUBLIC_STORAGE_AS_DATABASE === 'true';
}

/**
 * Get the appropriate storage endpoint
 */
export function getStorageEndpoint(): string {
  if (useLocalStorage()) {
    // Use AISHI storage API - configured via environment variable
    return `${process.env.NEXT_PUBLIC_AISHI_STORAGE_URL}/storage`;
  }
  // Use 0G storage RPC
  return process.env.NEXT_PUBLIC_STANDARD_STORAGE_RPC || 'https://indexer-storage-testnet-standard.0g.ai';
}

/**
 * Upload file to storage (adapter)
 */
export async function uploadFileAdapter(
  file: File,
  storageRpc?: string,
  l1Rpc?: string,
  signer?: any
): Promise<{
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
}> {
  if (useLocalStorage()) {
    log.debug('Using AISHI local storage for upload', {
      fileName: file.name,
      fileSize: file.size
    });
    return uploadToAishiStorage(file);
  } else {
    log.debug('Using 0G network storage for upload', {
      fileName: file.name,
      fileSize: file.size,
      storageRpc
    });
    // Import and use original 0G uploader
    const { uploadFileComplete: upload0G } = await import('../0g/uploader');
    return upload0G(file, storageRpc!, l1Rpc!, signer);
  }
}

/**
 * Download file from storage (adapter)
 */
export async function downloadFileAdapter(
  rootHash: string,
  storageRpc?: string
): Promise<[ArrayBuffer | null, Error | null]> {
  if (useLocalStorage()) {
    log.debug('Using AISHI local storage for download', {
      rootHash: rootHash.substring(0, 10) + '...'
    });
    return downloadFromAishiStorage(rootHash);
  } else {
    log.debug('Using 0G network storage for download', {
      rootHash: rootHash.substring(0, 10) + '...',
      storageRpc
    });
    // Import and use original 0G downloader
    const { downloadByRootHashAPI: download0G } = await import('../0g/downloader');
    return download0G(rootHash, storageRpc!);
  }
}

/**
 * Upload to AISHI local storage
 */
async function uploadToAishiStorage(file: File): Promise<{
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
}> {
  try {
    const endpoint = getStorageEndpoint();
    log.debug('Uploading to AISHI storage', {
      endpoint,
      fileName: file.name,
      fileSize: file.size
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    // Send to AISHI storage API
    const response = await fetch(`${endpoint}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    log.info('AISHI upload successful', {
      rootHash: result.rootHash?.substring(0, 10) + '...',
      alreadyExists: result.alreadyExists
    });

    return {
      success: true,
      rootHash: result.rootHash,
      txHash: result.txHash || undefined,
      alreadyExists: result.alreadyExists || false
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('AISHI upload failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Download from AISHI local storage
 */
async function downloadFromAishiStorage(rootHash: string): Promise<[ArrayBuffer | null, Error | null]> {
  try {
    const endpoint = getStorageEndpoint();
    log.debug('Downloading from AISHI storage', {
      endpoint,
      rootHash: rootHash.substring(0, 10) + '...'
    });

    // Fetch from AISHI storage API
    const response = await fetch(`${endpoint}/file?root=${rootHash}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed: ${response.status} - ${errorText}`);
    }

    // Get file data as ArrayBuffer
    const fileData = await response.arrayBuffer();

    if (!fileData || fileData.byteLength === 0) {
      throw new Error('Downloaded file is empty');
    }

    log.info('AISHI download successful', {
      rootHash: rootHash.substring(0, 10) + '...',
      dataSize: fileData.byteLength
    });

    return [fileData, null];

  } catch (error) {
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    log.error('AISHI download failed', { error: errorMessage.message });
    return [null, errorMessage];
  }
}

/**
 * Generate root hash for a file (compatible with 0G)
 * Uses viem's keccak256 for consistency
 */
export async function generateRootHash(file: File): Promise<string> {
  try {
    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Add timestamp for uniqueness
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampBytes = new Uint8Array(4);
    new DataView(timestampBytes.buffer).setUint32(0, timestamp, true);

    // Combine file content with timestamp
    const combined = new Uint8Array(uint8Array.length + timestampBytes.length);
    combined.set(uint8Array, 0);
    combined.set(timestampBytes, uint8Array.length);

    // Generate hash using viem's keccak256
    const hash = keccak256(combined);

    log.debug('Generated root hash', {
      fileName: file.name,
      fileSize: file.size,
      hash: hash.substring(0, 10) + '...'
    });

    return hash;
  } catch (error) {
    log.error('Failed to generate root hash', { error: String(error) });
    throw error;
  }
}

/**
 * Check if hash is empty (all zeros)
 */
export function isEmptyHash(hash: string): boolean {
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
  return !hash || hash === emptyHash || hash === '0x0' || hash.length < 10;
}

/**
 * Get storage mode for debugging
 */
export function getStorageMode(): string {
  return useLocalStorage() ? 'AISHI_LOCAL' : '0G_NETWORK';
}