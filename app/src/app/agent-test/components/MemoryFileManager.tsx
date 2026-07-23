'use client';

import { Loader2, AlertCircle, Archive, FileText, MessageCircle, Download } from 'lucide-react';
import { AgentData, Theme, DebugLogFunction } from './DreamAnalysisTypes';

interface MemoryFileManagerProps {
  agentData: AgentData | null;
  effectiveTokenId: number | undefined;
  isLoadingAgent: boolean;
  theme: Theme;
  isDownloading: boolean;
  downloadStatus: string | null;
  downloadError: string | null;
  onDownloadMemoryFile: (rootHash: string, fileName: string) => Promise<void>;
  debugLog: DebugLogFunction;
}

export default function MemoryFileManager({
  agentData,
  effectiveTokenId,
  isLoadingAgent,
  theme,
  isDownloading,
  downloadStatus,
  downloadError,
  onDownloadMemoryFile,
  debugLog
}: MemoryFileManagerProps) {
  
  if (isLoadingAgent) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <Loader2 size={32} style={{ 
          color: theme.accent.primary, 
          marginBottom: '15px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          Loading agent memory data...
        </p>
      </div>
    );
  }

  if (!agentData?.memory) {
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
          No Memory Data Found
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          The agent's memory data is not yet available. Please ensure the agent is minted and has processed some dreams.
        </p>
      </div>
    );
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
        <Archive size={20} />
        Memory Files - Agent #{effectiveTokenId}
      </h3>
      
      <div style={{
        fontSize: '14px',
        color: theme.text.secondary,
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: theme.bg.panel,
        borderRadius: '6px',
        border: `1px solid ${theme.border}`
      }}>
        📁 Download JSON files from agent's hierarchical memory system. Each file contains structured data from different time periods, including dreams and conversations.
      </div>

      {/* Memory Files Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '15px'
      }}>
        {/* Memory Core File */}
        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <Archive size={16} style={{ color: theme.accent.primary }} />
            <h4 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              margin: 0
            }}>
              Memory Core (Long-term)
            </h4>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {agentData.memory.memoryCoreHash || 'No hash available'}
          </div>
          
          <button
            onClick={() => onDownloadMemoryFile(
              agentData.memory!.memoryCoreHash,
              `memory_core_agent_${effectiveTokenId}.json`
            )}
            disabled={!agentData.memory.memoryCoreHash || 
                     agentData.memory.memoryCoreHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading}
            style={{
              backgroundColor: (!agentData.memory.memoryCoreHash || 
                               agentData.memory.memoryCoreHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                               isDownloading) ? theme.bg.card : theme.accent.primary,
              color: (!agentData.memory.memoryCoreHash || 
                     agentData.memory.memoryCoreHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!agentData.memory.memoryCoreHash || 
                      agentData.memory.memoryCoreHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                      isDownloading) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={12} />
                Download
              </>
            )}
          </button>
        </div>

        {/* Daily Dreams File */}
        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <FileText size={16} style={{ color: theme.accent.secondary }} />
            <h4 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              margin: 0
            }}>
              Daily Dreams (Current)
            </h4>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {agentData.memory.currentDreamDailyHash || 'No hash available'}
          </div>
          
          <button
            onClick={() => onDownloadMemoryFile(
              agentData.memory!.currentDreamDailyHash,
              `daily_dreams_current.json`
            )}
            disabled={!agentData.memory.currentDreamDailyHash || 
                     agentData.memory.currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading}
            style={{
              backgroundColor: (!agentData.memory.currentDreamDailyHash || 
                               agentData.memory.currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                               isDownloading) ? theme.bg.card : theme.accent.secondary,
              color: (!agentData.memory.currentDreamDailyHash || 
                     agentData.memory.currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!agentData.memory.currentDreamDailyHash || 
                      agentData.memory.currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                      isDownloading) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={12} />
                Download
              </>
            )}
          </button>
        </div>

        {/* Monthly Dreams File */}
        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <FileText size={16} style={{ color: theme.accent.secondary }} />
            <h4 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              margin: 0
            }}>
              Monthly Dreams (Last Consolidation)
            </h4>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {agentData.memory.lastDreamMonthlyHash || 'No hash available'}
          </div>
          
          <button
            onClick={() => onDownloadMemoryFile(
              agentData.memory!.lastDreamMonthlyHash,
              `monthly_dreams_consolidated.json`
            )}
            disabled={!agentData.memory.lastDreamMonthlyHash || 
                     agentData.memory.lastDreamMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading}
            style={{
              backgroundColor: (!agentData.memory.lastDreamMonthlyHash || 
                               agentData.memory.lastDreamMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                               isDownloading) ? theme.bg.card : theme.accent.secondary,
              color: (!agentData.memory.lastDreamMonthlyHash || 
                     agentData.memory.lastDreamMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!agentData.memory.lastDreamMonthlyHash || 
                      agentData.memory.lastDreamMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                      isDownloading) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={12} />
                Download
              </>
            )}
          </button>
        </div>

        {/* Daily Conversations File */}
        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <MessageCircle size={16} style={{ color: theme.accent.secondary }} />
            <h4 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              margin: 0
            }}>
              Daily Conversations (Current)
            </h4>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {agentData.memory.currentConvDailyHash || 'No hash available'}
          </div>
          
          <button
            onClick={() => onDownloadMemoryFile(
              agentData.memory!.currentConvDailyHash,
              `daily_conversations_current.json`
            )}
            disabled={!agentData.memory.currentConvDailyHash || 
                     agentData.memory.currentConvDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading}
            style={{
              backgroundColor: (!agentData.memory.currentConvDailyHash || 
                               agentData.memory.currentConvDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                               isDownloading) ? theme.bg.card : theme.accent.secondary,
              color: (!agentData.memory.currentConvDailyHash || 
                     agentData.memory.currentConvDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!agentData.memory.currentConvDailyHash || 
                      agentData.memory.currentConvDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                      isDownloading) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={12} />
                Download
              </>
            )}
          </button>
        </div>

        {/* Monthly Conversations File */}
        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <MessageCircle size={16} style={{ color: theme.accent.secondary }} />
            <h4 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              margin: 0
            }}>
              Monthly Conversations (Last Consolidation)
            </h4>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px',
            fontFamily: 'monospace'
          }}>
            {agentData.memory.lastConvMonthlyHash || 'No hash available'}
          </div>
          
          <button
            onClick={() => onDownloadMemoryFile(
              agentData.memory!.lastConvMonthlyHash,
              `monthly_conversations_consolidated.json`
            )}
            disabled={!agentData.memory.lastConvMonthlyHash || 
                     agentData.memory.lastConvMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading}
            style={{
              backgroundColor: (!agentData.memory.lastConvMonthlyHash || 
                               agentData.memory.lastConvMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                               isDownloading) ? theme.bg.card : theme.accent.secondary,
              color: (!agentData.memory.lastConvMonthlyHash || 
                     agentData.memory.lastConvMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                     isDownloading) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!agentData.memory.lastConvMonthlyHash || 
                      agentData.memory.lastConvMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                      isDownloading) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={12} />
                Download
              </>
            )}
          </button>
        </div>
      </div>

      {/* Download Status */}
      {downloadStatus && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: theme.bg.card,
          borderRadius: '6px',
          border: `1px solid ${theme.border}`,
          fontSize: '12px',
          color: theme.text.secondary,
          fontFamily: 'monospace'
        }}>
          {downloadStatus}
        </div>
      )}

      {/* Download Error */}
      {downloadError && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ff4444',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={14} />
          Download Error: {downloadError}
        </div>
      )}

      {/* Memory Info */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: theme.bg.card,
        borderRadius: '6px',
        border: `1px solid ${theme.border}`,
        fontSize: '12px',
        color: theme.text.secondary
      }}>
        <strong>Memory Info:</strong> Current Period: {agentData.memory.currentMonth}/{agentData.memory.currentYear} | 
        Last Consolidation: {agentData.memory.lastConsolidation ? new Date(Number(agentData.memory.lastConsolidation) * 1000).toLocaleDateString() : 'Never'}
      </div>
    </div>
  );
}