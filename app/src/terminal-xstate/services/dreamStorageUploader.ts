/**
 * @fileoverview Dream Storage Uploader for XState Terminal
 * @description Secure uploader to 0G Storage with verification and error handling
 */

import { XStateStorageService, UploadResult } from './xstateStorage';
import { StandardDreamFields } from './dreamDataValidator';
import { safeJsonStringify } from '../utils/jsonSerializer';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'DreamStorageUploader' });

/**
 * Secure upload result interface
 */
export interface SecureUploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  verified?: boolean;
  metadata?: {
    fileName: string;
    fileSize: number;
    dreamsCount: number;
    uploadTime: number;
    verificationTime?: number;
  };
}

/**
 * Upload configuration options
 */
export interface UploadConfig {
  enableVerification: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  verificationTimeout: number; // milliseconds
}

/**
 * Default upload configuration
 */
const DEFAULT_CONFIG: UploadConfig = {
  enableVerification: true,
  maxRetries: 3,
  retryDelay: 1000,
  verificationTimeout: 10000
};

/**
 * Main function to securely upload dream data to 0G Storage
 */
export async function uploadDreamDataSecurely(
  dreamFileData: StandardDreamFields[],
  fileName: string,
  config: Partial<UploadConfig> = {},
  statusCallback?: (message: string) => void
): Promise<SecureUploadResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const emitStatus = (message: string) => {
    statusCallback?.(message);
  };

  emitStatus('Preparing upload payload');

  log.debug('Starting secure dream data upload', {
    fileName,
    dreamsCount: dreamFileData.length,
    fileSize: safeJsonStringify(dreamFileData).length,
    config: finalConfig
  });

  const uploadStartTime = Date.now();

  try {
    // Validate input data
    const validationResult = validateUploadData(dreamFileData, fileName);
    if (!validationResult.isValid) {
      throw new Error(`Upload validation failed: ${validationResult.error}`);
    }

    // Create storage service
    const storageService = new XStateStorageService();

    // Attempt upload with retry logic
    const uploadResult = await uploadWithRetry(
      storageService,
      dreamFileData,
      fileName,
      finalConfig,
      emitStatus
    );

    if (!uploadResult.success || !uploadResult.rootHash) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    emitStatus('Upload complete, verifying...');

    log.debug('Upload completed successfully', {
      rootHash: uploadResult.rootHash.substring(0, 10) + '...',
      txHash: uploadResult.txHash?.substring(0, 10) + '...',
      uploadTime: Date.now() - uploadStartTime
    });

    // Perform verification if enabled
    let verified = false;
    let verificationTime: number | undefined;

    if (finalConfig.enableVerification) {
      log.debug('Starting upload verification');
      const verificationStartTime = Date.now();
      
      const verificationResult = await verifyUpload(
        storageService,
        uploadResult.rootHash,
        dreamFileData,
        finalConfig.verificationTimeout
      );

      verified = verificationResult.success;
      verificationTime = Date.now() - verificationStartTime;

      if (!verified) {
        log.debug('Upload verification failed', { error: verificationResult.error });
        // Note: We don't fail the entire upload if verification fails
        // The upload itself was successful, verification is additional safety
        emitStatus('Upload verification failed');
      } else {
        log.debug('Upload verification successful', { verificationTime });
        emitStatus('Upload verified successfully');
      }
    }

    return {
      success: true,
      rootHash: uploadResult.rootHash,
      txHash: uploadResult.txHash,
      verified,
      metadata: {
        fileName,
        fileSize: safeJsonStringify(dreamFileData).length,
        dreamsCount: dreamFileData.length,
        uploadTime: Date.now() - uploadStartTime,
        verificationTime
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Secure upload failed', { 
      error: errorMessage,
      uploadTime: Date.now() - uploadStartTime
    });

    emitStatus(`Upload failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      verified: false
    };
  }
}

/**
 * Upload with retry logic
 */
async function uploadWithRetry(
  storageService: XStateStorageService,
  dreamFileData: StandardDreamFields[],
  fileName: string,
  config: UploadConfig,
  onStatus?: (message: string) => void
): Promise<UploadResult> {
  let lastError = '';
  const baseDelay = Math.max(config.retryDelay, 250);
  const maxDelay = 20000; // cap wait times to 20s to avoid runaway delays

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const attemptLabel = `${attempt}/${config.maxRetries}`;
    log.debug(`Upload attempt ${attemptLabel}`, { fileName });
    onStatus?.(`Upload attempt ${attemptLabel}…`);

    try {
      const result = await storageService.uploadJson(dreamFileData, fileName);

      if (result.success) {
        log.debug(`Upload successful on attempt ${attempt}`, {
          rootHash: result.rootHash?.substring(0, 10) + '...'
        });
        onStatus?.(result.alreadyExists ? 'Upload skipped (already exists)' : 'Upload successful');
        return result;
      }

      lastError = result.error || 'Unknown upload error';
      log.debug(`Upload attempt ${attempt} failed`, { error: lastError });
      onStatus?.(`Upload failed: ${lastError}`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      log.debug(`Upload attempt ${attempt} threw error`, { error: lastError });
      onStatus?.(`Upload error: ${lastError}`);
    }

    if (attempt < config.maxRetries) {
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.floor(Math.random() * Math.min(baseDelay, 1000));
      const waitTime = exponentialDelay + jitter;
      log.debug(`Waiting ${waitTime}ms before retry`, { attempt, exponentialDelay, jitter });
      onStatus?.(`Retrying in ${waitTime}ms…`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `Upload failed after ${config.maxRetries} attempts. Last error: ${lastError}`
  };
}

/**
 * Verify upload by downloading and comparing data
 */
async function verifyUpload(
  storageService: XStateStorageService,
  rootHash: string,
  originalData: StandardDreamFields[],
  timeout: number
): Promise<{ success: boolean; error?: string }> {
  log.debug('Starting upload verification', { 
    rootHash: rootHash.substring(0, 10) + '...',
    originalDataLength: originalData.length
  });

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Verification timeout')), timeout);
    });

    // Create verification promise
    const verificationPromise = performVerification(storageService, rootHash, originalData);

    // Race between verification and timeout
    await Promise.race([verificationPromise, timeoutPromise]);

    log.debug('Upload verification completed successfully');
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Upload verification failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Perform the actual verification
 */
async function performVerification(
  storageService: XStateStorageService,
  rootHash: string,
  originalData: StandardDreamFields[]
): Promise<void> {
  // Download the uploaded data
  const downloadResult = await storageService.downloadJson(rootHash);

  if (!downloadResult.success || !downloadResult.data) {
    throw new Error(`Verification download failed: ${downloadResult.error}`);
  }

  const uploadedData = downloadResult.data;

  // Compare the data
  const isIdentical = compareJsonData(originalData, uploadedData);

  if (!isIdentical) {
    throw new Error('Uploaded data does not match original data');
  }

  log.debug('Data comparison successful - upload verified');
}

/**
 * Compare two JSON datasets for equality
 */
function compareJsonData(original: StandardDreamFields[], uploaded: any): boolean {
  try {
    // Convert both to strings for comparison
    const originalStr = safeJsonStringify(sortDreamsForComparison(original));
    const uploadedStr = safeJsonStringify(sortDreamsForComparison(uploaded));

    const isEqual = originalStr === uploadedStr;

    log.debug('JSON comparison completed', {
      isEqual,
      originalLength: originalStr.length,
      uploadedLength: uploadedStr.length
    });

    return isEqual;

  } catch (error) {
    log.debug('JSON comparison failed', { error: String(error) });
    return false;
  }
}

/**
 * Sort dreams consistently for comparison
 */
function sortDreamsForComparison(dreams: any): any {
  if (!Array.isArray(dreams)) {
    return dreams;
  }

  return dreams
    .slice() // Create copy
    .sort((a, b) => {
      // Sort by ID first, then by timestamp
      if (a.id !== b.id) {
        return (a.id || 0) - (b.id || 0);
      }
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
}

/**
 * Validate data before upload
 */
function validateUploadData(
  dreamFileData: StandardDreamFields[],
  fileName: string
): { isValid: boolean; error?: string } {
  // Validate filename
  if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
    return { isValid: false, error: 'Invalid filename' };
  }

  if (!fileName.endsWith('.json')) {
    return { isValid: false, error: 'Filename must end with .json' };
  }

  if (fileName.length > 255) {
    return { isValid: false, error: 'Filename too long (max 255 characters)' };
  }

  // Validate dream data
  if (!Array.isArray(dreamFileData)) {
    return { isValid: false, error: 'Dream data must be an array' };
  }

  if (dreamFileData.length === 0) {
    return { isValid: false, error: 'Dream data array cannot be empty' };
  }

  // Validate file size (approximate)
  const fileSize = safeJsonStringify(dreamFileData).length;
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  if (fileSize > maxSize) {
    return { isValid: false, error: `File size too large: ${fileSize} bytes (max ${maxSize})` };
  }

  // Basic validation of dream objects
  for (let i = 0; i < dreamFileData.length; i++) {
    const dream = dreamFileData[i];
    
    if (!dream || typeof dream !== 'object') {
      return { isValid: false, error: `Invalid dream object at index ${i}` };
    }

    if (typeof dream.id !== 'number' || dream.id <= 0) {
      return { isValid: false, error: `Invalid dream ID at index ${i}` };
    }

    if (typeof dream.date !== 'string' || dream.date.length === 0) {
      return { isValid: false, error: `Invalid dream date at index ${i}` };
    }
  }

  return { isValid: true };
}

/**
 * Create a test upload for validation (useful for debugging)
 */
export async function testUpload(): Promise<SecureUploadResult> {
  const testDream: StandardDreamFields = {
    id: 999999,
    date: new Date().toISOString().split('T')[0],
    timestamp: Math.floor(Date.now() / 1000),
    emotions: ['test'],
    symbols: ['test_symbol'],
    intensity: 5,
    lucidity: 3
  };

  const testFileName = `test_${Date.now()}_daily_dreams.json`;

  log.debug('Performing test upload', { testFileName });

  return await uploadDreamDataSecurely([testDream], testFileName, {
    enableVerification: true,
    maxRetries: 1,
    retryDelay: 500,
    verificationTimeout: 5000
  });
}

/**
 * Get upload statistics
 */
export function getUploadStats(dreamFileData: StandardDreamFields[]): {
  totalDreams: number;
  estimatedSize: number;
  oldestDream: string | null;
  newestDream: string | null;
  averageIntensity: number;
} {
  if (!dreamFileData.length) {
    return {
      totalDreams: 0,
      estimatedSize: 0,
      oldestDream: null,
      newestDream: null,
      averageIntensity: 0
    };
  }

  const estimatedSize = safeJsonStringify(dreamFileData).length;
  const sortedByDate = [...dreamFileData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalIntensity = dreamFileData.reduce((sum, dream) => sum + (dream.intensity || 0), 0);
  const averageIntensity = totalIntensity / dreamFileData.length;

  return {
    totalDreams: dreamFileData.length,
    estimatedSize,
    oldestDream: sortedByDate[0]?.date || null,
    newestDream: sortedByDate[sortedByDate.length - 1]?.date || null,
    averageIntensity: Math.round(averageIntensity * 10) / 10
  };
}
