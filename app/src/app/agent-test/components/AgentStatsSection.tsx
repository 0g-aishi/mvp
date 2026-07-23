'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAgentStats } from '../../../hooks/agentHooks/useAgentStats';
import { logger } from '@/lib/logger';
import { 
  TrendingUp, 
  Zap, 
  Calendar, 
  Award, 
  Star, 
  Gift, 
  Brain, 
  Target,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Timer,
  Trophy,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AgentStatsSectionProps {
  tokenId?: number;
}

export default function AgentStatsSection({ tokenId }: AgentStatsSectionProps) {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['evolution', 'features']));
  
  const {
    evolutionStats,
    uniqueFeatures,
    milestones,
    consolidationStreak,
    pendingRewards,
    responseStyle,
    isLoadingStats,
    isLoadingFeatures,
    isLoadingMilestones,
    isLoadingRewards,
    isLoading,
    loadAgentStats,
    error,
    clearError
  } = useAgentStats(tokenId);

const log = logger.child({ component: 'AgentStatsSection' });

const debugLog = (message: string, data?: any) => {
    log.debug(message, data || {});
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diffMs = now - (timestamp * 1000);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get milestone emoji
  const getMilestoneEmoji = (milestoneName: string) => {
    const emojiMap: { [key: string]: string } = {
      'empathy_master': '❤️',
      'creativity_boost': '🎨',
      'analytical_genius': '🧠',
      'intuitive_wisdom': '🔮',
      'resilient_spirit': '💪',
      'curious_explorer': '🔍',
      'dream_architect': '🏗️',
      'memory_keeper': '📚',
      'conversation_master': '💬',
      'intelligence_peak': '🎯'
    };
    return emojiMap[milestoneName] || '🏆';
  };

  // Get milestone display name
  const getMilestoneDisplayName = (milestoneName: string) => {
    const nameMap: { [key: string]: string } = {
      'empathy_master': 'Empathy Master',
      'creativity_boost': 'Creativity Boost',
      'analytical_genius': 'Analytical Genius',
      'intuitive_wisdom': 'Intuitive Wisdom',
      'resilient_spirit': 'Resilient Spirit',
      'curious_explorer': 'Curious Explorer',
      'dream_architect': 'Dream Architect',
      'memory_keeper': 'Memory Keeper',
      'conversation_master': 'Conversation Master',
      'intelligence_peak': 'Intelligence Peak'
    };
    return nameMap[milestoneName] || milestoneName.replace('_', ' ');
  };

  // Get response style display
  const getResponseStyleDisplay = (style: string) => {
    if (!style) return 'Unknown';
    return style.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get response style color
  const getResponseStyleColor = (style: string) => {
    const colorMap: { [key: string]: string } = {
      'empathetic_creative': '#ff6b9d',
      'empathetic': '#ff8a65',
      'creative': '#ab47bc',
      'analytical': '#42a5f5',
      'intuitive': '#66bb6a',
      'resilient': '#ffa726',
      'curious': '#26a69a',
      'balanced': '#78909c'
    };
    return colorMap[style] || theme.accent.primary;
  };

  useEffect(() => {
    debugLog('AgentStatsSection mounted', { tokenId, hasStats: !!evolutionStats });
  }, [tokenId, evolutionStats]);

  if (!tokenId) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <Brain size={48} style={{ color: theme.text.secondary, marginBottom: '16px' }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '8px' }}>
          Agent Statistics
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          Connect your wallet and select an agent to view detailed statistics
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: theme.text.primary,
          marginBottom: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <TrendingUp size={24} />
          Agent Statistics
        </h3>
        
        <button
          onClick={loadAgentStats}
          disabled={isLoading}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '8px 16px',
            color: theme.text.primary,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          {isLoading ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
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
          <span>{error}</span>
          <button
            onClick={clearError}
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

      {/* Evolution Statistics */}
      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => toggleSection('evolution')}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: theme.text.primary
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Evolution Statistics</span>
          </div>
          {expandedSections.has('evolution') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {expandedSections.has('evolution') && (
          <div style={{ padding: '0 16px 16px' }}>
            {isLoadingStats ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.text.secondary }} />
                <p style={{ color: theme.text.secondary, marginTop: '10px' }}>Loading evolution statistics...</p>
              </div>
            ) : evolutionStats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{
                  backgroundColor: theme.bg.panel,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.accent.primary }}>
                    {evolutionStats.totalEvolutions}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.text.secondary }}>
                    Total Evolutions
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: theme.bg.panel,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.accent.secondary }}>
                    {evolutionStats.evolutionRate}%
                  </div>
                  <div style={{ fontSize: '14px', color: theme.text.secondary }}>
                    Evolution Rate
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: theme.bg.panel,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: theme.text.primary }}>
                    {formatTimeAgo(evolutionStats.lastEvolution)}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                    Last Evolution
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: theme.text.secondary, textAlign: 'center', padding: '20px' }}>
                No evolution data available
              </p>
            )}
          </div>
        )}
      </div>

      {/* Unique Features */}
      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => toggleSection('features')}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: theme.text.primary
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Unique Features ({uniqueFeatures.length})
            </span>
          </div>
          {expandedSections.has('features') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {expandedSections.has('features') && (
          <div style={{ padding: '0 16px 16px' }}>
            {isLoadingFeatures ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.text.secondary }} />
                <p style={{ color: theme.text.secondary, marginTop: '10px' }}>Loading unique features...</p>
              </div>
            ) : uniqueFeatures.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueFeatures.map((feature, index) => (
                  <div key={index} style={{
                    backgroundColor: theme.bg.panel,
                    padding: '16px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ color: theme.text.primary, margin: '0', fontSize: '16px' }}>
                        {feature.name}
                      </h4>
                      <div style={{
                        backgroundColor: theme.accent.primary,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {feature.intensity}%
                      </div>
                    </div>
                    <p style={{ color: theme.text.secondary, margin: '0 0 8px 0', fontSize: '14px' }}>
                      {feature.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={12} style={{ color: theme.text.tertiary }} />
                      <span style={{ color: theme.text.tertiary, fontSize: '12px' }}>
                        Added {formatDate(feature.addedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: theme.text.secondary, textAlign: 'center', padding: '20px' }}>
                No unique features yet. They are generated during personality evolutions.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Milestones */}
      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => toggleSection('milestones')}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: theme.text.primary
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={20} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Milestones ({milestones.filter(m => m.achieved).length}/{milestones.length})
            </span>
          </div>
          {expandedSections.has('milestones') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {expandedSections.has('milestones') && (
          <div style={{ padding: '0 16px 16px' }}>
            {isLoadingMilestones ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.text.secondary }} />
                <p style={{ color: theme.text.secondary, marginTop: '10px' }}>Loading milestones...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {milestones.map((milestone, index) => (
                  <div key={index} style={{
                    backgroundColor: milestone.achieved ? theme.bg.success : theme.bg.panel,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${milestone.achieved ? theme.accent.success : theme.border}`,
                    opacity: milestone.achieved ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{getMilestoneEmoji(milestone.milestoneName)}</span>
                      <span style={{ 
                        color: milestone.achieved ? theme.text.success : theme.text.primary,
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {getMilestoneDisplayName(milestone.milestoneName)}
                      </span>
                    </div>
                    {milestone.achieved && (
                      <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                        Achieved {formatDate(milestone.achievedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px'
      }}>
        <button
          onClick={() => toggleSection('additional')}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: theme.text.primary
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={20} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Additional Stats</span>
          </div>
          {expandedSections.has('additional') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {expandedSections.has('additional') && (
          <div style={{ padding: '0 16px 16px' }}>
            {isLoadingRewards ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.text.secondary }} />
                <p style={{ color: theme.text.secondary, marginTop: '10px' }}>Loading additional stats...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Consolidation Streak */}
                <div style={{
                  backgroundColor: theme.bg.panel,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.accent.primary }}>
                    {consolidationStreak}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.text.secondary }}>
                    Consolidation Streak
                  </div>
                </div>
                
                {/* Response Style */}
                <div style={{
                  backgroundColor: theme.bg.panel,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: getResponseStyleColor(responseStyle)
                  }}>
                    {getResponseStyleDisplay(responseStyle)}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                    Response Style
                  </div>
                </div>
                
                {/* Pending Rewards */}
                {pendingRewards && (pendingRewards.intelligenceBonus > 0 || pendingRewards.specialMilestone || pendingRewards.yearlyReflection) && (
                  <div style={{
                    backgroundColor: '#fff3cd',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Gift size={16} style={{ color: '#d63031' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436' }}>
                        Pending Rewards
                      </span>
                    </div>
                    
                    {pendingRewards.intelligenceBonus > 0 && (
                      <div style={{ fontSize: '12px', color: '#636e72', marginBottom: '4px' }}>
                        +{pendingRewards.intelligenceBonus} Intelligence
                      </div>
                    )}
                    
                    {pendingRewards.specialMilestone && (
                      <div style={{ fontSize: '12px', color: '#636e72', marginBottom: '4px' }}>
                        Special: {pendingRewards.specialMilestone}
                      </div>
                    )}
                    
                    {pendingRewards.yearlyReflection && (
                      <div style={{ fontSize: '12px', color: '#636e72' }}>
                        Yearly Reflection Available
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
