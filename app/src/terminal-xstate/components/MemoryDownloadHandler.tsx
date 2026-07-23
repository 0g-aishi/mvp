/**
 * @fileoverview Memory Download Handler Component
 * @description Handles download functionality for agent memory files from 0G Storage
 */

import React, { useEffect, useRef } from 'react';
import { XStateStorageService } from '../services/xstateStorage';
import { logger } from '@/lib/logger';

interface MemoryDownloadHandlerProps {
  send: (event: any) => void; // Send function from XState
}

/**
 * Component that listens for memory download clicks and handles the download process
 */
export const MemoryDownloadHandler: React.FC<MemoryDownloadHandlerProps> = ({ send }) => {
  const log = logger.child({ component: 'MemoryDownloadHandler' });
  const storageServiceRef = useRef<XStateStorageService | null>(null);

  useEffect(() => {
    // Initialize storage service
    storageServiceRef.current = new XStateStorageService();

    // Handler for download clicks
    const handleDownloadClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if clicked element is a download trigger
      if (!target.classList.contains('memory-download-trigger')) {
        return;
      }

      // Get data attributes
      const rootHash = target.getAttribute('data-roothash');
      const memoryType = target.getAttribute('data-memorytype');

      if (!rootHash || !storageServiceRef.current) {
        log.error('Missing rootHash or storage service');
        return;
      }

      // Debug logging
      log.debug('Initiating download', {
        rootHash,
        memoryType
      });

      // Update terminal with download status
      send({
        type: 'APPEND_LINES',
        lines: [{
          type: 'system',
          content: `Downloading ${memoryType} from 0G Network...`,
          timestamp: Date.now()
        }]
      });

      try {
        // Download blob from storage
        const result = await storageServiceRef.current.downloadBlob(rootHash);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Download failed');
        }

        // Convert ArrayBuffer to text for JSON files
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(result.data);
        
        // Parse JSON to verify it's valid
        let jsonData;
        try {
          jsonData = JSON.parse(jsonString);
        } catch (parseError) {
          throw new Error('Downloaded file is not valid JSON');
        }

        // Create blob for download
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
          type: 'application/json' 
        });

        // Generate filename based on memory type and timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${memoryType}_${timestamp}_${rootHash.slice(-8)}.json`;

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update terminal with success
        send({
          type: 'APPEND_LINES',
          lines: [{
            type: 'success',
            content: `✓ Downloaded ${filename} successfully`,
            timestamp: Date.now()
          }]
        });

        // Debug logging
        log.debug('Download successful', {
          filename,
          size: blob.size
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Update terminal with error
        send({
          type: 'APPEND_LINES',
          lines: [{
            type: 'error',
            content: `✗ Download failed: ${errorMsg}`,
            timestamp: Date.now()
          }]
        });

        log.error('Download error', { error });
      }
    };

    // Add event listener to document
    document.addEventListener('click', handleDownloadClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleDownloadClick);
    };
  }, [send]);

  // This component doesn't render anything visible
  return null;
};