'use client';

import { Theme, BuiltContext, ParsedResponse, DebugLogFunction, AsyncHandler } from './DreamAnalysisTypes';

interface DreamStorageManagerProps {
  effectiveTokenId: number | undefined;
  builtContext: BuiltContext | null;
  parsedResponse: ParsedResponse | null;
  isUploadingToStorage: boolean;
  isProcessingContract: boolean;
  uploadStatus: string | null;
  contractStatus: string | null;
  onProcessStorageAndContract: AsyncHandler;
  theme: Theme;
  debugLog: DebugLogFunction;
}

export default function DreamStorageManager({
  effectiveTokenId,
  builtContext,
  parsedResponse,
  isUploadingToStorage,
  isProcessingContract,
  uploadStatus,
  contractStatus,
  onProcessStorageAndContract,
  theme,
  debugLog
}: DreamStorageManagerProps) {

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

    await onProcessStorageAndContract();
  };

  // Only show if we have parsed response (AI analysis complete)
  if (!parsedResponse) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: theme.text.primary,
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🚀 STEP 5: Storage & Contract Processing
      </h3>
      
      <div style={{
        fontSize: '14px',
        color: theme.text.secondary,
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: theme.bg.panel,
        borderRadius: '6px',
        border: `1px solid ${theme.border}`
      }}>
        📦 Save dream data to 0G Storage and process blockchain contract to update agent's memory and personality traits.
      </div>

      {/* Process Storage & Contract Button */}
      {effectiveTokenId && builtContext && (
        <button
          onClick={handleProcessStorageAndContract}
          disabled={isUploadingToStorage || isProcessingContract}
          style={{
            backgroundColor: (isUploadingToStorage || isProcessingContract) ? theme.bg.panel : theme.accent.secondary,
            color: (isUploadingToStorage || isProcessingContract) ? theme.text.secondary : 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: (isUploadingToStorage || isProcessingContract) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}
        >
          {(isUploadingToStorage || isProcessingContract) ? (
            <>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid transparent',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              {isUploadingToStorage ? 'Saving to Storage...' : 'Processing Contract...'}
            </>
          ) : (
            <>
              🚀 Process Storage & Contract
            </>
          )}
        </button>
      )}

      {/* Contract Status Display */}
      {(uploadStatus || contractStatus) && (
        <div style={{
          padding: '12px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          fontSize: '13px',
          color: theme.text.primary,
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            📊 Processing Status:
          </div>
          <div style={{ color: theme.text.secondary }}>
            {contractStatus || uploadStatus}
          </div>
        </div>
      )}

      {/* Success Message */}
      {contractStatus && contractStatus.includes('successful') && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #28a745',
          fontSize: '14px',
          color: '#155724',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ✅ Dream successfully processed! Your agent's memory and personality have been updated.
        </div>
      )}
    </div>
  );
}