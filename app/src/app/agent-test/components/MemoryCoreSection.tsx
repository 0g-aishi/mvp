'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAgentMemoryCore } from '../../../hooks/agentHooks';
import { 
  Calendar, 
  TrendingUp, 
  Brain, 
  Database, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Trophy,
  Clock,
  ExternalLink,
  Archive,
  Star,
  Gem
} from 'lucide-react';

interface MemoryCoreSectionProps {
  hasAgent: boolean;
  effectiveTokenId: number | null;
}

export default function MemoryCoreSection({
  hasAgent,
  effectiveTokenId
}: MemoryCoreSectionProps) {
  const { theme } = useTheme();
  const [showMonthlyPreview, setShowMonthlyPreview] = useState(false);
  const [showMemoryCoreResults, setShowMemoryCoreResults] = useState(false);

  const {
    memoryCoreState,
    isProcessing,
    canStartYearlyConsolidation,
    checkYearlyReflection,
    loadMonthlyConsolidations,
    performYearlyConsolidation,
    resetMemoryCore,
    agentData,
    personalityTraits,
    operationalTokenId
  } = useAgentMemoryCore(effectiveTokenId || undefined);

  // Auto-check yearly reflection on mount
  useEffect(() => {
    if (hasAgent && operationalTokenId && !memoryCoreState.hasYearlyReflection) {
      checkYearlyReflection();
    }
  }, [hasAgent, operationalTokenId, checkYearlyReflection, memoryCoreState.hasYearlyReflection]);

  if (!hasAgent || !operationalTokenId) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '30px',
        textAlign: 'center'
      }}>
        <AlertCircle size={48} color={theme.text.secondary} style={{ marginBottom: '20px' }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '10px' }}>
          No Agent Found
        </h3>
        <p style={{ color: theme.text.secondary }}>
          You need to mint an agent first to test memory core functionality.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '30px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#8B5CF6',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Gem size={24} color="white" />
        </div>
        <div>
          <h2 style={{
            color: theme.text.primary,
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Yearly Memory Core
          </h2>
          <p style={{
            color: theme.text.secondary,
            margin: 0,
            marginTop: '5px'
          }}>
            Create yearly essence from 12 monthly consolidations (+5 INT bonus)
          </p>
        </div>
      </div>

      {/* Agent Info */}
      <div style={{
        backgroundColor: theme.bg.panel,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <Brain size={16} color={theme.accent.primary} />
          <span style={{ color: theme.text.primary, fontWeight: '600' }}>
            Agent #{operationalTokenId}
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          <div>
            <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>Name:</span>
            <span style={{ color: theme.text.primary, marginLeft: '8px' }}>
              {agentData?.agentName || 'Loading...'}
            </span>
          </div>
          <div>
            <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>Intelligence:</span>
            <span style={{ color: theme.text.primary, marginLeft: '8px' }}>
              {agentData?.intelligenceLevel || 'Loading...'}
            </span>
          </div>
          <div>
            <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>Dreams:</span>
            <span style={{ color: theme.text.primary, marginLeft: '8px' }}>
              {agentData?.dreamCount || 'Loading...'}
            </span>
          </div>
          <div>
            <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>Conversations:</span>
            <span style={{ color: theme.text.primary, marginLeft: '8px' }}>
              {agentData?.conversationCount || 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Check Yearly Reflection Availability */}
      <div style={{
        backgroundColor: theme.bg.panel,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: memoryCoreState.hasYearlyReflection ? '#8B5CF6' : theme.bg.card,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
            </div>
            <h3 style={{ color: theme.text.primary, margin: 0 }}>
              Yearly Reflection Status
            </h3>
          </div>
          <button
            onClick={checkYearlyReflection}
            disabled={memoryCoreState.isCheckingYearlyReflection}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: memoryCoreState.isCheckingYearlyReflection ? 'not-allowed' : 'pointer',
              opacity: memoryCoreState.isCheckingYearlyReflection ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={14} />
            {memoryCoreState.isCheckingYearlyReflection ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        {memoryCoreState.hasYearlyReflection ? (
          <div style={{
            backgroundColor: '#8B5CF6' + '20',
            border: `1px solid #8B5CF6`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <Star size={16} color="#8B5CF6" />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Yearly Reflection Available!
              </span>
            </div>
            <p style={{ color: theme.text.secondary, margin: 0, fontSize: '0.9rem' }}>
              You can now create your yearly memory core essence. This will grant +5 Intelligence bonus.
            </p>
          </div>
        ) : memoryCoreState.hasYearlyReflection === false ? (
          <div style={{
            backgroundColor: theme.text.secondary + '20',
            border: `1px solid ${theme.text.secondary}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <XCircle size={16} color={theme.text.secondary} />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                No Yearly Reflection Available
              </span>
            </div>
            <p style={{ color: theme.text.secondary, margin: 0, fontSize: '0.9rem' }}>
              Yearly reflection becomes available after completing December consolidation.
            </p>
          </div>
        ) : null}
      </div>

      {/* Step 2: Load Monthly Data */}
      <div style={{
        backgroundColor: theme.bg.panel,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: memoryCoreState.monthlyDreamConsolidations.length > 0 || memoryCoreState.monthlyConversationConsolidations.length > 0 ? '#8B5CF6' : theme.bg.card,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
            </div>
            <h3 style={{ color: theme.text.primary, margin: 0 }}>
              Monthly Consolidations
            </h3>
          </div>
          <button
            onClick={() => loadMonthlyConsolidations(memoryCoreState.currentYear - 1)}
            disabled={!memoryCoreState.hasYearlyReflection || memoryCoreState.isLoadingMonthlyData}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!memoryCoreState.hasYearlyReflection || memoryCoreState.isLoadingMonthlyData) ? 'not-allowed' : 'pointer',
              opacity: (!memoryCoreState.hasYearlyReflection || memoryCoreState.isLoadingMonthlyData) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Archive size={14} />
            {memoryCoreState.isLoadingMonthlyData ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {(memoryCoreState.monthlyDreamConsolidations.length > 0 || memoryCoreState.monthlyConversationConsolidations.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{
              backgroundColor: theme.bg.card,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {memoryCoreState.monthlyDreamConsolidations.length}
              </div>
              <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                Dream consolidations
              </div>
            </div>
            <div style={{
              backgroundColor: theme.bg.card,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {memoryCoreState.monthlyConversationConsolidations.length}
              </div>
              <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                Conversation consolidations
              </div>
            </div>
          </div>
        )}

        {/* Monthly Data Preview */}
        {(memoryCoreState.monthlyDreamConsolidations.length > 0 || memoryCoreState.monthlyConversationConsolidations.length > 0) && (
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            padding: '12px'
          }}>
            <button
              onClick={() => setShowMonthlyPreview(!showMonthlyPreview)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0',
                marginBottom: showMonthlyPreview ? '10px' : '0'
              }}
            >
              {showMonthlyPreview ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Eye size={16} />
              Preview Monthly Consolidations
            </button>
            {showMonthlyPreview && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: theme.bg.panel,
                borderRadius: '4px',
                padding: '10px'
              }}>
                <h5 style={{ color: theme.text.primary, fontSize: '0.9rem', marginBottom: '8px' }}>
                  Dream Consolidations:
                </h5>
                {memoryCoreState.monthlyDreamConsolidations.map((dream, index) => (
                  <div key={index} style={{
                    borderBottom: index < memoryCoreState.monthlyDreamConsolidations.length - 1 ? `1px solid ${theme.border}` : 'none',
                    paddingBottom: index < memoryCoreState.monthlyDreamConsolidations.length - 1 ? '8px' : '0',
                    marginBottom: index < memoryCoreState.monthlyDreamConsolidations.length - 1 ? '8px' : '0'
                  }}>
                    <div style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.8rem' }}>
                      {dream.period} - {dream.total_dreams} dreams
                    </div>
                    <div style={{ color: theme.text.secondary, fontSize: '0.75rem' }}>
                      Themes: {dream.dominant.themes?.join(', ') || 'none'}
                    </div>
                  </div>
                ))}
                
                <h5 style={{ color: theme.text.primary, fontSize: '0.9rem', marginBottom: '8px', marginTop: '12px' }}>
                  Conversation Consolidations:
                </h5>
                {memoryCoreState.monthlyConversationConsolidations.map((conv, index) => (
                  <div key={index} style={{
                    borderBottom: index < memoryCoreState.monthlyConversationConsolidations.length - 1 ? `1px solid ${theme.border}` : 'none',
                    paddingBottom: index < memoryCoreState.monthlyConversationConsolidations.length - 1 ? '8px' : '0',
                    marginBottom: index < memoryCoreState.monthlyConversationConsolidations.length - 1 ? '8px' : '0'
                  }}>
                    <div style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.8rem' }}>
                      {conv.period} - {conv.total_conversations} conversations
                    </div>
                    <div style={{ color: theme.text.secondary, fontSize: '0.75rem' }}>
                      Topics: {conv.dominant.topics?.join(', ') || 'none'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Perform Yearly Consolidation */}
      <div style={{
        backgroundColor: theme.bg.panel,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: memoryCoreState.isCompleted ? '#8B5CF6' : theme.bg.card,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
            </div>
            <h3 style={{ color: theme.text.primary, margin: 0 }}>
              Create Memory Core
            </h3>
          </div>
          <button
            onClick={performYearlyConsolidation}
            disabled={!canStartYearlyConsolidation || isProcessing}
            style={{
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!canStartYearlyConsolidation || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: (!canStartYearlyConsolidation || isProcessing) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Gem size={14} />
            {isProcessing ? 'Processing...' : 'Create Yearly Essence'}
          </button>
        </div>

        {/* Status Messages */}
        {memoryCoreState.statusMessage && (
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isProcessing ? (
              <Clock size={16} color="#8B5CF6" />
            ) : memoryCoreState.isCompleted ? (
              <CheckCircle size={16} color="#8B5CF6" />
            ) : (
              <AlertCircle size={16} color={theme.text.secondary} />
            )}
            <span style={{ color: theme.text.primary }}>
              {memoryCoreState.statusMessage}
            </span>
          </div>
        )}

        {/* Process Progress */}
        {isProcessing && (
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: memoryCoreState.isProcessingWithLLM ? '#8B5CF6' : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  AI Processing (Creating Yearly Essence)
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: memoryCoreState.isUploadingToStorage ? '#8B5CF6' : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  Storage Upload
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: memoryCoreState.isUpdatingContract ? '#8B5CF6' : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  Contract Update (+5 INT)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {memoryCoreState.txHash && (
          <div style={{
            backgroundColor: '#8B5CF6' + '20',
            border: `1px solid #8B5CF6`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="#8B5CF6" />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Memory Core Created Successfully! (+5 Intelligence)
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}>
              <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                TX: {memoryCoreState.txHash.substring(0, 10)}...{memoryCoreState.txHash.substring(58)}
              </span>
              <button
                onClick={() => window.open(`https://explorer-testnet.0g.ai/tx/${memoryCoreState.txHash}`, '_blank')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#8B5CF6',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Memory Core Results */}
      {memoryCoreState.isCompleted && memoryCoreState.memoryCoreData && (
        <div style={{
          backgroundColor: theme.bg.panel,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <h3 style={{ color: theme.text.primary, margin: 0 }}>
              Yearly Memory Core Created
            </h3>
            <button
              onClick={() => setShowMemoryCoreResults(!showMemoryCoreResults)}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '8px 16px',
                color: theme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {showMemoryCoreResults ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Eye size={16} />
              View Results
            </button>
          </div>

          {showMemoryCoreResults && (
            <div style={{
              backgroundColor: theme.bg.card,
              borderRadius: '6px',
              padding: '15px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8B5CF6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {memoryCoreState.memoryCoreData.yearly_overview.total_dreams}
                  </div>
                  <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                    Dreams Processed
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8B5CF6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {memoryCoreState.memoryCoreData.yearly_overview.total_conversations}
                  </div>
                  <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                    Conversations
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8B5CF6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {memoryCoreState.memoryCoreData.final_metrics.consciousness_level}
                  </div>
                  <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                    Consciousness Level
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: theme.bg.panel,
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <h4 style={{ color: theme.text.primary, fontSize: '1rem', marginBottom: '10px' }}>
                  Yearly Essence Summary:
                </h4>
                <p style={{
                  color: theme.text.secondary,
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {memoryCoreState.memoryCoreData.yearly_essence}
                </p>
              </div>

              {memoryCoreState.memoryCoreData.wisdom_crystallization.core_insights.length > 0 && (
                <div>
                  <h4 style={{ color: theme.text.primary, fontSize: '1rem', marginBottom: '10px' }}>
                    Core Insights:
                  </h4>
                  <ul style={{ color: theme.text.secondary, fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {memoryCoreState.memoryCoreData.wisdom_crystallization.core_insights.map((insight, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {memoryCoreState.error && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={16} />
          <span>{memoryCoreState.error}</span>
          <button
            onClick={resetMemoryCore}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              marginLeft: 'auto'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
} 