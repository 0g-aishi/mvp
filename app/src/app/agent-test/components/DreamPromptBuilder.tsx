'use client';

import { FileText } from 'lucide-react';
import { Theme, BuiltContext, PromptFormat, DebugLogFunction, Handler } from './DreamAnalysisTypes';

interface DreamPromptBuilderProps {
  builtContext: BuiltContext | null;
  builtPrompt: string | null;
  promptFormat: PromptFormat | null;
  onBuildPrompt: Handler;
  theme: Theme;
  debugLog: DebugLogFunction;
}

export default function DreamPromptBuilder({
  builtContext,
  builtPrompt,
  promptFormat,
  onBuildPrompt,
  theme,
  debugLog
}: DreamPromptBuilderProps) {

  const handleBuildPrompt = () => {
    if (!builtContext) {
      debugLog('No built context available');
      return;
    }
    
    debugLog('Building prompt for agent', { agentName: builtContext.agentProfile.name });
    onBuildPrompt();
  };

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
        <FileText size={20} />
        STEP 3: Prompt Building
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
        📝 Building AI prompt with complete context for personalized dream analysis. Agent will use personality, memory, and historical data.
      </div>

      {/* Build Prompt Button */}
      <button
        onClick={handleBuildPrompt}
        disabled={!builtContext}
        style={{
          backgroundColor: !builtContext ? theme.bg.panel : theme.accent.primary,
          color: !builtContext ? theme.text.secondary : 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: !builtContext ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '15px'
        }}
      >
        <FileText size={16} />
        Build Analysis Prompt
      </button>

      {/* Prompt Format Info */}
      {promptFormat && (
        <div style={{
          fontSize: '14px',
          color: theme.text.primary,
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: theme.bg.panel,
          borderRadius: '6px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            📊 Analysis Format:
          </div>
          <div style={{ fontSize: '12px', color: theme.text.secondary }}>
            • Dream ID: #{promptFormat.dreamId}
            • {promptFormat.needsPersonalityEvolution ? 
                `🧬 Personality Evolution (${promptFormat.dreamId}th dream)` : 
                '📝 Regular Analysis'}
            • {promptFormat.needsPersonalityEvolution ? 
                'Will include personality changes & unique features' : 
                'Analysis only - no trait changes'}
          </div>
        </div>
      )}

      {/* Built Prompt Display */}
      {builtPrompt && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <h4 style={{
            color: theme.text.primary,
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={16} />
            Generated Prompt Ready
          </h4>
          
          <div style={{
            fontSize: '12px',
            color: theme.text.secondary,
            marginBottom: '10px'
          }}>
            Prompt length: {builtPrompt.length} characters
          </div>

          <textarea
            value={builtPrompt}
            readOnly
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '10px',
              backgroundColor: theme.bg.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.text.primary,
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'vertical',
              outline: 'none'
            }}
          />
          
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: theme.text.secondary,
            textAlign: 'center'
          }}>
            ✅ Ready for AI analysis (STEP 4)
          </div>
        </div>
      )}
    </div>
  );
}