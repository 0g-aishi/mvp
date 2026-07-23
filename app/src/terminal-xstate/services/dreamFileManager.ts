/**
 * @fileoverview Dream File Manager for XState Terminal
 * @description Manages daily_dreams.json files with re-upload logic and proper naming
 */

import { XStateStorageService } from './xstateStorage';
import { StandardDreamFields } from './dreamDataValidator';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'DreamFileManager' });

/**
 * File management result interface
 */
export interface FileManagementResult {
  success: boolean;
  data?: StandardDreamFields[];
  fileName?: string;
  isNewFile?: boolean;
  error?: string;
  metadata?: {
    existingDreamsCount: number;
    totalDreamsCount: number;
    originalFileName?: string;
  };
}

/**
 * File state interface for tracking operations
 */
export interface DreamFileState {
  isDownloading: boolean;
  isProcessing: boolean;
  isReady: boolean;
  error: string | null;
  fileExists: boolean;
  fileName: string;
  dreamsCount: number;
}

/**
 * Main function to manage daily dreams file with re-upload logic
 */
export async function manageDailyDreamsFile(
  agentName: string,
  newDreamData: StandardDreamFields,
  currentRootHash?: string
): Promise<FileManagementResult> {
  log.debug('Starting dream file management', {
    agentName,
    dreamId: newDreamData.id,
    dreamDate: newDreamData.date,
    hasCurrentHash: !!currentRootHash,
    currentRootHash: currentRootHash?.substring(0, 10) + '...'
  });

  try {
    const storageService = new XStateStorageService();
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Always generate new filename with current timestamp
    const newFileName = generateDreamFileName(agentName, timestamp);
    
    // Check if existing file should be downloaded
    const shouldDownloadExisting = currentRootHash && !isEmptyHash(currentRootHash);
    
    if (shouldDownloadExisting) {
      log.debug('Existing file detected, downloading for merge', { 
        currentRootHash: currentRootHash!.substring(0, 10) + '...' 
      });
      
      return await handleExistingFile(
        storageService,
        currentRootHash!,
        newDreamData,
        newFileName
      );
    } else {
      log.debug('No existing file, creating new file', { fileName: newFileName });
      
      return await handleNewFile(newDreamData, newFileName);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Dream file management failed', { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Handle scenario when existing file needs to be downloaded and updated
 */
async function handleExistingFile(
  storageService: XStateStorageService,
  currentRootHash: string,
  newDreamData: StandardDreamFields,
  newFileName: string
): Promise<FileManagementResult> {
  log.debug('Downloading existing dreams file', { 
    rootHash: currentRootHash.substring(0, 10) + '...' 
  });

  try {
    // Download existing file
    const downloadResult = await storageService.downloadJson(currentRootHash);
    
    if (!downloadResult.success || !downloadResult.data) {
      throw new Error(`Failed to download existing dreams: ${downloadResult.error}`);
    }

    // Ensure downloaded data is an array
    let existingDreams: StandardDreamFields[];
    if (Array.isArray(downloadResult.data)) {
      existingDreams = downloadResult.data;
    } else {
      // Handle case where single dream object was stored
      existingDreams = [downloadResult.data];
    }

    log.debug('Existing dreams downloaded successfully', {
      existingCount: existingDreams.length,
      firstDreamId: existingDreams[0]?.id,
      lastDreamId: existingDreams[existingDreams.length - 1]?.id
    });

    // Extract original filename from metadata if available
    const originalFileName = extractOriginalFileName(existingDreams);

    // Create updated dreams array with new dream at the beginning
    const updatedDreams = [newDreamData, ...existingDreams];

    log.debug('Dreams merged successfully', {
      totalCount: updatedDreams.length,
      newDreamId: newDreamData.id,
      newFileName
    });

    return {
      success: true,
      data: updatedDreams,
      fileName: newFileName,
      isNewFile: false,
      metadata: {
        existingDreamsCount: existingDreams.length,
        totalDreamsCount: updatedDreams.length,
        originalFileName
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Failed to handle existing file', { error: errorMessage });
    
    // Fallback to creating new file if download fails
    log.debug('Falling back to new file creation');
    return await handleNewFile(newDreamData, newFileName);
  }
}

/**
 * Handle scenario when creating a new file (no existing dreams)
 */
async function handleNewFile(
  newDreamData: StandardDreamFields,
  fileName: string
): Promise<FileManagementResult> {
  log.debug('Creating new dreams file', { fileName, dreamId: newDreamData.id });

  const newDreamsArray = [newDreamData];

  return {
    success: true,
    data: newDreamsArray,
    fileName,
    isNewFile: true,
    metadata: {
      existingDreamsCount: 0,
      totalDreamsCount: 1
    }
  };
}

/**
 * Generate filename with agent name and timestamp
 * Format: agent_name + timestamp + daily_dreams.json
 */
function generateDreamFileName(agentName: string, timestamp: number): string {
  // Sanitize agent name for filename
  const sanitizedName = sanitizeAgentName(agentName);
  return `${sanitizedName}_${timestamp}_daily_dreams.json`;
}

/**
 * Sanitize agent name for use in filenames
 */
function sanitizeAgentName(agentName: string): string {
  return agentName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')        // Replace multiple underscores with single
    .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
}

/**
 * Check if hash is empty (all zeros)
 */
function isEmptyHash(hash: string): boolean {
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
  return !hash || hash === emptyHash || hash === '0x0' || hash.length < 10;
}

/**
 * Extract original filename from existing dreams metadata
 * This is a best-effort attempt to find filename patterns
 */
function extractOriginalFileName(existingDreams: StandardDreamFields[]): string | undefined {
  if (!existingDreams.length) return undefined;

  // Look for any metadata that might contain filename info
  // This is speculative since we don't store filenames in dream data
  const firstDream = existingDreams[0];
  
  // Try to reconstruct from dream metadata
  if (firstDream.timestamp) {
    // Estimate agent name from patterns (this is approximate)
    return `previous_${firstDream.timestamp}_daily_dreams.json`;
  }

  return undefined;
}

/**
 * Validate dreams array structure
 */
export function validateDreamsArray(dreams: any[]): boolean {
  if (!Array.isArray(dreams)) {
    log.debug('Invalid dreams data: not an array');
    return false;
  }

  if (dreams.length === 0) {
    log.debug('Warning: empty dreams array');
    return true; // Empty array is valid
  }

  // Basic validation of dream structure
  const isValid = dreams.every((dream, index) => {
    if (!dream || typeof dream !== 'object') {
      log.debug(`Invalid dream at index ${index}: not an object`);
      return false;
    }

    if (typeof dream.id !== 'number' || dream.id <= 0) {
      log.debug(`Invalid dream at index ${index}: invalid ID`);
      return false;
    }

    if (typeof dream.date !== 'string') {
      log.debug(`Invalid dream at index ${index}: invalid date`);
      return false;
    }

    return true;
  });

  log.debug('Dreams array validation completed', { 
    isValid, 
    dreamsCount: dreams.length 
  });

  return isValid;
}

/**
 * Sort dreams by date (newest first)
 */
export function sortDreamsByDate(dreams: StandardDreamFields[]): StandardDreamFields[] {
  return dreams.sort((a, b) => {
    // Sort by timestamp if available, otherwise by date string
    if (a.timestamp && b.timestamp) {
      return b.timestamp - a.timestamp; // Newest first
    }
    
    // Fallback to date string comparison
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Remove duplicate dreams based on ID
 */
export function removeDuplicateDreams(dreams: StandardDreamFields[]): StandardDreamFields[] {
  const seenIds = new Set<number>();
  const uniqueDreams: StandardDreamFields[] = [];

  for (const dream of dreams) {
    if (!seenIds.has(dream.id)) {
      seenIds.add(dream.id);
      uniqueDreams.push(dream);
    } else {
      log.debug(`Removed duplicate dream ID: ${dream.id}`);
    }
  }

  log.debug('Duplicate removal completed', {
    originalCount: dreams.length,
    uniqueCount: uniqueDreams.length,
    duplicatesRemoved: dreams.length - uniqueDreams.length
  });

  return uniqueDreams;
}

/**
 * Get file statistics for logging/debugging
 */
export function getDreamFileStats(dreams: StandardDreamFields[]): {
  totalDreams: number;
  dateRange: { earliest: string; latest: string } | null;
  averageIntensity: number;
  mostCommonEmotions: string[];
  mostCommonSymbols: string[];
} {
  if (!dreams.length) {
    return {
      totalDreams: 0,
      dateRange: null,
      averageIntensity: 0,
      mostCommonEmotions: [],
      mostCommonSymbols: []
    };
  }

  const sortedDreams = [...dreams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const totalIntensity = dreams.reduce((sum, dream) => sum + (dream.intensity || 0), 0);
  const averageIntensity = totalIntensity / dreams.length;

  // Count emotions and symbols
  const emotionCounts: Record<string, number> = {};
  const symbolCounts: Record<string, number> = {};

  dreams.forEach(dream => {
    dream.emotions?.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    dream.symbols?.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
  });

  const mostCommonEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([emotion]) => emotion);

  const mostCommonSymbols = Object.entries(symbolCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([symbol]) => symbol);

  return {
    totalDreams: dreams.length,
    dateRange: {
      earliest: sortedDreams[0].date,
      latest: sortedDreams[sortedDreams.length - 1].date
    },
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    mostCommonEmotions,
    mostCommonSymbols
  };
}
