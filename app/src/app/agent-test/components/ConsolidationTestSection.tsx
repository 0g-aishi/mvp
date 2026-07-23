'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAgentConsolidation } from '../../../hooks/agentHooks';
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
  ExternalLink
} from 'lucide-react';

interface ConsolidationTestSectionProps {
  hasAgent: boolean;
  effectiveTokenId: number | null;
}

export default function ConsolidationTestSection({
  hasAgent,
  effectiveTokenId
}: ConsolidationTestSectionProps) {
  const { theme } = useTheme();
  const [showDreamPreview, setShowDreamPreview] = useState(false);
  const [showConversationPreview, setShowConversationPreview] = useState(false);
  const [showConsolidationResults, setShowConsolidationResults] = useState(false);

  const {
    consolidationState,
    isProcessing,
    canStartConsolidation,
    checkConsolidationNeed,
    loadMonthlyData,
    performConsolidation,
    resetConsolidation,
    agentData,
    personalityTraits,
    operationalTokenId
  } = useAgentConsolidation(effectiveTokenId || undefined);

  // Auto-check consolidation need on mount
  useEffect(() => {
    if (hasAgent && operationalTokenId && !consolidationState.needsConsolidation) {
      checkConsolidationNeed();
    }
  }, [hasAgent, operationalTokenId, checkConsolidationNeed, consolidationState.needsConsolidation]);

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
          You need to mint an agent first to test consolidation functionality.
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
          backgroundColor: theme.accent.primary,
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Database size={24} color="white" />
        </div>
        <div>
          <h2 style={{
            color: theme.text.primary,
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Monthly Consolidation Test
          </h2>
          <p style={{
            color: theme.text.secondary,
            margin: 0,
            marginTop: '5px'
          }}>
            Test monthly consolidation with LLM processing and contract updates
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

      {/* Step 1: Check Consolidation Need */}
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
              backgroundColor: consolidationState.needsConsolidation ? theme.accent.secondary : theme.bg.card,
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
              Consolidation Status
            </h3>
          </div>
          <button
            onClick={checkConsolidationNeed}
            disabled={consolidationState.isCheckingNeed}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: consolidationState.isCheckingNeed ? 'not-allowed' : 'pointer',
              opacity: consolidationState.isCheckingNeed ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={14} />
            {consolidationState.isCheckingNeed ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        {consolidationState.needsConsolidation && (
          <div style={{
            backgroundColor: theme.accent.secondary + '20',
            border: `1px solid ${theme.accent.secondary}`,
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
              <AlertCircle size={16} color={theme.accent.secondary} />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Consolidation Required
              </span>
            </div>
            <p style={{ color: theme.text.secondary, margin: 0, fontSize: '0.9rem' }}>
              Current period: {consolidationState.currentMonth}/{consolidationState.currentYear}
            </p>
          </div>
        )}

        {consolidationState.consolidationReward && (
          <div style={{
            backgroundColor: theme.accent.primary + '20',
            border: `1px solid ${theme.accent.primary}`,
            borderRadius: '6px',
            padding: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <Trophy size={16} color={theme.accent.primary} />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Consolidation Rewards
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px'
            }}>
              <div>
                <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Base:</span>
                <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                  +{consolidationState.consolidationReward.baseReward} INT
                </span>
              </div>
              <div>
                <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Streak:</span>
                <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                  +{consolidationState.consolidationReward.streakBonus} INT
                </span>
              </div>
              <div>
                <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Early Bird:</span>
                <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                  +{consolidationState.consolidationReward.earlyBirdBonus} INT
                </span>
              </div>
              <div>
                <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Total:</span>
                <span style={{ 
                  color: theme.accent.primary, 
                  marginLeft: '5px',
                  fontWeight: 'bold'
                }}>
                  +{consolidationState.consolidationReward.totalReward} INT
                </span>
              </div>
            </div>
          </div>
        )}
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
              backgroundColor: consolidationState.monthlyDreams.length > 0 || consolidationState.monthlyConversations.length > 0 ? theme.accent.secondary : theme.bg.card,
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
              Monthly Data
            </h3>
          </div>
          <button
            onClick={loadMonthlyData}
            disabled={!consolidationState.needsConsolidation || consolidationState.isLoadingData}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!consolidationState.needsConsolidation || consolidationState.isLoadingData) ? 'not-allowed' : 'pointer',
              opacity: (!consolidationState.needsConsolidation || consolidationState.isLoadingData) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Database size={14} />
            {consolidationState.isLoadingData ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {(consolidationState.monthlyDreams.length > 0 || consolidationState.monthlyConversations.length > 0) && (
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
              <div style={{ color: theme.accent.primary, fontWeight: 'bold', fontSize: '1.2rem' }}>
                {consolidationState.monthlyDreams.length}
              </div>
              <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                Dreams to consolidate
              </div>
            </div>
            <div style={{
              backgroundColor: theme.bg.card,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ color: theme.accent.primary, fontWeight: 'bold', fontSize: '1.2rem' }}>
                {consolidationState.monthlyConversations.length}
              </div>
              <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                Conversations to consolidate
              </div>
            </div>
          </div>
        )}

        {/* Dream Preview */}
        {consolidationState.monthlyDreams.length > 0 && (
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '10px'
          }}>
            <button
              onClick={() => setShowDreamPreview(!showDreamPreview)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0',
                marginBottom: showDreamPreview ? '10px' : '0'
              }}
            >
              {showDreamPreview ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Eye size={16} />
              Preview Dreams ({consolidationState.monthlyDreams.length})
            </button>
            {showDreamPreview && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: theme.bg.panel,
                borderRadius: '4px',
                padding: '10px'
              }}>
                {consolidationState.monthlyDreams.slice(0, 5).map((dream, index) => (
                  <div key={index} style={{
                    borderBottom: index < 4 ? `1px solid ${theme.border}` : 'none',
                    paddingBottom: index < 4 ? '8px' : '0',
                    marginBottom: index < 4 ? '8px' : '0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.9rem' }}>
                        Dream #{dream.id}
                      </span>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>
                        {dream.date}
                      </span>
                    </div>
                    <div style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>
                      Emotions: {dream.emotions?.join(', ') || 'none'} | 
                      Symbols: {dream.symbols?.join(', ') || 'none'} | 
                      Intensity: {dream.intensity}/10
                    </div>
                  </div>
                ))}
                {consolidationState.monthlyDreams.length > 5 && (
                  <div style={{ color: theme.text.secondary, fontSize: '0.8rem', textAlign: 'center' }}>
                    ... and {consolidationState.monthlyDreams.length - 5} more dreams
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conversation Preview */}
        {consolidationState.monthlyConversations.length > 0 && (
          <div style={{
            backgroundColor: theme.bg.card,
            borderRadius: '6px',
            padding: '12px'
          }}>
            <button
              onClick={() => setShowConversationPreview(!showConversationPreview)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0',
                marginBottom: showConversationPreview ? '10px' : '0'
              }}
            >
              {showConversationPreview ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Eye size={16} />
              Preview Conversations ({consolidationState.monthlyConversations.length})
            </button>
            {showConversationPreview && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: theme.bg.panel,
                borderRadius: '4px',
                padding: '10px'
              }}>
                {consolidationState.monthlyConversations.slice(0, 5).map((conv, index) => (
                  <div key={index} style={{
                    borderBottom: index < 4 ? `1px solid ${theme.border}` : 'none',
                    paddingBottom: index < 4 ? '8px' : '0',
                    marginBottom: index < 4 ? '8px' : '0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ color: theme.text.primary, fontWeight: '600', fontSize: '0.9rem' }}>
                        Conversation #{conv.id}
                      </span>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>
                        {conv.date}
                      </span>
                    </div>
                    <div style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>
                      Topic: {conv.topic || 'General'} | 
                      Tone: {conv.emotional_tone || 'neutral'}
                    </div>
                  </div>
                ))}
                {consolidationState.monthlyConversations.length > 5 && (
                  <div style={{ color: theme.text.secondary, fontSize: '0.8rem', textAlign: 'center' }}>
                    ... and {consolidationState.monthlyConversations.length - 5} more conversations
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Perform Consolidation */}
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
              backgroundColor: consolidationState.isCompleted ? theme.accent.primary : theme.bg.card,
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
              Perform Consolidation
            </h3>
          </div>
          <button
            onClick={performConsolidation}
            disabled={!canStartConsolidation || isProcessing}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: (!canStartConsolidation || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: (!canStartConsolidation || isProcessing) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={14} />
            {isProcessing ? 'Processing...' : 'Start Consolidation'}
          </button>
        </div>

        {/* Status Messages */}
        {consolidationState.statusMessage && (
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
              <Clock size={16} color={theme.accent.primary} />
            ) : consolidationState.isCompleted ? (
              <CheckCircle size={16} color={theme.accent.primary} />
            ) : (
              <AlertCircle size={16} color={theme.text.secondary} />
            )}
            <span style={{ color: theme.text.primary }}>
              {consolidationState.statusMessage}
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
                  backgroundColor: consolidationState.isProcessingWithLLM ? theme.accent.primary : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  LLM Processing
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
                  backgroundColor: consolidationState.isUploadingToStorage ? theme.accent.primary : theme.text.secondary
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
                  backgroundColor: consolidationState.isUpdatingContract ? theme.accent.primary : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  Contract Update
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
                  backgroundColor: consolidationState.isClearingFiles ? theme.accent.primary : theme.text.secondary
                }} />
                <span style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                  File Cleanup
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {consolidationState.txHash && (
          <div style={{
            backgroundColor: theme.accent.primary + '20',
            border: `1px solid ${theme.accent.primary}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color={theme.accent.primary} />
              <span style={{ color: theme.text.primary, fontWeight: '600' }}>
                Transaction Confirmed
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}>
              <span style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                TX: {consolidationState.txHash.substring(0, 10)}...{consolidationState.txHash.substring(58)}
              </span>
              <button
                onClick={() => window.open(`https://explorer-testnet.0g.ai/tx/${consolidationState.txHash}`, '_blank')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.accent.primary,
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

      {/* Consolidation Results */}
      {consolidationState.isCompleted && (consolidationState.dreamConsolidation || consolidationState.conversationConsolidation) && (
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
                backgroundColor: theme.accent.primary,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={16} color="white" />
              </div>
              <h3 style={{ color: theme.text.primary, margin: 0 }}>
                Consolidation Results
              </h3>
            </div>
            <button
              onClick={() => setShowConsolidationResults(!showConsolidationResults)}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                color: theme.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {showConsolidationResults ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {showConsolidationResults ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showConsolidationResults && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {/* Dream Consolidation */}
              {consolidationState.dreamConsolidation && (
                <div style={{
                  backgroundColor: theme.bg.card,
                  borderRadius: '6px',
                  padding: '15px'
                }}>
                  <h4 style={{ color: theme.text.primary, margin: '0 0 10px 0' }}>
                    Dream Consolidation
                  </h4>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                      Dominant Themes:
                    </div>
                    <div style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                      {consolidationState.dreamConsolidation.dominant.themes.join(', ')}
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                      Monthly Essence:
                    </div>
                    <div style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                      {consolidationState.dreamConsolidation.monthly_essence.substring(0, 200)}...
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px'
                  }}>
                    <div>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Avg Intensity:</span>
                      <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                        {consolidationState.dreamConsolidation.metrics.avg_intensity.toFixed(1)}/10
                      </span>
                    </div>
                    <div>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Avg Lucidity:</span>
                      <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                        {consolidationState.dreamConsolidation.metrics.avg_lucidity.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Consolidation */}
              {consolidationState.conversationConsolidation && (
                <div style={{
                  backgroundColor: theme.bg.card,
                  borderRadius: '6px',
                  padding: '15px'
                }}>
                  <h4 style={{ color: theme.text.primary, margin: '0 0 10px 0' }}>
                    Conversation Consolidation
                  </h4>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                      Dominant Topics:
                    </div>
                    <div style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                      {consolidationState.conversationConsolidation.dominant.topics.join(', ')}
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: theme.text.secondary, fontSize: '0.9rem' }}>
                      Monthly Essence:
                    </div>
                    <div style={{ color: theme.text.primary, fontSize: '0.9rem' }}>
                      {consolidationState.conversationConsolidation.monthly_essence.substring(0, 200)}...
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px'
                  }}>
                    <div>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Trust Level:</span>
                      <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                        {consolidationState.conversationConsolidation.relationship_evolution.trust_level}/10
                      </span>
                    </div>
                    <div>
                      <span style={{ color: theme.text.secondary, fontSize: '0.8rem' }}>Therapeutic Alliance:</span>
                      <span style={{ color: theme.text.primary, marginLeft: '5px' }}>
                        {consolidationState.conversationConsolidation.relationship_evolution.therapeutic_alliance}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {consolidationState.error && (
        <div style={{
          backgroundColor: '#ef4444' + '20',
          border: `1px solid #ef4444`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <XCircle size={16} color="#ef4444" />
            <span style={{ color: theme.text.primary, fontWeight: '600' }}>
              Error
            </span>
          </div>
          <p style={{ color: theme.text.secondary, margin: 0, fontSize: '0.9rem' }}>
            {consolidationState.error}
          </p>
        </div>
      )}

      {/* Reset Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        <button
          onClick={resetConsolidation}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            color: theme.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={16} />
          Reset Consolidation Test
        </button>
      </div>
    </div>
  );
} 