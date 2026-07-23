/**
 * @fileoverview 0G Storage upload functionality using viem adapter
 * @description Handles file uploads to 0G Network storage using @0glabs/0g-ts-sdk
 * with ethers compatibility through viemAdapter
 */

import { Indexer, Blob, ZgFile, StorageNode, Uploader, getFlowContract } from '@0glabs/0g-ts-sdk';
import { Contract } from 'ethers';
import { getEthersSignerForZeroG } from './adapter/viemAdapter';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'Upload0G' });

/**
 * Submits a transaction to the flow contract
 * @param flowContract The flow contract
 * @param submission The submission object
 * @param value The value to send with the transaction
 * @returns A promise that resolves to the transaction result and any error
 */
export async function submitTransaction(
  flowContract: Contract, 
  submission: any, 
  value: bigint
): Promise<[any | null, Error | null]> {
  try {
    const tx = await flowContract.submit(submission, { value });
    const receipt = await tx.wait();
    return [{ tx, receipt }, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Uploads a file to 0G storage (like 0gdrive-main implementation)
 * @param blob The blob to upload
 * @param storageRpc The storage RPC URL
 * @param l1Rpc The L1 RPC URL
 * @param signer The signer (now using adapter)
 * @param uniqueTag Optional unique tag for upload
 * @returns A promise that resolves to upload result and any error
 */
export async function uploadToStorage(
  blob: Blob, 
  storageRpc: string, 
  l1Rpc: string, 
  signer: any,
  uniqueTag?: string
): Promise<[{ success: boolean; txHash?: string; alreadyExists: boolean } | null, Error | null]> {
  try {
    log.debug('Starting upload to 0G storage');
    log.debug('Storage configuration', { storageRpc, uniqueTag });

    const indexer = new Indexer(storageRpc);

    // Prefer full transaction path (no skipTx) to align with SDK's Uploader
    const uploadOptions = {
      taskSize: 10,
      expectedReplica: 1,
      finalityRequired: true,
      tags: uniqueTag || '0x',
      // fee: BigInt(0) // let SDK calculate price if omitted
    };

    log.debug('Upload options configured', uploadOptions);

    // If running over HTTPS and storage nodes are HTTP, use HTTPS proxy route
    const useProxy = typeof window !== 'undefined' && window.location.protocol === 'https:';
    let uploadResult: any;

    if (useProxy) {
      try {
        // Discover nodes and build proxied clients
        const nodes = await indexer.getShardedNodes();
        const trusted = nodes?.trusted || [];
        if (!trusted.length) {
          throw new Error('No storage nodes returned by indexer');
        }
        // Prefer indexer's selection logic for proper shard/replica coverage
        let clients: StorageNode[] = [] as any;
        try {
          const expected = Math.max(1, uploadOptions.expectedReplica || 1);
          const [selected, selErr] = await (indexer as any).selectNodes(expected);
          if (selErr || !selected || !selected.length) {
            throw selErr || new Error('Indexer.selectNodes returned no nodes');
          }
          const toClientUrl = (raw: string) => {
            try {
              const u = new URL(raw);
              if (u.protocol === 'https:') return raw;
            } catch {}
            return `${window.location.origin}/api/storage-proxy?target=${encodeURIComponent(raw)}`;
          };
          clients = selected.map((c: any) => new StorageNode(toClientUrl(String(c.url || ''))));
        } catch (selError) {
          // Fallback: use all trusted + discovered nodes (proxied)
          const toClientUrl = (raw: string) => {
            try {
              const u = new URL(raw);
              if (u.protocol === 'https:') return raw;
            } catch {}
            return `${window.location.origin}/api/storage-proxy?target=${encodeURIComponent(raw)}`;
          };
          const discovered = Array.isArray((nodes as any)?.discovered) ? (nodes as any).discovered : [];
          const all = [...trusted, ...discovered];
          clients = all.map((n: any) => new StorageNode(toClientUrl(String(n.url || ''))));
        }

        // Get network identity via proxy
        const status = await clients[0].getStatus();
        if (!status?.networkIdentity?.flowAddress) {
          throw new Error('Failed to query storage node status via proxy');
        }

        // Create flow contract bound to signer
        const flow = getFlowContract(status.networkIdentity.flowAddress, signer);

        // Create uploader manually with proxied clients
        const uploader = new Uploader(clients as any, l1Rpc, flow);
        const retryOpts = { Retries: 10, Interval: 3, MaxGasPrice: 0, TooManyDataRetries: 3 } as any;
        uploadResult = await uploader.uploadFile(blob as any, uploadOptions as any, retryOpts);
      } catch (proxyErr) {
        log.warn('Proxy upload path failed, falling back to direct indexer.upload', { error: String(proxyErr).slice(0, 200) });
        uploadResult = await indexer.upload(blob, l1Rpc, signer, uploadOptions);
      }
    } else {
      // Non-HTTPS context can use direct upload
      uploadResult = await indexer.upload(blob, l1Rpc, signer, uploadOptions);
    }
    log.debug('Upload result received', uploadResult);
    
    // Handle different result formats (like 0gdrive-main)
    if (Array.isArray(uploadResult) && uploadResult.length === 2) {
      const [result, error] = uploadResult as [{ txHash?: string; rootHash?: string } | string, any];
      
      if (error) {
        // Check if it's "Data already exists" error
        if (error.message && error.message.includes('Data already exists')) {
          log.info('Data already exists - successful upload');
          return [{
            success: true,
            alreadyExists: true,
            message: 'File already exists in storage'
          }, null];
        } else {
          return [null, error];
        }
      } else if (result) {
        // Support both legacy string txHash and new object { txHash, rootHash }
        if (typeof result === 'string') {
          return [{ success: true, txHash: result, alreadyExists: false, message: 'File uploaded successfully' }, null];
        }
        return [{ success: true, txHash: result.txHash, alreadyExists: false, message: 'File uploaded successfully' }, null];
      }
    }

    // Default success case
    // If SDK returned a plain txHash string on success (Uploader.uploadFile)
    if (typeof uploadResult === 'string' && uploadResult.startsWith('0x')) {
      return [{
        success: true,
        txHash: uploadResult,
        alreadyExists: false,
        message: 'File uploaded successfully'
      }, null];
    }

    // Default success case when no explicit error returned
    return [{ success: true, alreadyExists: false, message: 'File uploaded successfully' }, null];
  } catch (error) {
    log.error('Upload error', { error });
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Creates a 0G SDK blob from file data
 * @param file The file to convert
 * @returns A promise that resolves to the 0G SDK blob and any error
 */
export async function createBlobFromFile(file: File): Promise<[Blob | null, Error | null]> {
  try {
    // Create 0G SDK Blob directly from File object
    // This is the correct way - 0G SDK Blob constructor takes File directly
    const blob = new Blob(file);
    return [blob, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Creates a ZgFile from file path (for Node.js environments)
 * @param filePath Path to the file
 * @returns A promise that resolves to the ZgFile and any error
 */
export async function createZgFileFromPath(filePath: string): Promise<[ZgFile | null, Error | null]> {
  try {
    const zgFile = await ZgFile.fromFilePath(filePath);
    return [zgFile, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

// Note: generateMerkleTree function removed - 0G SDK Blob has built-in merkleTree() method

/**
 * Complete upload flow for a file with viem adapter integration
 * @param file The file to upload
 * @param l1Rpc The L1 RPC URL
 * @param storageRpc The storage RPC URL
 * @param signer Optional ethers signer to be used for the upload
 * @returns Upload result with root hash and transaction info
 */
export async function uploadFileComplete(
  file: File,
  storageRpc: string,
  l1Rpc: string,
  signer?: any
): Promise<{
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
}> {
  try {
    // Check if we should use local storage adapter
    if (process.env.NEXT_PUBLIC_STORAGE_AS_DATABASE === 'true') {
      log.info('Using AISHI Storage Adapter');
      const { uploadFileAdapter } = await import('../storage/storageAdapter');
      return await uploadFileAdapter(file, storageRpc, l1Rpc, signer);
    }

    log.debug('Starting complete upload flow', { fileName: file.name, fileSize: file.size });

    // 1. Create 0G SDK Blob from file
    const [blob, blobErr] = await createBlobFromFile(file);
    if (!blob || blobErr) {
      return { success: false, error: `Failed to create blob: ${blobErr?.message}` };
    }
    log.debug('0G SDK Blob created successfully');

    // 2. Generate unique tag for upload (like 0gdrive-main)
    const [merkleTree, merkleErr] = await blob.merkleTree();
    if (!merkleTree || merkleErr) {
      return { success: false, error: `Failed to create merkle tree: ${merkleErr?.message}` };
    }
    const rootHashHex = merkleTree.rootHash();
    if (!rootHashHex) {
      return { success: false, error: 'Failed to get root hash from merkle tree' };
    }
    const uniqueTag = rootHashHex; // Already includes 0x prefix
    log.debug('Root hash generated', { rootHash: uniqueTag });

    // 3. Get signer using adapter (prefer provided signer)
    log.debug('Resolving signer for upload');
    const adapterSigner = signer ?? (await getEthersSignerForZeroG());
    log.debug('Signer resolved');

    // 4. Upload to 0G storage
    const [uploadResult, uploadErr] = await uploadToStorage(
      blob, 
      storageRpc, 
      l1Rpc, 
      adapterSigner,
      uniqueTag
    );
    
    if (!uploadResult || uploadErr) {
      return { 
        success: false, 
        error: `Upload failed: ${uploadErr?.message}` 
      };
    }

    // 5. Return success with root hash
    return {
      success: true,
      rootHash: uniqueTag,
      txHash: uploadResult.txHash,
      alreadyExists: uploadResult.alreadyExists
    };

  } catch (error) {
    log.error('Upload complete flow error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
