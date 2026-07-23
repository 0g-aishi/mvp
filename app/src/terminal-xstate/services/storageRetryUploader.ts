/**
 * @fileoverview Generic Storage Uploader with Retry & Verification
 * @description Reusable helper to upload JSON data to 0G Storage with exponential backoff and optional verification
 */

import { XStateStorageService } from './xstateStorage';
import { safeJsonStringify } from '../utils/jsonSerializer';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'storageRetryUploader' });

export type RetryOptions = {
  enableVerification?: boolean;
  maxRetries?: number;
  retryDelay?: number; // ms
  verificationTimeout?: number; // ms
};

const DEFAULT_OPTS: Required<RetryOptions> = {
  enableVerification: true,
  maxRetries: 3,
  retryDelay: 1000,
  verificationTimeout: 10_000
};

export interface GenericUploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  alreadyExists?: boolean;
  verified?: boolean;
  error?: string;
}

export async function uploadJsonWithRetry(
  data: any,
  fileName: string,
  options?: RetryOptions,
  onStatus?: (message: string) => void
): Promise<GenericUploadResult> {
  const opts = { ...DEFAULT_OPTS, ...(options || {}) } as Required<RetryOptions>;
  const storage = new XStateStorageService();

  const emit = (msg: string) => onStatus?.(msg);
  const start = Date.now();

  // Basic validation
  if (!fileName || !fileName.endsWith('.json')) {
    return { success: false, error: 'Invalid filename (must end with .json)' };
  }

  try {
    emit('Preparing upload payload');

    const uploadResult = await uploadWithRetry(storage, data, fileName, opts, emit);
    if (!uploadResult.success || !uploadResult.rootHash) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    emit('Upload complete, verifying...');

    let verified = false;
    if (opts.enableVerification) {
      const verifyRes = await verifyUpload(storage, uploadResult.rootHash, data, opts.verificationTimeout);
      verified = verifyRes.success;
      emit(verified ? 'Upload verified successfully' : `Upload verification failed${verifyRes.error ? `: ${verifyRes.error}` : ''}`);
    }

    log.debug('Upload finished', {
      fileName,
      rootHash: uploadResult.rootHash,
      verified,
      tookMs: Date.now() - start
    });

    return {
      success: true,
      rootHash: uploadResult.rootHash,
      txHash: uploadResult.txHash,
      alreadyExists: uploadResult.alreadyExists,
      verified
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.debug('Upload failed', { error: msg });
    emit(`Upload failed: ${msg}`);
    return { success: false, error: msg };
  }
}

async function uploadWithRetry(
  storage: XStateStorageService,
  data: any,
  fileName: string,
  opts: Required<RetryOptions>,
  onStatus?: (m: string) => void
) {
  let lastError = '';
  const base = Math.max(opts.retryDelay, 250);
  const cap = 20_000;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    const label = `${attempt}/${opts.maxRetries}`;
    log.debug(`Upload attempt ${label}`, { fileName });
    onStatus?.(`Upload attempt ${label}…`);

    try {
      const res = await storage.uploadJson(data, fileName);
      if (res.success) {
        onStatus?.(res.alreadyExists ? 'Upload skipped (already exists)' : 'Upload successful');
        return res;
      }
      lastError = res.error || 'Unknown upload error';
      onStatus?.(`Upload failed: ${lastError}`);
      log.debug(`Attempt ${attempt} failed`, { lastError });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      onStatus?.(`Upload error: ${lastError}`);
      log.debug(`Attempt ${attempt} threw`, { lastError });
    }

    if (attempt < opts.maxRetries) {
      const delay = Math.min(base * Math.pow(2, attempt - 1), cap) + Math.floor(Math.random() * Math.min(base, 1000));
      onStatus?.(`Retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { success: false, error: `Upload failed after ${opts.maxRetries} attempts. Last error: ${lastError}` };
}

async function verifyUpload(
  storage: XStateStorageService,
  rootHash: string,
  original: any,
  timeout: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Verification timeout')), timeout));
    const verifyPromise = (async () => {
      const downloaded = await storage.downloadJson(rootHash);
      if (!downloaded.success || downloaded.data === undefined) {
        throw new Error(downloaded.error || 'Verification download failed');
      }
      const equal = compareJsonGeneric(original, downloaded.data);
      if (!equal) {
        throw new Error('Uploaded data does not match original data');
      }
    })();
    await Promise.race([verifyPromise, timeoutPromise]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function compareJsonGeneric(a: any, b: any): boolean {
  try {
    // For arrays, compare by stringified content (BigInt-safe)
    const as = safeJsonStringify(a);
    const bs = safeJsonStringify(b);
    return as === bs;
  } catch (e) {
    log.debug('compareJsonGeneric failed', { error: String(e) });
    return false;
  }
}
