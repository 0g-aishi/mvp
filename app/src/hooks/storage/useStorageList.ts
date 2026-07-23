'use client';

import { useState, useCallback, useEffect } from 'react';
import { NetworkType, getDefaultNetworkType } from '../../lib/0g/network';
import { logger } from '@/lib/logger';

interface FileInfo {
  rootHash: string;
  fileName: string;
  fileSize: number;
  txHash?: string;
  uploadDate: number;
  networkType: NetworkType;
}

interface UseStorageListReturn {
  // Data
  files: FileInfo[];
  
  // Methods
  addFile: (fileInfo: Omit<FileInfo, 'uploadDate' | 'networkType'>) => void;
  removeFile: (rootHash: string) => void;
  clearFiles: () => void;
  formatFileSize: (bytes: number) => string;
}

const STORAGE_KEY = 'dreamscape-uploaded-files';

export function useStorageList(): UseStorageListReturn {
  const log = logger.child({ component: 'useStorageList' });
  const [files, setFiles] = useState<FileInfo[]>([]);
  const networkType = getDefaultNetworkType();

  // Load files from localStorage on mount
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem(STORAGE_KEY);
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles) as FileInfo[];
        setFiles(parsedFiles);

        log.debug('Loaded files from localStorage', { count: parsedFiles.length });
      }
    } catch (error) {
      log.error('Error loading files from localStorage', { error });
    }
  }, []);

  // Save files to localStorage whenever files change
  const saveToLocalStorage = useCallback((updatedFiles: FileInfo[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
      log.debug('Saved files to localStorage', { count: updatedFiles.length });
    } catch (error) {
      log.error('Error saving files to localStorage', { error });
    }
  }, [log]);

  const addFile = useCallback((fileInfo: Omit<FileInfo, 'uploadDate' | 'networkType'>) => {
    const newFile: FileInfo = {
      ...fileInfo,
      uploadDate: Date.now(),
      networkType
    };

    setFiles(prevFiles => {
      // Check if file already exists (by rootHash)
      const existingIndex = prevFiles.findIndex(f => f.rootHash === newFile.rootHash);
      let updatedFiles: FileInfo[];
      
      if (existingIndex >= 0) {
        // Update existing file
        updatedFiles = [...prevFiles];
        updatedFiles[existingIndex] = newFile;
      } else {
        // Add new file to the beginning
        updatedFiles = [newFile, ...prevFiles];
      }
      
      saveToLocalStorage(updatedFiles);
      return updatedFiles;
    });

    log.debug('Added file', { file: newFile });
  }, [networkType, saveToLocalStorage, log]);

  const removeFile = useCallback((rootHash: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.rootHash !== rootHash);
      saveToLocalStorage(updatedFiles);
      return updatedFiles;
    });

    log.debug('Removed file', { rootHash });
  }, [saveToLocalStorage, log]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    saveToLocalStorage([]);

    log.debug('Cleared all files');
  }, [saveToLocalStorage, log]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    // Data
    files,
    
    // Methods
    addFile,
    removeFile,
    clearFiles,
    formatFileSize
  };
} 