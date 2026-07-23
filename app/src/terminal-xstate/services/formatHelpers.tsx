/**
 * @fileoverview Helper functions for formatting agent data in terminal
 * @description Provides utilities for displaying agent information with theme colors
 */

import React from 'react';
import { TerminalLine } from '../machines/types';
import { CompleteAgentData } from './contractReader';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'FormatHelpers' });

// Theme colors matching ThemeContext
const colors = {
  primary: '#E6E6E6',      // text.primary
  secondary: '#9999A5',    // text.secondary
  accent: '#8B5CF6',       // accent.primary (violet)
  success: '#10B981',      // accent.success
  background: '#2D2D2D',   // bg for empty progress
  bar: '#8B5CF6',          // filled progress bar
  barEmpty: '#333333',     // empty progress bar
  highest: '#10B981',      // highlight color for highest trait
};

/**
 * Creates a colored progress bar for trait visualization
 */
function createColoredProgressBar(value: number, isHighest: boolean = false, max: number = 100): React.ReactNode {
  const barLength = 10;
  const filled = Math.round((value / max) * barLength);
  const empty = barLength - filled;
  
  const barColor = isHighest ? colors.highest : colors.bar;
  
  return (
    <>
      <span style={{ color: barColor }}>{'█'.repeat(filled)}</span>
      <span style={{ color: colors.barEmpty }}>{'░'.repeat(empty)}</span>
    </>
  );
}

/**
 * Formats personality traits for terminal display
 */
export function formatPersonalityOutput(agentData: CompleteAgentData | null): TerminalLine[] {
  log.debug('formatPersonalityOutput called', {
    hasData: !!agentData,
    personality: agentData?.personality
  });
  
  const timestamp = Date.now();
  
  if (!agentData) {
    return [{
      type: 'error',
      content: 'No agent found. Please mint an agent first.',
      timestamp
    }];
  }

  const lines: TerminalLine[] = [];

  // Traits with progress bars
  const traits = [
    { name: 'Creativity', value: agentData.personality.creativity },
    { name: 'Analytical', value: agentData.personality.analytical },
    { name: 'Empathy', value: agentData.personality.empathy },
    { name: 'Intuition', value: agentData.personality.intuition },
    { name: 'Resilience', value: agentData.personality.resilience },
    { name: 'Curiosity', value: agentData.personality.curiosity }
  ];

  // Find highest trait
  const maxTrait = traits.reduce((max, trait) => 
    trait.value > max.value ? trait : max, traits[0]);

  traits.forEach((trait, index) => {
    const isHighest = trait.value === maxTrait.value && trait.value > 50;
    const bar = createColoredProgressBar(trait.value, isHighest);
    
    const content = (
      <>
        <span style={{ color: colors.primary, fontWeight: '500' }}>
          {trait.name.padEnd(12)}
        </span>
        <span style={{ marginLeft: '8px', marginRight: '8px' }}>{bar}</span>
        <span style={{ color: colors.accent, fontWeight: '600' }}>
          {String(trait.value).padStart(3)}
        </span>
        <span style={{ color: colors.secondary }}>/100</span>
        {isHighest && (
          <span style={{ 
            color: colors.highest, 
            fontWeight: '500',
            marginLeft: '8px'
          }}>
            ★ highest
          </span>
        )}
      </>
    );
    
    lines.push({
      type: 'info',
      content,
      timestamp: timestamp + 1 + index
    });
  });

  // Empty line
  lines.push({
    type: 'info',
    content: '',
    timestamp: timestamp + 7
  });

  // Dominant mood
  const moodContent = (
    <>
      <span style={{ color: colors.secondary }}>Dominant Mood: </span>
      <span style={{ 
        color: colors.accent, 
        fontWeight: '600',
        textTransform: 'capitalize'
      }}>
        {agentData.personality.dominantMood}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: moodContent,
    timestamp: timestamp + 8
  });

  // Response style
  const responseStyle = agentData.computed?.responseStyle || agentData.cachedResponseStyle || 'balanced thinker';
  const styleContent = (
    <>
      <span style={{ color: colors.secondary }}>Response Style: </span>
      <span style={{ 
        color: colors.success, 
        fontWeight: '600',
        fontStyle: 'italic'
      }}>
        {responseStyle}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: styleContent,
    timestamp: timestamp + 9
  });

  log.debug('formatPersonalityOutput returning lines', {
    lineCount: lines.length,
    firstLine: lines[0]
  });

  return lines;
}

/**
 * Formats unique features for terminal display
 */
export function formatUniqueFeaturesOutput(agentData: CompleteAgentData | null): TerminalLine[] {
  const timestamp = Date.now();
  
  if (!agentData) {
    return [{
      type: 'error',
      content: 'No agent found. Please mint an agent first.',
      timestamp
    }];
  }

  const lines: TerminalLine[] = [];

  if (!agentData.features || agentData.features.length === 0) {
    // No features message
    const noFeaturesContent = (
      <>
        <span style={{ color: colors.secondary }}>No unique features yet</span>
      </>
    );
    
    lines.push({
      type: 'info',
      content: noFeaturesContent,
      timestamp: timestamp + 1
    });

    const evolutionHintContent = (
      <>
        <span style={{ color: colors.secondary, fontStyle: 'italic' }}>
          Features emerge through dream evolution
        </span>
      </>
    );
    
    lines.push({
      type: 'info',
      content: evolutionHintContent,
      timestamp: timestamp + 2
    });
  } else {
    agentData.features.forEach((feature, index) => {
      if (index > 0) {
        // Empty line between features
        lines.push({
          type: 'info',
          content: '',
          timestamp: timestamp + (index * 4)
        });
      }

      // Feature name with star
      const featureNameContent = (
        <>
          <span style={{ color: colors.success, fontSize: '16px' }}>★ </span>
          <span style={{ 
            color: colors.accent, 
            fontWeight: '600',
            fontSize: '15px'
          }}>
            {feature.name}
          </span>
        </>
      );
      
      lines.push({
        type: 'info',
        content: featureNameContent,
        timestamp: timestamp + (index * 4) + 1
      });

      // Intensity with progress bar
      const intensityBar = createColoredProgressBar(feature.intensity, feature.intensity >= 80);
      const intensityContent = (
        <>
          <span style={{ color: colors.secondary }}>Intensity: </span>
          <span style={{ marginLeft: '8px', marginRight: '8px' }}>{intensityBar}</span>
          <span style={{ color: colors.accent, fontWeight: '600' }}>
            {String(feature.intensity).padStart(3)}
          </span>
          <span style={{ color: colors.secondary }}>/100</span>
          {feature.intensity >= 80 && (
            <span style={{ 
              color: colors.success, 
              fontWeight: '500',
              marginLeft: '8px'
            }}>
              powerful
            </span>
          )}
        </>
      );
      
      lines.push({
        type: 'info',
        content: intensityContent,
        timestamp: timestamp + (index * 4) + 2
      });

      // Description
      const descriptionContent = (
        <>
          <span style={{ 
            color: colors.primary, 
            fontStyle: 'italic',
            opacity: 0.9
          }}>
            {feature.description}
          </span>
        </>
      );
      
      lines.push({
        type: 'info',
        content: descriptionContent,
        timestamp: timestamp + (index * 4) + 3
      });
    });
  }

  return lines;
}

/**
 * Formats agent stats for terminal display
 */
export function formatStatsOutput(agentData: CompleteAgentData | null): TerminalLine[] {
  const timestamp = Date.now();
  
  if (!agentData) {
    return [{
      type: 'error',
      content: 'No agent found. Please mint an agent first.',
      timestamp
    }];
  }

  const lines: TerminalLine[] = [];

  // Agent name
  const nameContent = (
    <>
      <span style={{ color: colors.secondary }}>Name: </span>
      <span style={{ 
        color: colors.accent, 
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {agentData.basic.agentName}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: nameContent,
    timestamp: timestamp + 1
  });

  // Token ID
  const tokenIdContent = (
    <>
      <span style={{ color: colors.secondary }}>Token ID: </span>
      <span style={{ 
        color: colors.primary, 
        fontWeight: '500'
      }}>
        #{agentData.tokenId}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: tokenIdContent,
    timestamp: timestamp + 2
  });

  // Empty line
  lines.push({
    type: 'info',
    content: '',
    timestamp: timestamp + 3
  });

  // Intelligence
  const intelligenceContent = (
    <>
      <span style={{ color: colors.secondary }}>Intelligence Level: </span>
      <span style={{ 
        color: colors.success, 
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {agentData.basic.intelligenceLevel}
      </span>
      <span style={{ color: colors.success, marginLeft: '4px' }}>★</span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: intelligenceContent,
    timestamp: timestamp + 4
  });

  // Dreams
  const nextEvolution = Math.ceil((agentData.basic.dreamCount + 1) / 5) * 5;
  const dreamsToEvolve = nextEvolution - agentData.basic.dreamCount;
  const dreamsContent = (
    <>
      <span style={{ color: colors.secondary }}>Dreams: </span>
      <span style={{ 
        color: colors.accent, 
        fontWeight: '600'
      }}>
        {agentData.basic.dreamCount}
      </span>
      <span style={{ color: colors.secondary, fontStyle: 'italic' }}>
        {' (next evolution: '}
        <span style={{ color: colors.primary }}>{dreamsToEvolve}</span>
        {')'}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: dreamsContent,
    timestamp: timestamp + 5
  });

  // Conversations
  const nextIntBoost = Math.ceil((agentData.basic.conversationCount + 1) / 10) * 10;
  const convosToBoost = nextIntBoost - agentData.basic.conversationCount;
  const conversationsContent = (
    <>
      <span style={{ color: colors.secondary }}>Conversations: </span>
      <span style={{ 
        color: colors.accent, 
        fontWeight: '600'
      }}>
        {agentData.basic.conversationCount}
      </span>
      <span style={{ color: colors.secondary, fontStyle: 'italic' }}>
        {' (next boost: '}
        <span style={{ color: colors.primary }}>{convosToBoost}</span>
        {')'}
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: conversationsContent,
    timestamp: timestamp + 6
  });

  // Evolution stats
  if (agentData.evolutionStats) {
    // Empty line before evolution stats
    lines.push({
      type: 'info',
      content: '',
      timestamp: timestamp + 7
    });

    const totalEvolutionsContent = (
      <>
        <span style={{ color: colors.secondary }}>Total Evolutions: </span>
        <span style={{ 
          color: colors.success, 
          fontWeight: '600'
        }}>
          {agentData.evolutionStats.totalEvolutions}
        </span>
      </>
    );
    
    lines.push({
      type: 'info',
      content: totalEvolutionsContent,
      timestamp: timestamp + 8
    });

    const evolutionRateContent = (
      <>
        <span style={{ color: colors.secondary }}>Evolution Rate: </span>
        <span style={{ 
          color: colors.accent, 
          fontWeight: '600'
        }}>
          {agentData.evolutionStats.evolutionRate}%
        </span>
        <span style={{ color: colors.secondary }}> per day</span>
      </>
    );
    
    lines.push({
      type: 'info',
      content: evolutionRateContent,
      timestamp: timestamp + 9
    });
  }

  // Milestones
  if (agentData.basic.achievedMilestones && agentData.basic.achievedMilestones.length > 0) {
    // Empty line before milestones
    lines.push({
      type: 'info',
      content: '',
      timestamp: timestamp + 10
    });

    const milestonesHeaderContent = (
      <>
        <span style={{ 
          color: colors.success, 
          fontWeight: '600'
        }}>
          Achieved Milestones:
        </span>
      </>
    );
    
    lines.push({
      type: 'info',
      content: milestonesHeaderContent,
      timestamp: timestamp + 11
    });

    agentData.basic.achievedMilestones.forEach((milestone, index) => {
      const milestoneContent = (
        <>
          <span style={{ 
            color: colors.success, 
            fontWeight: '600',
            marginRight: '6px'
          }}>
            ✓
          </span>
          <span style={{ 
            color: colors.primary, 
            fontWeight: '500'
          }}>
            {milestone}
          </span>
        </>
      );
      
      lines.push({
        type: 'info',
        content: milestoneContent,
        timestamp: timestamp + 12 + index
      });
    });
  }

  return lines;
}

/**
 * Formats memory data for terminal display with download functionality
 */
export function formatMemoryOutput(agentData: CompleteAgentData | null): TerminalLine[] {
  log.debug('formatMemoryOutput called', {
    hasData: !!agentData,
    memory: agentData?.memory
  });
  
  const timestamp = Date.now();
  
  if (!agentData) {
    return [{
      type: 'error',
      content: 'No agent found. Please mint an agent first.',
      timestamp
    }];
  }

  const lines: TerminalLine[] = [];
  
  // Header
  const headerContent = (
    <>
      <span style={{ 
        color: colors.accent, 
        fontWeight: '600',
        fontSize: '16px'
      }}>
        Agent Memory Storage
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: headerContent,
    timestamp: timestamp + 1
  });

  // Empty line
  lines.push({
    type: 'info',
    content: '',
    timestamp: timestamp + 2
  });

  // Helper function to format hash display
  const formatHash = (hash: string): string => {
    if (!hash || hash === '0x0' || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return 'empty';
    }
    // Show first 6 and last 4 characters
    return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
  };

  // Helper function to check if hash is non-zero
  const isNonZeroHash = (hash: string): boolean => {
    return hash && hash !== '0x0' && hash !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  };

  // Memory types mapping
  const memoryTypes = [
    {
      name: 'Daily Dreams',
      hash: agentData.memory.currentDreamDailyHash,
      type: 'daily_dreams'
    },
    {
      name: 'Daily Conversations',
      hash: agentData.memory.currentConvDailyHash,
      type: 'daily_chats'
    },
    {
      name: 'Monthly Dreams',
      hash: agentData.memory.lastDreamMonthlyHash,
      type: 'monthly_dreams'
    },
    {
      name: 'Monthly Conversations',
      hash: agentData.memory.lastConvMonthlyHash,
      type: 'monthly_chats'
    },
    {
      name: 'Memory Core (Soul)',
      hash: agentData.memory.memoryCoreHash,
      type: 'memory_core'
    }
  ];

  // Display each memory type
  memoryTypes.forEach((memory, index) => {
    const hasData = isNonZeroHash(memory.hash);
    const hashDisplay = formatHash(memory.hash);
    
    const memoryContent = (
      <>
        <span style={{ 
          color: colors.primary, 
          fontWeight: '500',
          minWidth: '200px',
          display: 'inline-block'
        }}>
          {memory.name}
        </span>
        <span style={{ 
          color: hasData ? colors.accent : colors.secondary,
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {hashDisplay}
        </span>
        {hasData && (
          <span
            style={{
              color: colors.accent,
              fontWeight: '600',
              marginLeft: '12px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            data-roothash={memory.hash}
            data-memorytype={memory.type}
            className="memory-download-trigger"
          >
            [Download]
          </span>
        )}
      </>
    );
    
    lines.push({
      type: 'info',
      content: memoryContent,
      timestamp: timestamp + 3 + index
    });
  });

  // Empty line
  lines.push({
    type: 'info',
    content: '',
    timestamp: timestamp + 9
  });

  // Instructions
  const instructionsContent = (
    <>
      <span style={{ 
        color: colors.secondary, 
        fontStyle: 'italic',
        fontSize: '13px'
      }}>
        Click [Download] to retrieve stored memory files from 0G Network
      </span>
    </>
  );
  
  lines.push({
    type: 'info',
    content: instructionsContent,
    timestamp: timestamp + 10
  });

  return lines;
}