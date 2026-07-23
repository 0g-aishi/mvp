'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAgentDream, useAgentPrompt, useAgentAI, useAgentRead } from '../../../hooks/agentHooks';
import { useStorageDownload } from '../../../hooks/storage/useStorageDownload';
import { logger } from '@/lib/logger';

// Import all the extracted components
import MemoryFileManager from './MemoryFileManager';
import DreamTextInput from './DreamTextInput';
import DreamContextBuilder from './DreamContextBuilder';
import DreamPromptBuilder from './DreamPromptBuilder';
import DreamAIAnalysis from './DreamAIAnalysis';
import DreamStorageManager from './DreamStorageManager';

// Import types
import { DreamAnalysisSectionProps } from './DreamAnalysisTypes';

export default function DreamAnalysisSection({
  hasAgent,
  effectiveTokenId
}: DreamAnalysisSectionProps) {
  // ALL HOOKS MUST BE AT THE TOP - Rules of Hooks
  const { theme } = useTheme();
  const { 
    dreamText, 
    setDreamText, 
    isLoadingContext, 
    contextStatus, 
    builtContext, 
    error,
    buildDreamContext,
    isUploadingToStorage,
    uploadStatus,
    extractAndSaveDreamData,
    isProcessingContract,
    contractStatus,
    processStorageAndContract
  } = useAgentDream();
  
  const { buildDreamAnalysisPrompt } = useAgentPrompt();
  const { 
    isLoading: isLoadingAI, 
    error: aiError, 
    aiResponse, 
    parsedResponse, 
    resetAI, 
    sendDreamAnalysis 
  } = useAgentAI();
  
  const { 
    agentData, 
    memoryAccess,
    isLoading: isLoadingAgent 
  } = useAgentRead(effectiveTokenId);
  
  const { 
    downloadFile, 
    isLoading: isDownloading, 
    error: downloadError, 
    status: downloadStatus 
  } = useStorageDownload();
  
  // State hooks MUST be here, not after conditional returns
  const [builtPrompt, setBuiltPrompt] = useState<string | null>(null);
  const [promptFormat, setPromptFormat] = useState<any>(null);
  
const log = logger.child({ component: 'DreamAnalysis' });

const debugLog = (message: string, data?: any) => {
    log.debug(message, data || {});
  };

  // Log component load
  debugLog('DreamAnalysisSection loaded', { hasAgent, effectiveTokenId });

  // Handler functions for child components
  const handleDreamInputChange = (text: string) => {
    setDreamText(text);
    debugLog('Dream text changed', { length: text.length, preview: text.substring(0, 50) + '...' });
  };

  const handleBuildContext = async () => {
    if (!effectiveTokenId) {
      debugLog('No effective token ID');
      return;
    }
    
    debugLog('Building context for agent', { 
      tokenId: effectiveTokenId,
      hasAgentData: !!agentData,
      hasMemoryAccess: !!memoryAccess,
      agentName: agentData?.agentName,
      memoryAccessible: memoryAccess?.monthsAccessible
    });
    
    // Combine all data from useAgentRead (Wagmi v2 compatible)
    const combinedAgentData = agentData ? {
      ...agentData,
      memory: {
        ...agentData.memory,
        memoryDepth: memoryAccess?.memoryDepth || 'current month only',
        monthsAccessible: memoryAccess?.monthsAccessible || 1
      }
    } : undefined;
    
    // Pass pre-loaded agent data from useAgentRead (Wagmi v2 compatible)
    await buildDreamContext(effectiveTokenId, combinedAgentData);
  };

  const handleBuildPrompt = () => {
    if (!builtContext) {
      debugLog('No built context available');
      return;
    }
    
    debugLog('Building prompt for agent', { agentName: builtContext.agentProfile.name });
    const promptResult = buildDreamAnalysisPrompt(builtContext);
    setBuiltPrompt(promptResult.prompt);
    setPromptFormat(promptResult.expectedFormat);
    debugLog('Prompt built successfully', { 
      promptLength: promptResult.prompt.length, 
      needsEvolution: promptResult.expectedFormat.needsPersonalityEvolution 
    });
  };

  const handleSendToAI = async () => {
    if (!builtContext || !builtPrompt || !promptFormat) {
      debugLog('Missing required data for AI analysis');
      return;
    }
    
    debugLog('Sending prompt to AI', { 
      agentName: builtContext.agentProfile.name,
      promptLength: builtPrompt.length,
      needsEvolution: promptFormat.needsPersonalityEvolution
    });
    
    const promptData = {
      prompt: builtPrompt,
      expectedFormat: promptFormat
    };
    
    await sendDreamAnalysis(promptData);
  };

  const handleSaveToStorage = async () => {
    if (!effectiveTokenId || !parsedResponse) {
      debugLog('Missing tokenId or AI response data');
      return;
    }

    debugLog('Saving dream to storage', { 
      tokenId: effectiveTokenId,
      dreamId: parsedResponse.dreamData.id,
      hasPersonalityImpact: !!parsedResponse.personalityImpact
    });
    
    const result = await extractAndSaveDreamData(effectiveTokenId, parsedResponse);
    
    if (result.success) {
      debugLog('Storage save successful', {
        rootHash: result.rootHash
      });
    } else {
      debugLog('Storage save failed', {
        error: result.error
      });
    }
  };

  const handleProcessStorageAndContract = async () => {
    if (!effectiveTokenId || !parsedResponse) {
      debugLog('Missing tokenId or AI response data');
      return;
    }

    debugLog('Starting storage and contract processing', {
      tokenId: effectiveTokenId,
      hasParsedResponse: !!parsedResponse,
      hasBuiltContext: !!builtContext
    });

    const result = await processStorageAndContract(effectiveTokenId, parsedResponse);
    
    if (result.success) {
      debugLog('Storage and contract processing successful', {
        rootHash: result.rootHash,
        txHash: result.txHash
      });
    } else {
      debugLog('Storage and contract processing failed', {
        error: result.error
      });
    }
  };

  const handleDownloadMemoryFile = async (rootHash: string, fileName: string) => {
    if (!rootHash || rootHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      debugLog('Cannot download - empty or null hash', { rootHash, fileName });
      return;
    }

    debugLog('Starting memory file download', { rootHash, fileName });
    
    const result = await downloadFile(rootHash);
    
    if (result.success && result.data) {
      try {
        const textDecoder = new TextDecoder('utf-8');
        const jsonText = textDecoder.decode(result.data);
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        debugLog('Memory file download successful', { fileName, size: result.data.byteLength });
      } catch (error) {
        debugLog('Failed to process downloaded file', { error, fileName });
      }
    } else {
      debugLog('Memory file download failed', { error: result.error, fileName });
    }
  };

  // Early return AFTER all hooks
  if (!hasAgent) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <AlertCircle size={48} style={{ color: theme.text.secondary, marginBottom: '20px' }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '10px' }}>
          No Agent Found
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          You need to mint an agent first to analyze dreams.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Memory Files Section */}
      <MemoryFileManager
        agentData={agentData}
        effectiveTokenId={effectiveTokenId}
        isLoadingAgent={isLoadingAgent}
        theme={theme}
        isDownloading={isDownloading}
        downloadStatus={downloadStatus}
        downloadError={downloadError}
        onDownloadMemoryFile={handleDownloadMemoryFile}
        debugLog={debugLog}
      />

      {/* Dream Input Section */}
      <DreamTextInput
        dreamText={dreamText}
        onDreamTextChange={handleDreamInputChange}
        effectiveTokenId={effectiveTokenId}
        theme={theme}
        debugLog={debugLog}
      />

      {/* Context Building Section */}
      <DreamContextBuilder
        dreamText={dreamText}
        effectiveTokenId={effectiveTokenId}
        isLoadingContext={isLoadingContext}
        contextStatus={contextStatus}
        builtContext={builtContext}
        error={error}
        onBuildContext={handleBuildContext}
        theme={theme}
        debugLog={debugLog}
      />

      {/* Prompt Building Section */}
      <DreamPromptBuilder
        builtContext={builtContext}
        builtPrompt={builtPrompt}
        promptFormat={promptFormat}
        onBuildPrompt={handleBuildPrompt}
        theme={theme}
        debugLog={debugLog}
      />

      {/* AI Analysis Section */}
      <DreamAIAnalysis
        builtPrompt={builtPrompt}
        promptFormat={promptFormat}
        isLoadingAI={isLoadingAI}
        aiError={aiError}
        aiResponse={aiResponse}
        parsedResponse={parsedResponse}
        effectiveTokenId={effectiveTokenId}
        isUploadingToStorage={isUploadingToStorage}
        uploadStatus={uploadStatus}
        onSendToAI={handleSendToAI}
        onSaveToStorage={handleSaveToStorage}
        theme={theme}
        debugLog={debugLog}
      />

      {/* Storage & Contract Processing Section */}
      <DreamStorageManager
        effectiveTokenId={effectiveTokenId}
        builtContext={builtContext}
        parsedResponse={parsedResponse}
        isUploadingToStorage={isUploadingToStorage}
        isProcessingContract={isProcessingContract}
        uploadStatus={uploadStatus}
        contractStatus={contractStatus}
        onProcessStorageAndContract={handleProcessStorageAndContract}
        theme={theme}
        debugLog={debugLog}
      />
    </div>
  );
}
