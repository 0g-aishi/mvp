'use client';

import { Brain, Database, Loader2 } from 'lucide-react';
import { Theme, BuiltContext, DebugLogFunction, AsyncHandler } from './DreamAnalysisTypes';

interface DreamContextBuilderProps {
  dreamText: string;
  effectiveTokenId: number | undefined;
  isLoadingContext: boolean;
  contextStatus: string | null;
  builtContext: BuiltContext | null;
  error: string | null;
  onBuildContext: AsyncHandler;
  theme: Theme;
  debugLog: DebugLogFunction;
}

export default function DreamContextBuilder({
  dreamText,
  effectiveTokenId,
  isLoadingContext,
  contextStatus,
  builtContext,
  error,
  onBuildContext,
  theme,
  debugLog
}: DreamContextBuilderProps) {

  const handleBuildContext = async () => {
    if (!effectiveTokenId) {
      debugLog('No effective token ID');
      return;
    }
    
    debugLog('Building context for agent', { 
      tokenId: effectiveTokenId,
      dreamTextLength: dreamText.length
    });
    
    await onBuildContext();
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
        <Brain size={20} />
        STEP 2: Context Building
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
        🧠 Building comprehensive analysis context from agent's personality, memory depth, and historical data.
      </div>

      {/* Build Context Button */}
      <button
        onClick={handleBuildContext}
        disabled={!dreamText.trim() || isLoadingContext}
        style={{
          backgroundColor: (!dreamText.trim() || isLoadingContext) ? theme.bg.panel : theme.accent.primary,
          color: (!dreamText.trim() || isLoadingContext) ? theme.text.secondary : 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: (!dreamText.trim() || isLoadingContext) ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '15px'
        }}
      >
        {isLoadingContext ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Building Context...
          </>
        ) : (
          <>
            <Brain size={16} />
            Build Analysis Context
          </>
        )}
      </button>

      {/* Context Status */}
      {contextStatus && (
        <div style={{
          fontSize: '14px',
          color: theme.text.primary,
          marginBottom: '15px',
          padding: '8px 12px',
          backgroundColor: theme.bg.panel,
          borderRadius: '6px',
          border: `1px solid ${theme.border}`
        }}>
          📡 {contextStatus}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          fontSize: '14px',
          color: '#ff4444',
          marginBottom: '15px',
          padding: '8px 12px',
          backgroundColor: '#ffeeee',
          borderRadius: '6px',
          border: '1px solid #ffcccc'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Context Summary */}
      {builtContext && (
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
            <Database size={16} />
            Context Built Successfully
          </h4>
          
          {/* Language Detection Info */}
          {builtContext.languageDetection && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: builtContext.languageDetection.isReliable ? '#e8f5e8' : '#fff3cd',
              borderRadius: '6px',
              border: `1px solid ${builtContext.languageDetection.isReliable ? '#28a745' : '#ffc107'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: builtContext.languageDetection.isReliable ? '#155724' : '#856404'
              }}>
                {builtContext.languageDetection.isReliable ? '✅' : '⚠️'} 
                Language Detected: {builtContext.languageDetection.languageName}
              </div>
              <div style={{
                fontSize: '12px',
                color: builtContext.languageDetection.isReliable ? '#155724' : '#856404',
                marginTop: '4px'
              }}>
                Confidence: {Math.round(builtContext.languageDetection.confidence * 100)}% 
                {!builtContext.languageDetection.isReliable && ' (Fallback to English)'}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            fontSize: '14px'
          }}>
            <div>
              <strong style={{ color: theme.text.primary }}>Agent:</strong>
              <div style={{ color: theme.text.secondary }}>
                {builtContext.agentProfile.name} (Level {builtContext.agentProfile.intelligenceLevel})
              </div>
            </div>
            
            <div>
              <strong style={{ color: theme.text.primary }}>Memory Access:</strong>
              <div style={{ color: theme.text.secondary }}>
                {builtContext.memoryAccess?.memoryDepth || 'Basic'}
              </div>
            </div>
            
            <div>
              <strong style={{ color: theme.text.primary }}>Historical Data:</strong>
              <div style={{ color: theme.text.secondary }}>
                {builtContext.historicalData?.dailyDreams?.length || 0} daily dreams,{' '}
                {builtContext.historicalData?.monthlyConsolidations?.length || 0} monthly consolidations
              </div>
            </div>
            
            <div>
              <strong style={{ color: theme.text.primary }}>Unique Features:</strong>
              <div style={{ color: theme.text.secondary }}>
                {builtContext.uniqueFeatures?.length || 0} AI-generated traits
              </div>
            </div>
          </div>

          {/* Personality Overview */}
          {builtContext.personality && (
            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: theme.text.primary, fontSize: '14px' }}>Personality Profile:</strong>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '8px',
                fontSize: '12px'
              }}>
                <div>Creativity: {builtContext.personality.creativity}/100</div>
                <div>Analytical: {builtContext.personality.analytical}/100</div>
                <div>Empathy: {builtContext.personality.empathy}/100</div>
                <div>Intuition: {builtContext.personality.intuition}/100</div>
                <div>Resilience: {builtContext.personality.resilience}/100</div>
                <div>Curiosity: {builtContext.personality.curiosity}/100</div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <strong>Style:</strong> {builtContext.personality.responseStyle} | 
                <strong> Mood:</strong> {builtContext.personality.dominantMood}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}