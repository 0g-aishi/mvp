'use client';

import { Zap, Sparkles, Loader2, AlertCircle, Database } from 'lucide-react';
import { Theme, ParsedResponse, DebugLogFunction, AsyncHandler } from './DreamAnalysisTypes';

interface DreamAIAnalysisProps {
  builtPrompt: string | null;
  promptFormat: any;
  isLoadingAI: boolean;
  aiError: string | null;
  aiResponse: any;
  parsedResponse: ParsedResponse | null;
  effectiveTokenId: number | undefined;
  isUploadingToStorage: boolean;
  uploadStatus: string | null;
  onSendToAI: AsyncHandler;
  onSaveToStorage: AsyncHandler;
  theme: Theme;
  debugLog: DebugLogFunction;
}

export default function DreamAIAnalysis({
  builtPrompt,
  promptFormat,
  isLoadingAI,
  aiError,
  aiResponse,
  parsedResponse,
  effectiveTokenId,
  isUploadingToStorage,
  uploadStatus,
  onSendToAI,
  onSaveToStorage,
  theme,
  debugLog
}: DreamAIAnalysisProps) {

  const handleSendToAI = async () => {
    if (!builtPrompt || !promptFormat) {
      debugLog('Missing required data for AI analysis');
      return;
    }
    
    debugLog('Sending prompt to AI', { 
      promptLength: builtPrompt.length,
      needsEvolution: promptFormat.needsPersonalityEvolution
    });
    
    await onSendToAI();
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
    
    await onSaveToStorage();
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
        <Zap size={20} />
        STEP 4: AI Analysis
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
        🤖 Send prompt to AI model via 0g-compute API for personalized dream analysis. The AI will respond with full analysis and structured data.
      </div>

      {/* Send to AI Button */}
      <button
        onClick={handleSendToAI}
        disabled={!builtPrompt || isLoadingAI}
        style={{
          backgroundColor: !builtPrompt || isLoadingAI ? theme.bg.panel : theme.accent.primary,
          color: !builtPrompt || isLoadingAI ? theme.text.secondary : 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: !builtPrompt || isLoadingAI ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '15px'
        }}
      >
        {isLoadingAI ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Analyzing Dream...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Send to AI Analysis
          </>
        )}
      </button>

      {/* AI Error Display */}
      {aiError && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          AI Error: {aiError}
        </div>
      )}

      {/* AI Response Display */}
      {parsedResponse && (
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
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} />
            AI Dream Analysis Complete
          </h4>

          {/* AI Response Stats */}
          {aiResponse && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              marginBottom: '15px',
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              <div><strong>Model:</strong> {aiResponse.model}</div>
              <div><strong>Cost:</strong> {aiResponse.cost} OG</div>
              <div><strong>Response Time:</strong> {aiResponse.responseTime}ms</div>
              <div><strong>Valid:</strong> {aiResponse.isValid ? '✅' : '❌'}</div>
            </div>
          )}

          {/* Dream Analysis Section */}
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: theme.bg.card,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <h5 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              🌙 Full Dream Analysis
            </h5>
            
            <div style={{
              color: theme.text.primary,
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {parsedResponse.fullAnalysis}
            </div>
          </div>

          {/* Dream Data Summary */}
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: theme.bg.card,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <h5 style={{
              color: theme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              📊 Dream Data Summary
            </h5>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              <div><strong>Dream ID:</strong> #{parsedResponse.dreamData.id}</div>
              <div><strong>Date:</strong> {parsedResponse.dreamData.date}</div>
              <div><strong>Intensity:</strong> {parsedResponse.dreamData.intensity}/10</div>
              <div><strong>Lucidity:</strong> {parsedResponse.dreamData.lucidity}/5</div>
            </div>
            
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <div><strong>Emotions:</strong> {parsedResponse.dreamData.emotions?.join(', ') || 'None'}</div>
              <div><strong>Symbols:</strong> {parsedResponse.dreamData.symbols?.join(', ') || 'None'}</div>
            </div>
          </div>

          {/* Personality Impact (if evolution) */}
          {parsedResponse.personalityImpact && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: theme.bg.card,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`
            }}>
              <h5 style={{
                color: theme.text.primary,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '10px'
              }}>
                🧬 Personality Evolution (Dream #{parsedResponse.dreamData.id})
              </h5>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                fontSize: '12px',
                color: theme.text.secondary
              }}>
                <div>Creativity: {parsedResponse.personalityImpact.creativityChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.creativityChange}</div>
                <div>Analytical: {parsedResponse.personalityImpact.analyticalChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.analyticalChange}</div>
                <div>Empathy: {parsedResponse.personalityImpact.empathyChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.empathyChange}</div>
                <div>Intuition: {parsedResponse.personalityImpact.intuitionChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.intuitionChange}</div>
                <div>Resilience: {parsedResponse.personalityImpact.resilienceChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.resilienceChange}</div>
                <div>Curiosity: {parsedResponse.personalityImpact.curiosityChange > 0 ? '+' : ''}{parsedResponse.personalityImpact.curiosityChange}</div>
              </div>
              
              <div style={{ marginTop: '10px', fontSize: '12px' }}>
                <div><strong>Mood Shift:</strong> {parsedResponse.personalityImpact.moodShift}</div>
                <div><strong>Evolution Weight:</strong> {parsedResponse.personalityImpact.evolutionWeight}/100</div>
              </div>
              
              {parsedResponse.personalityImpact.newFeatures?.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  <strong>New Features:</strong>
                  {parsedResponse.personalityImpact.newFeatures.map((feature: any, index: number) => (
                    <div key={index} style={{ marginLeft: '10px' }}>
                      • {feature.name}: {feature.description} ({feature.intensity}/100)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis Summary */}
          <div style={{
            padding: '10px',
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            border: `1px solid ${theme.border}`,
            fontSize: '12px',
            color: theme.text.secondary
          }}>
            <strong>Brief Analysis:</strong> {parsedResponse.analysis}
          </div>

          {/* Save to Storage Button */}
          {effectiveTokenId && (
            <button
              onClick={handleSaveToStorage}
              disabled={isUploadingToStorage}
              style={{
                backgroundColor: isUploadingToStorage ? theme.bg.panel : theme.accent.primary,
                color: isUploadingToStorage ? theme.text.secondary : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: isUploadingToStorage ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '15px'
              }}
            >
              {isUploadingToStorage ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving Dream...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Save Dream to Storage
                </>
              )}
            </button>
          )}

          {/* Upload Status Display */}
          {uploadStatus && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: theme.bg.panel,
              borderRadius: '6px',
              fontSize: '13px',
              color: theme.text.secondary,
              fontFamily: 'monospace'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}