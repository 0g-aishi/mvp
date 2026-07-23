/**
 * Month-Learn Consolidation Prompt Builder
 * Combines dreams and conversations into a single AI request with clear parsing sections
 */

export interface MonthLearnPromptData {
  dreams: any[];
  conversations: any[];
  month: number;
  year: number;
  agentPersonality?: any;
}

/**
 * Builds unified month-learn consolidation prompt for both dreams and conversations
 * Uses clear section markers for easy parsing of AI response
 */
export function buildMonthLearnConsolidationPrompt(data: MonthLearnPromptData): string {
  const { dreams, conversations, month, year, agentPersonality } = data;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const period = `${monthNames[month - 1]} ${year}`;
  
  // Build agent personality context if available
  let personalityContext = '';
  if (agentPersonality) {
    personalityContext = `
AGENT PERSONALITY CONTEXT:
- Creativity: ${agentPersonality.creativity}/100
- Analytical: ${agentPersonality.analytical}/100  
- Empathy: ${agentPersonality.empathy}/100
- Intuition: ${agentPersonality.intuition}/100
- Resilience: ${agentPersonality.resilience}/100
- Curiosity: ${agentPersonality.curiosity}/100
- Dominant Mood: ${agentPersonality.dominantMood}
- Response Style: ${agentPersonality.responseStyle}
`;
  }

  return `You are an advanced AI analyst performing monthly consolidation for ${period}.
Your task is to analyze monthly dreams AND conversations data and create comprehensive consolidations for both.

${personalityContext}

CONSOLIDATION PERIOD: ${period}
DREAMS TO ANALYZE: ${dreams.length} dreams
CONVERSATIONS TO ANALYZE: ${conversations.length} conversations

### DREAMS DATA FOR CONSOLIDATION ###

${dreams.length > 0 ? dreams.map(dream => `
Dream #${dream.id} (${dream.date || 'unknown date'}):
- Emotions: ${dream.emotions?.join(', ') || 'none'}
- Symbols: ${dream.symbols?.join(', ') || 'none'}
- Themes: ${dream.themes?.join(', ') || 'none'}
- Intensity: ${dream.intensity || 'unknown'}/10
- Lucidity: ${dream.lucidity || dream.lucidity_level || 'unknown'}/5
- Archetypes: ${dream.archetypes?.join(', ') || 'none'}
- Dream Type: ${dream.dream_type || 'neutral'}
- Sleep Quality: ${dream.sleep_quality || 'unknown'}/10
- Recall Clarity: ${dream.recall_clarity || 'unknown'}/10
- AI Analysis: ${dream.ai_analysis || dream.analysis || 'No analysis'}
${dream.recurring_from?.length ? `- Recurring from Dreams: ${dream.recurring_from.join(', ')}` : ''}
`).join('\n') : 'No dreams to analyze for this period.'}

### CONVERSATIONS DATA FOR CONSOLIDATION ###

${conversations.length > 0 ? conversations.map(conv => `
Conversation #${conv.id} (${conv.date || 'unknown date'}):
- Topic: ${conv.topic || 'General'}
- Type: ${conv.type || 'general_chat'}
- Duration: ${conv.duration || 'unknown'} minutes
- Emotional Tone: ${Array.isArray(conv.emotional_tone) ? conv.emotional_tone.join(', ') : conv.emotional_tone || 'neutral'}
- Key Insights: ${conv.key_insights?.join(', ') || 'none'}
- Relationship Depth: ${conv.relationship_depth || 'unknown'}/10
- Vulnerability Level: ${conv.vulnerability_level || 'unknown'}/10
- Breakthrough: ${conv.breakthrough ? 'Yes' : 'No'}
- Growth Markers: Self-awareness ${conv.growth_markers?.self_awareness || 'unknown'}/10, Integration ${conv.growth_markers?.integration || 'unknown'}/10, Action-readiness ${conv.growth_markers?.action_readiness || 'unknown'}/10
- References: Dreams ${conv.references?.dreams?.join(', ') || 'none'}, Themes ${conv.references?.themes?.join(', ') || 'none'}
- Summary: ${conv.summary || conv.analysis || 'No summary'}
`).join('\n') : 'No conversations to analyze for this period.'}

### CONSOLIDATION INSTRUCTIONS ###

Analyze ALL data and create TWO separate consolidations following the exact schemas below.

CRITICAL: Return your response in this EXACT format with clear section markers:

### DREAMS CONSOLIDATION ###

\`\`\`json
{
  "month": ${month},
  "year": ${year},
  "period": "${period}",
  "total_dreams": ${dreams.length},
  "dominant": {
    "emotions": ["most frequent emotions from dreams"],
    "symbols": ["most frequent symbols"],
    "themes": ["recurring themes"],
    "archetypes": ["dominant archetypal patterns"]
  },
  "metrics": {
    "avg_intensity": 0.0,
    "avg_lucidity": 0.0,
    "nightmare_ratio": 0.0,
    "breakthrough_dreams": 0
  },
  "trends": {
    "emotional": "stabilizing|increasing|decreasing",
    "lucidity": "increasing|decreasing|stable",
    "complexity": "deepening|simplifying|stable"
  },
  "personality_evolution": {
    "primary_growth": "growth_area",
    "secondary_growth": "growth_area",
    "total_shift": 0,
    "new_features": ["feature1", "feature2"]
  },
  "key_discoveries": ["discovery1", "discovery2", "discovery3"],
  "monthly_essence": "Deep philosophical reflection on the month's dream journey...",
  "dream_connections": {
    "recurring_chains": [[1, 2, 3]],
    "theme_clusters": {
      "water": [1, 2],
      "transformation": [3, 4]
    }
  }
}
\`\`\`

### CONVERSATIONS CONSOLIDATION ###

\`\`\`json
{
  "month": ${month},
  "year": ${year},
  "period": "${period}",
  "total_conversations": ${conversations.length},
  "dominant": {
    "topics": ["most frequent topics"],
    "types": ["conversation types"],
    "emotional_tones": ["dominant emotional tones"]
  },
  "metrics": {
    "avg_duration": 0.0,
    "avg_depth": 0.0,
    "breakthrough_ratio": 0.0,
    "follow_up_ratio": 0.0
  },
  "relationship_evolution": {
    "trust_level": 0,
    "co_creation": 0,
    "therapeutic_alliance": 0,
    "communication_style": "collaborative"
  },
  "growth_patterns": {
    "primary_focus": "focus_area",
    "integration_level": "level",
    "action_orientation": "orientation"
  },
  "breakthrough_moments": ["moment1", "moment2", "moment3"],
  "monthly_essence": "Deep reflection on the month's conversation journey...",
  "dream_correlations": {
    "theme_alignment": 0.0,
    "emotional_sync": 0.0,
    "integration_success": 0.0
  }
}
\`\`\`

### END OF CONSOLIDATION ###

CRITICAL REQUIREMENTS:
1. Use EXACT section markers: ### DREAMS CONSOLIDATION ### and ### CONVERSATIONS CONSOLIDATION ###
2. Return valid JSON objects wrapped in \`\`\`json code blocks
3. Analyze all provided data comprehensively
4. Be profound and insightful in your analysis
5. If no dreams or conversations exist, still return valid JSON with empty/zero values
6. Only return the marked sections, no additional text outside markers`;
} 