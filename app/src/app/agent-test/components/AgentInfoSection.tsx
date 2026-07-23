'use client';

import { useTheme } from '../../../contexts/ThemeContext';
import { Brain, Sparkles, CheckCircle, AlertCircle, Loader2, Eye, Database, Users, Activity, Zap } from 'lucide-react';

interface AgentInfoSectionProps {
  // Agent data
  agentData: any;
  personalityTraits: any;
  memoryAccess: any;
  canProcessDreamToday: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingPersonalityTraits: boolean;
  isLoadingMemoryAccess: boolean;
  isLoadingCanProcess: boolean;
  
  // Agent state
  hasAgent: boolean;
  effectiveTokenId: number | undefined;
}

export default function AgentInfoSection({
  agentData,
  personalityTraits,
  memoryAccess,
  canProcessDreamToday,
  isLoading,
  isLoadingPersonalityTraits,
  isLoadingMemoryAccess,
  isLoadingCanProcess,
  hasAgent,
  effectiveTokenId
}: AgentInfoSectionProps) {
  const { theme } = useTheme();

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
          You need to mint an agent first to view agent information.
        </p>
      </div>
    );
  }

  if (isLoading || isLoadingPersonalityTraits || isLoadingMemoryAccess) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <Loader2 size={48} style={{ 
          color: theme.accent.primary, 
          marginBottom: '20px',
          animation: 'spin 1s linear infinite' 
        }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '10px' }}>
          Loading Agent Information...
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          Fetching agent data from blockchain...
        </p>
      </div>
    );
  }

  const personalityInitialized = agentData?.personalityInitialized || false;
  const dreamCount = Number(agentData?.dreamCount || 0);
  const intelligenceLevel = Number(agentData?.intelligenceLevel || 1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Agent Overview Card */}
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
          marginBottom: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: theme.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Brain size={32} style={{ color: 'white' }} />
          </div>
          <div>
            <h2 style={{
              color: theme.text.primary,
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 8px 0'
            }}>
              {agentData?.agentName || 'Unknown Agent'}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                color: theme.text.secondary,
                fontSize: '14px'
              }}>
                Token ID: #{effectiveTokenId}
              </span>
              <span style={{
                padding: '4px 8px',
                backgroundColor: intelligenceLevel >= 3 ? '#44ff44' : intelligenceLevel >= 2 ? '#ffaa44' : '#ff4444',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Level {intelligenceLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <Activity size={20} style={{ color: theme.accent.primary, marginBottom: '8px' }} />
            <div style={{ color: theme.text.primary, fontSize: '18px', fontWeight: '600' }}>
              {dreamCount}
            </div>
            <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
              Dreams Processed
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <Users size={20} style={{ color: theme.accent.primary, marginBottom: '8px' }} />
            <div style={{ color: theme.text.primary, fontSize: '18px', fontWeight: '600' }}>
              {Number(agentData?.conversationCount || 0)}
            </div>
            <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
              Conversations
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <Zap size={20} style={{ color: theme.accent.primary, marginBottom: '8px' }} />
            <div style={{ color: theme.text.primary, fontSize: '18px', fontWeight: '600' }}>
              {Number(agentData?.totalEvolutions || 0)}
            </div>
            <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
              Evolutions
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <CheckCircle size={20} style={{ 
              color: canProcessDreamToday ? '#44ff44' : '#ff4444', 
              marginBottom: '8px' 
            }} />
            <div style={{ 
              color: canProcessDreamToday ? '#44ff44' : '#ff4444', 
              fontSize: '14px', 
              fontWeight: '600' 
            }}>
              {canProcessDreamToday ? 'Ready' : 'Cooldown'}
            </div>
            <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
              Dream Status
            </div>
          </div>
        </div>

        {/* Personality Initialization Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '15px',
          backgroundColor: personalityInitialized ? '#44ff4420' : '#ff444420',
          border: `1px solid ${personalityInitialized ? '#44ff44' : '#ff4444'}`,
          borderRadius: '8px'
        }}>
          {personalityInitialized ? (
            <CheckCircle size={20} style={{ color: '#44ff44' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#ff4444' }} />
          )}
          <div>
            <div style={{
              color: personalityInitialized ? '#44ff44' : '#ff4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {personalityInitialized ? 'Personality Initialized' : 'Personality Not Initialized'}
            </div>
            <div style={{
              color: theme.text.secondary,
              fontSize: '12px'
            }}>
              {personalityInitialized 
                ? 'Agent has developed personality traits through dreams'
                : 'Agent needs to process dreams to develop personality'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Personality Traits Card */}
      {personalityTraits && (
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{
            color: theme.text.primary,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Brain size={20} />
            Personality Traits
          </h3>

          {/* Personality Bars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {[
              { name: 'Creativity', value: personalityTraits.creativity, color: '#ff6b6b' },
              { name: 'Analytical', value: personalityTraits.analytical, color: '#4ecdc4' },
              { name: 'Empathy', value: personalityTraits.empathy, color: '#45b7d1' },
              { name: 'Intuition', value: personalityTraits.intuition, color: '#96ceb4' },
              { name: 'Resilience', value: personalityTraits.resilience, color: '#feca57' },
              { name: 'Curiosity', value: personalityTraits.curiosity, color: '#ff9ff3' }
            ].map((trait) => (
              <div key={trait.name} style={{
                padding: '12px',
                backgroundColor: theme.bg.panel,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    color: theme.text.primary,
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {trait.name}
                  </span>
                  <span style={{
                    color: trait.color,
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {trait.value}/100
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: theme.border,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${trait.value}%`,
                    height: '100%',
                    backgroundColor: trait.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Dominant Mood */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '15px',
            backgroundColor: theme.bg.panel,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            marginBottom: '20px'
          }}>
            <Sparkles size={20} style={{ color: theme.accent.primary }} />
            <div>
              <div style={{
                color: theme.text.primary,
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Dominant Mood: {personalityTraits.dominantMood || 'neutral'}
              </div>
              <div style={{
                color: theme.text.secondary,
                fontSize: '12px'
              }}>
                Current emotional state of the agent
              </div>
            </div>
          </div>

          {/* Unique Features */}
          {personalityTraits.uniqueFeatures && personalityTraits.uniqueFeatures.length > 0 && (
            <div>
              <h4 style={{
                color: theme.text.primary,
                fontSize: '16px',
                marginBottom: '15px'
              }}>
                Unique Features ({personalityTraits.uniqueFeatures.length})
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '15px'
              }}>
                {personalityTraits.uniqueFeatures.map((feature: any, index: number) => (
                  <div key={index} style={{
                    padding: '15px',
                    backgroundColor: theme.bg.panel,
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '8px'
                    }}>
                      <h5 style={{
                        color: theme.text.primary,
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0'
                      }}>
                        {feature.name}
                      </h5>
                      <span style={{
                        backgroundColor: theme.accent.primary,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        {feature.intensity}/100
                      </span>
                    </div>
                    <p style={{
                      color: theme.text.secondary,
                      fontSize: '12px',
                      margin: '0',
                      lineHeight: '1.4'
                    }}>
                      {feature.description}
                    </p>
                    <div style={{
                      color: theme.text.secondary,
                      fontSize: '10px',
                      marginTop: '8px'
                    }}>
                      Added: {new Date(Number(feature.addedAt) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Memory Access Card */}
      {memoryAccess && (
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{
            color: theme.text.primary,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Database size={20} />
            Memory Access & Storage
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: theme.bg.panel,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              textAlign: 'center'
            }}>
              <Eye size={20} style={{ color: theme.accent.primary, marginBottom: '8px' }} />
              <div style={{
                color: theme.text.primary,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {memoryAccess.monthsAccessible}
              </div>
              <div style={{
                color: theme.text.secondary,
                fontSize: '12px'
              }}>
                Months Accessible
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: theme.bg.panel,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              textAlign: 'center'
            }}>
              <Database size={20} style={{ color: theme.accent.primary, marginBottom: '8px' }} />
              <div style={{
                color: theme.text.primary,
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {memoryAccess.memoryDepth}
              </div>
              <div style={{
                color: theme.text.secondary,
                fontSize: '12px'
              }}>
                Memory Depth
              </div>
            </div>
          </div>

          {/* Memory Hashes */}
          {agentData?.memory && (
            <div style={{
              padding: '15px',
              backgroundColor: theme.bg.panel,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`
            }}>
              <h4 style={{
                color: theme.text.primary,
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                Storage Hashes
              </h4>
              <div style={{
                display: 'grid',
                gap: '8px',
                fontSize: '11px',
                color: theme.text.secondary,
                fontFamily: 'monospace'
              }}>
                <div><strong>Current Dreams:</strong> {agentData.memory.currentDreamDailyHash}</div>
                <div><strong>Monthly Dreams:</strong> {agentData.memory.lastDreamMonthlyHash}</div>
                <div><strong>Memory Core:</strong> {agentData.memory.memoryCoreHash}</div>
                <div><strong>Month/Year:</strong> {agentData.memory.currentMonth}/{agentData.memory.currentYear}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 