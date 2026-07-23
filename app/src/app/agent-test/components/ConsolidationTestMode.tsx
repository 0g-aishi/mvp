'use client';

import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useConsolidationTestMode } from '../../../hooks/agentHooks';
import { 
  TestTube, 
  Calendar, 
  Zap, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Sparkles,
  Settings,
  Play,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ConsolidationTestModeProps {
  hasAgent: boolean;
  effectiveTokenId: number | null;
}

export default function ConsolidationTestMode({
  hasAgent,
  effectiveTokenId
}: ConsolidationTestModeProps) {
  const { theme } = useTheme();
  const [showMockPreview, setShowMockPreview] = useState(false);
  const [testMode, setTestMode] = useState<'monthly' | 'yearly'>('monthly');

  const {
    testState,
    mockData,
    isGeneratingMocks,
    isTestingConsolidation,
    generateMockData,
    testMonthlyConsolidation,
    testYearlyConsolidation,
    resetTestMode,
    operationalTokenId
  } = useConsolidationTestMode(effectiveTokenId || undefined);

  if (!hasAgent || !operationalTokenId) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '30px',
        textAlign: 'center'
      }}>
        <AlertTriangle size={48} color={theme.text.secondary} style={{ marginBottom: '20px' }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '10px' }}>
          No Agent Found
        </h3>
        <p style={{ color: theme.text.secondary }}>
          You need to mint an agent first to test consolidation functionality.
        </p>
      </div>
    );
  }

  const handleGenerateMocks = async () => {
    await generateMockData(testMode === 'monthly' ? 'monthly' : 'yearly');
  };

  const handleTestConsolidation = async () => {
    if (testMode === 'monthly') {
      await testMonthlyConsolidation();
    } else {
      await testYearlyConsolidation();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <TestTube size={24} style={{ color: '#FF6B6B' }} />
          <h2 style={{ color: theme.text.primary, margin: 0 }}>
            🧪 Consolidation Test Mode
          </h2>
        </div>
        
        <p style={{ 
          color: theme.text.secondary, 
          fontSize: '14px', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          Test mode generates mock data but uses <strong>real LLM analysis</strong>, 
          <strong>real 0G Storage</strong>, and <strong>real blockchain contracts</strong>. 
          Perfect for testing the complete consolidation pipeline.
        </p>

        {/* Test Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setTestMode('monthly')}
            style={{
              backgroundColor: testMode === 'monthly' ? theme.accent.primary : theme.bg.panel,
              color: testMode === 'monthly' ? 'white' : theme.text.primary,
              border: `1px solid ${testMode === 'monthly' ? theme.accent.primary : theme.border}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={16} />
            Monthly Test
          </button>
          
          <button
            onClick={() => setTestMode('yearly')}
            style={{
              backgroundColor: testMode === 'yearly' ? '#8B5CF6' : theme.bg.panel,
              color: testMode === 'yearly' ? 'white' : theme.text.primary,
              border: `1px solid ${testMode === 'yearly' ? '#8B5CF6' : theme.border}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} />
            Yearly Test
          </button>
        </div>

        {/* Agent Info */}
        <div style={{
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          padding: '15px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <Settings size={16} color={theme.accent.primary} />
            <span style={{ color: theme.text.primary, fontWeight: '600' }}>
              Testing Agent #{operationalTokenId}
            </span>
          </div>
          <div style={{ color: theme.text.secondary, fontSize: '14px' }}>
            Test Mode: <strong>{testMode === 'monthly' ? 'Monthly Consolidation' : 'Yearly Memory Core'}</strong>
          </div>
        </div>
      </div>

      {/* Step 1: Generate Mock Data */}
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: testState.mockDataGenerated ? '#4CAF50' : theme.accent.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            1
          </div>
          <h3 style={{ color: theme.text.primary, margin: 0 }}>
            Generate Mock Data
          </h3>
          {testState.mockDataGenerated && (
            <CheckCircle size={20} style={{ color: '#4CAF50' }} />
          )}
        </div>

        <p style={{ color: theme.text.secondary, fontSize: '14px', marginBottom: '15px' }}>
          {testMode === 'monthly' 
            ? 'Generate fake dreams and conversations for current month testing'
            : 'Generate 12 months of consolidated data for yearly testing'
          }
        </p>

        <button
          onClick={handleGenerateMocks}
          disabled={isGeneratingMocks}
          style={{
            backgroundColor: theme.accent.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            cursor: isGeneratingMocks ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isGeneratingMocks ? 0.6 : 1
          }}
        >
          {isGeneratingMocks ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Generating...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate {testMode === 'monthly' ? 'Monthly' : 'Yearly'} Mocks
            </>
          )}
        </button>

        {/* Mock Data Status */}
        {testState.statusMessage && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: theme.bg.panel,
            borderRadius: '6px',
            fontSize: '14px',
            color: theme.text.secondary
          }}>
            {testState.statusMessage}
          </div>
        )}
      </div>

      {/* Mock Data Preview */}
      {testState.mockDataGenerated && mockData && (
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
          onClick={() => setShowMockPreview(!showMockPreview)}
          >
            {showMockPreview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <Eye size={20} />
            <h3 style={{ color: theme.text.primary, margin: 0 }}>
              Mock Data Preview
            </h3>
          </div>

          {showMockPreview && (
            <div style={{
              backgroundColor: theme.bg.panel,
              borderRadius: '8px',
              padding: '15px',
              fontSize: '14px'
            }}>
              {testMode === 'monthly' && mockData.monthlyData && (
                <>
                  <div style={{ color: theme.text.primary, marginBottom: '10px' }}>
                    <strong>Dreams:</strong> {mockData.monthlyData.dreams?.length || 0} items
                  </div>
                  <div style={{ color: theme.text.primary, marginBottom: '10px' }}>
                    <strong>Conversations:</strong> {mockData.monthlyData.conversations?.length || 0} items
                  </div>
                  <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
                    Generated for: {mockData.monthlyData.month}/{mockData.monthlyData.year}
                  </div>
                </>
              )}
              
              {testMode === 'yearly' && mockData.yearlyData && (
                <>
                  <div style={{ color: theme.text.primary, marginBottom: '10px' }}>
                    <strong>Dream Consolidations:</strong> {mockData.yearlyData.dreamConsolidations?.length || 0} months
                  </div>
                  <div style={{ color: theme.text.primary, marginBottom: '10px' }}>
                    <strong>Conversation Consolidations:</strong> {mockData.yearlyData.conversationConsolidations?.length || 0} months
                  </div>
                  <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
                    Generated for: {mockData.yearlyData.year}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Test Consolidation */}
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: testState.consolidationCompleted ? '#4CAF50' : theme.accent.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            2
          </div>
          <h3 style={{ color: theme.text.primary, margin: 0 }}>
            Test {testMode === 'monthly' ? 'Monthly' : 'Yearly'} Consolidation
          </h3>
          {testState.consolidationCompleted && (
            <CheckCircle size={20} style={{ color: '#4CAF50' }} />
          )}
        </div>

        <p style={{ color: theme.text.secondary, fontSize: '14px', marginBottom: '15px' }}>
          {testMode === 'monthly' 
            ? 'Process mock data through real LLM → Storage → Contract pipeline'
            : 'Create yearly memory core with real AI analysis and blockchain storage'
          }
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleTestConsolidation}
            disabled={!testState.mockDataGenerated || isTestingConsolidation}
            style={{
              backgroundColor: testMode === 'monthly' ? theme.accent.primary : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: (!testState.mockDataGenerated || isTestingConsolidation) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: (!testState.mockDataGenerated || isTestingConsolidation) ? 0.6 : 1
            }}
          >
            {isTestingConsolidation ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Testing...
              </>
            ) : (
              <>
                <Play size={16} />
                Test {testMode === 'monthly' ? 'Monthly' : 'Yearly'}
              </>
            )}
          </button>

          <button
            onClick={resetTestMode}
            style={{
              backgroundColor: theme.bg.panel,
              color: theme.text.primary,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Progress Status */}
        {(testState.isProcessingWithLLM || testState.isUploadingToStorage || testState.isUpdatingContract) && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <Clock size={16} color={theme.accent.primary} />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Processing Pipeline
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px'
              }}>
                {testState.isProcessingWithLLM ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid transparent',
                    borderTop: '2px solid ' + theme.accent.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <CheckCircle size={12} style={{ color: '#4CAF50' }} />
                )}
                <span style={{ color: theme.text.secondary }}>LLM Analysis</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px'
              }}>
                {testState.isUploadingToStorage ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid transparent',
                    borderTop: '2px solid ' + theme.accent.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : testState.isProcessingWithLLM ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: theme.border
                  }} />
                ) : (
                  <CheckCircle size={12} style={{ color: '#4CAF50' }} />
                )}
                <span style={{ color: theme.text.secondary }}>0G Storage Upload</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px'
              }}>
                {testState.isUpdatingContract ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid transparent',
                    borderTop: '2px solid ' + theme.accent.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (testState.isProcessingWithLLM || testState.isUploadingToStorage) ? (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: theme.border
                  }} />
                ) : (
                  <CheckCircle size={12} style={{ color: '#4CAF50' }} />
                )}
                <span style={{ color: theme.text.secondary }}>Blockchain Contract</span>
              </div>
            </div>

            {testState.statusMessage && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: theme.bg.card,
                borderRadius: '4px',
                fontSize: '12px',
                color: theme.text.secondary
              }}>
                {testState.statusMessage}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {testState.consolidationCompleted && testState.txHash && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#1B5E20',
            borderRadius: '8px',
            border: '1px solid #4CAF50'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <CheckCircle size={20} style={{ color: '#4CAF50' }} />
              <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                {testMode === 'monthly' ? 'Monthly' : 'Yearly'} Consolidation Completed!
              </span>
            </div>
            
            <div style={{ fontSize: '14px', color: '#C8E6C9' }}>
              <div>Transaction Hash: <code style={{ fontSize: '12px' }}>{testState.txHash}</code></div>
              {testState.storageHash && (
                <div style={{ marginTop: '5px' }}>
                  Storage Hash: <code style={{ fontSize: '12px' }}>{testState.storageHash}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {testState.error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#D32F2F',
            borderRadius: '8px',
            border: '1px solid #F44336'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <XCircle size={20} style={{ color: '#F44336' }} />
              <span style={{ color: '#F44336', fontWeight: '600' }}>
                Test Failed
              </span>
            </div>
            
            <div style={{ fontSize: '14px', color: '#FFCDD2' }}>
              {testState.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 