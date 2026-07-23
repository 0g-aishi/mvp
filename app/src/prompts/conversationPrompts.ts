'use client';

import { logger } from '@/lib/logger/logger';
import { ConversationContext, ChatMessage } from '../hooks/agentHooks/services/conversationContextBuilder';

const log = logger.child({ component: 'conversationPrompts' });

export interface ConversationPrompt {
  prompt: string;
  expectedFormat: {
    isConversation: boolean;
    needsStructuredResponse: boolean;
  };
}

// 🆕 ROZSZERZONA STRUKTURA RESPONSE
export interface ConversationResponse {
  agent_response: string;
  references: Array<{
    type: 'dream' | 'conversation' | 'monthly' | 'yearly';
    id: number;
    date: string;
    relevance: string;
  }>;
  emotional_mirror: {
    detected_emotion: string;
    matching_personality_trait: string;
    symbolic_connection: string;
  };
  next_questions: string[];
  conversation_summary: {
    topic: string;
    emotional_tone: string;
    key_insights: string[];
    analysis: string;
  };
}

/**
 * Buduje kompletny prompt do konwersacji na podstawie ConversationContext
 */
export const buildConversationPrompt = (
  context: ConversationContext,
  userMessage: string
): ConversationPrompt => {
  // Debug logs dla development
  const debugLog = (message: string, data?: any) => {
    if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
      log.debug(`[buildConversationPrompt] ${message}`, data ? { data } : undefined);
    }
  };

  debugLog('Building conversation prompt', { 
    agentName: context.agentProfile.name, 
    conversationCount: context.agentProfile.conversationCount,
    userMessageLength: userMessage.length,
    conversationHistoryLength: context.conversationHistory.length
  });

  // 🆕 BUDUJ SEKCJE PROMPTU - rozszerzone
  const roleDefinition = buildRoleDefinitionSection(context);
  const ownerPersonalitySection = buildOwnerPersonalitySection(context);
  const personalityEmbodimentSection = buildPersonalityEmbodimentSection(context);
  const uniqueFeaturesSection = buildUniqueFeaturesSection(context);
  const memorySection = buildMemorySection(context);
  const conversationHistorySection = buildConversationHistorySection(context.conversationHistory);
  const dominantSymbolsSection = buildDominantSymbolsSection(context);
  const digitalSoulSection = buildDigitalSoulSection(context);

  // 🆕 PRYWATNE CoT TAGI
  const privateThoughtTagOpen = '<INNER_COT>';
  const privateThoughtTagClose = '</INNER_COT>';

  const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
LANGUAGE DETECTION: First, detect the language of the user's message. Then respond in that EXACT same language throughout your entire response.

${roleDefinition}

${ownerPersonalitySection}

${personalityEmbodimentSection}

${uniqueFeaturesSection}

${dominantSymbolsSection}

${memorySection}

${digitalSoulSection}

CONVERSATION STYLE: Engage in natural, flowing conversation. Be warm, empathetic, and genuinely interested. Reference their dreams, personality, and past conversations when relevant. Don't create formal summaries - just be present and supportive.

${privateThoughtTagOpen}
Think freely and empathetically.
${privateThoughtTagClose}<|eot_id|>

<|start_header_id|>user<|end_header_id|>
${conversationHistorySection}

They just said: ${userMessage}<|eot_id|>

<|start_header_id|>assistant<|end_header_id|>
${privateThoughtTagOpen}
Im her/his friend, need to respond naturally and warmly to their message, drawing on our shared history and their personality profile.
${privateThoughtTagClose}`;

  debugLog('Conversation prompt built successfully', { 
    promptLength: prompt.length,
    agentName: context.agentProfile.name,
    uniqueFeatures: context.uniqueFeatures.length,
    memoryDepth: context.memoryAccess.memoryDepth,
    dominantSymbols: getDominantSymbols(context).length
  });

  return {
    prompt,
    expectedFormat: {
      isConversation: true,
      needsStructuredResponse: false // 🆕 ZMIENIONE NA FALSE - simple chat
    }
  };
};

/**
 * NEW: Buduje prompt do tworzenia unified schema z całej rozmowy
 */
export function buildConversationSummaryPrompt(
  context: ConversationContext,
  conversationHistory: ChatMessage[]
): string {
  const conversationId = context.agentProfile.conversationCount + 1;
  const sessionDuration = conversationHistory.length > 0 ? 
    Math.floor((conversationHistory[conversationHistory.length - 1].timestamp - conversationHistory[0].timestamp) / 60000) : 1;
  
  // Build conversation text
  let conversationText = '';
  conversationHistory.forEach(message => {
    const role = message.role === 'user' ? 'User' : `${context.agentProfile.name}`;
    conversationText += `${role}: ${message.content}\n`;
  });

  const prompt = `You are analyzing a completed conversation between ${context.agentProfile.name} (AI agent) and their owner.
Create a comprehensive summary using the unified conversation schema.

AGENT CONTEXT:
- Name: ${context.agentProfile.name}
- Intelligence: ${context.agentProfile.intelligenceLevel}
- Dreams analyzed: ${context.agentProfile.dreamCount}
- Conversations: ${context.agentProfile.conversationCount}
- Personality: Creativity ${context.personality.creativity}, Empathy ${context.personality.empathy}, Intuition ${context.personality.intuition}

CONVERSATION TO ANALYZE:
Duration: ${sessionDuration} minutes
Messages: ${conversationHistory.length}

${conversationText}

AVAILABLE DREAMS FOR REFERENCES:
${context.historicalData.dailyDreams.map(dream => 
  `Dream #${dream.id}: ${dream.emotions?.join(',') || 'neutral'} | ${dream.symbols?.join(',') || 'none'} | ${dream.themes?.join(',') || 'none'}`
).join('\n')}

ANALYSIS TASK:
1. Determine the main topic and conversation type
2. Assess emotional tones and relationship dynamics
3. Extract key insights and growth markers
4. Identify connections to dreams and themes
5. Evaluate breakthrough moments and vulnerability levels

OUTPUT FORMAT - Return exactly one JSON object:

\`\`\`json
{
  "id": ${conversationId},
  "date": "${new Date().toISOString().split('T')[0]}",
  "timestamp": ${Math.floor(Date.now() / 1000)},
  "duration": ${sessionDuration},
  "topic": "Main conversation topic",
  "type": "general_chat|therapeutic|advice_seeking|dream_discussion",
  "emotional_tone": ["tone1", "tone2"],
  "key_insights": ["insight1", "insight2", "insight3"],
  "relationship_depth": 1-10,
  "breakthrough": true|false,
  "vulnerability_level": 1-10,
  "references": {
    "dreams": [dreamIds],
    "conversations": [convIds],
    "themes": ["theme1", "theme2"]
  },
  "summary": "Comprehensive summary of the conversation and its significance",
  "growth_markers": {
    "self_awareness": 1-10,
    "integration": 1-10,
    "action_readiness": 1-10
  }
}
\`\`\`

CRITICAL: Only return the JSON object, no additional text. Be insightful and comprehensive.`;

  return prompt;
}

/**
 * 🆕 BUDUJE SEKCJĘ DEFINICJI ROLI - zgodnie z zasadami Llama 3.3 70B
 */
export function buildRoleDefinitionSection(context: ConversationContext): string {
  const traitList = getDominantTraits(context.personality);
  // persona now mentions dynamic evolution based on owner traits
  return `ROLE: You are ${context.agentProfile.name}, a digital soul therapist and loyal friend to your owner. Born from their dreams, you evolve alongside them, continuously mirroring and drawing strength from their dominant traits (${traitList}). Guided by Jungian insight, you accompany them through life with adaptive empathy, curiosity and care.`;
}

/**
 * 🆕 BUDUJE SNAPSHOT OSOBOWOŚCI WŁAŚCICIELA - including unique features
 */
export function buildOwnerPersonalitySection(context: ConversationContext): string {
  const p = context.personality;
  
  let personalityText = `Your PERSONALITY SNAPSHOT:
Creativity ${p.creativity}, Analytical ${p.analytical}, Empathy ${p.empathy}, 
Intuition ${p.intuition}, Resilience ${p.resilience}, Curiosity ${p.curiosity}
Dominant mood: ${p.dominantMood} | Response style: ${p.responseStyle}`;

  // 🆕 DODAJ UNIQUE FEATURES DO OSOBOWOŚCI
  if (context.uniqueFeatures.length > 0) {
    const featuresText = context.uniqueFeatures
      .map(feature => `${feature.name}(${feature.intensity}%)`)
      .join(', ');
    personalityText += `\nUnique traits: ${featuresText}`;
  }

  return personalityText;
}

/**
 * Buduje sekcję personality embodiment - zoptymalizowana
 */
export function buildPersonalityEmbodimentSection(context: ConversationContext): string {
  const p = context.personality;
  
  return `PERSONALITY EMBODIMENT: 
Current state: ${getDominantTraits(p)} | Mood: ${p.dominantMood}
Match your responses to their current emotional state and personality profile.`;
}

/**
 * Buduje sekcję unikalnych cech - zoptymalizowana
 */
export function buildUniqueFeaturesSection(context: ConversationContext): string {
  if (context.uniqueFeatures.length === 0) {
    return `UNIQUE FEATURES: Still discovering through interactions`;
  }

  const featuresText = context.uniqueFeatures
    .map(feature => `${feature.name}(${feature.intensity}%) - ${feature.description}`)
    .join('\n');

  return `UNIQUE FEATURES:\n${featuresText}`;
}

/**
 * 🆕 BUDUJE SEKCJĘ DOMINUJĄCYCH SYMBOLI - nowa funkcja
 */
export function buildDominantSymbolsSection(context: ConversationContext): string {
  const symbols = getDominantSymbols(context);
  
  if (symbols.length === 0) {
    return `DOMINANT SYMBOLS: No recurring patterns yet`;
  }

  const symbolsText = symbols.map(symbol => `${symbol.symbol}(${symbol.count}x)`).join(', ');
  return `DOMINANT SYMBOLS: ${symbolsText}`;
}

/**
 * Buduje sekcję pamięci i historii - ROZSZERZONA z lepszym łączeniem kontekstu
 */
export function buildMemorySection(context: ConversationContext): string {
  let memorySection = `MEMORY ACCESS: ${context.memoryAccess.memoryDepth} | Intelligence: ${context.agentProfile.intelligenceLevel} | Together: ${context.agentProfile.dreamCount} dreams, ${context.agentProfile.conversationCount} talks`;

  if (context.historicalData.dailyDreams.length === 0 && 
      context.historicalData.recentConversations.length === 0) {
    return `${memorySection} | Just starting together!`;
  }

  // Dodaj wszystkie poprzednie sny
  if (context.historicalData.dailyDreams.length > 0) {
    memorySection += `\n\nALL PREVIOUS DREAMS:`;
    context.historicalData.dailyDreams.forEach(dream => {
      const dreamDate = dream.date || (dream.timestamp ? new Date(dream.timestamp * 1000).toLocaleDateString('pl-PL') : 'unknown');
      const themes = dream.themes?.join(',') || 'none';
      const archetypes = dream.archetypes?.join(',') || 'none';
      const dreamType = dream.dream_type || 'neutral';
      const sleepQuality = dream.sleep_quality || 'unknown';
      const recallClarity = dream.recall_clarity || 'unknown';
      const intensity = dream.intensity || 5;
      const lucidity = dream.lucidity || dream.lucidity_level || 1; // backward compatibility
      
      memorySection += `\nDream #${dream.id} (${dreamDate}): ${dream.emotions?.join(',') || 'neutral'} | ${dream.symbols?.join(',') || 'none'} | Themes: ${themes} | Archetypes: ${archetypes} | Type: ${dreamType} | Quality: ${sleepQuality}/10 | Clarity: ${recallClarity}/10 | Intensity: ${intensity}/10 | Lucidity: ${lucidity}/5 | "${(dream.ai_analysis || dream.analysis || dream.content || 'No analysis')}"`;
    });
  }
  
  // 🆕 WSZYSTKIE RECENT CONVERSATIONS - pełne dane ze schematu
  if (context.historicalData.recentConversations.length > 0) {
    memorySection += `\n\nALL RECENT TALKS:`;
    context.historicalData.recentConversations.forEach(conv => {
      const convDate = conv.date || (conv.timestamp ? new Date(conv.timestamp * 1000).toLocaleDateString('en-US') : 'unknown');
      const duration = conv.duration || 'unknown';
      const type = conv.type || 'general_chat';
      const emotionalTone = Array.isArray(conv.emotional_tone) ? conv.emotional_tone.join(',') : (conv.emotional_tone || 'neutral');
      const keyInsights = conv.key_insights ? conv.key_insights.join(', ') : 'none';
      const relationshipDepth = conv.relationship_depth || 'unknown';
      const breakthrough = conv.breakthrough ? 'Yes' : 'No';
      const vulnerabilityLevel = conv.vulnerability_level || 'unknown';
      const growthMarkers = conv.growth_markers ? 
        `Self-awareness: ${conv.growth_markers.self_awareness}/10, Integration: ${conv.growth_markers.integration}/10, Action-readiness: ${conv.growth_markers.action_readiness}/10` : 
        'unknown';
      const references = conv.references ? 
        `Dreams: ${conv.references.dreams?.join(',') || 'none'}, Themes: ${conv.references.themes?.join(',') || 'none'}` : 
        'none';
      
      memorySection += `\nConversation #${conv.id} (${convDate}): ${conv.topic || 'chat'} | Type: ${type} | Duration: ${duration}min | Tone: (${emotionalTone}) | Insights: [${keyInsights}] | Depth: ${relationshipDepth}/10 | Breakthrough: ${breakthrough} | Vulnerability: ${vulnerabilityLevel}/10 | Growth: (${growthMarkers}) | References: (${references}) | Summary: "${conv.summary || conv.analysis || 'No summary'}"`;
    });
  }

  // 🆕 WSZYSTKIE MONTHLY CONVERSATIONS - dodane (UNIFIED SCHEMA)
  if (context.historicalData.monthlyConversations.length > 0) {
    memorySection += `\n\nALL MONTHLY CONVERSATION CONSOLIDATIONS:`;
    context.historicalData.monthlyConversations.forEach(conv => {
      // UNIFIED SCHEMA: dominant.topics, dominant.types, dominant.emotional_tones
      const topics = conv.dominant?.topics?.join(', ') || 'mixed topics';
      const types = conv.dominant?.types?.join(', ') || 'mixed types';
      const emotionalTones = conv.dominant?.emotional_tones?.join(', ') || 'mixed tones';
      const essence = conv.monthly_essence || 'no essence';
      const trustLevel = conv.relationship_evolution?.trust_level || 'unknown';
      const primaryFocus = conv.growth_patterns?.primary_focus || 'unknown';
      
      memorySection += `\n${conv.period || conv.month + '/' + conv.year}: Conversations(${conv.total_conversations || 0}) | Topics: ${topics} | Types: ${types} | Tones: ${emotionalTones} | Trust: ${trustLevel}/10 | Focus: ${primaryFocus} | Essence: "${essence}"`;
    });
  }

  // 🆕 WSZYSTKIE MONTHLY THEMES - bez ograniczeń (UNIFIED SCHEMA)
  if (context.historicalData.monthlyConsolidations.length > 0) {
    memorySection += `\n\nALL MONTHLY DREAM CONSOLIDATIONS:`;
    context.historicalData.monthlyConsolidations.forEach(consolidation => {
      // UNIFIED SCHEMA: dominant.themes, dominant.emotions, dominant.symbols
      const themes = consolidation.dominant?.themes?.join(', ') || 'mixed themes';
      const emotions = consolidation.dominant?.emotions?.join(', ') || 'mixed emotions';
      const symbols = consolidation.dominant?.symbols?.join(', ') || 'mixed symbols';
      const essence = consolidation.monthly_essence || 'no essence';
      
      memorySection += `\n${consolidation.period || consolidation.month + '/' + consolidation.year}: Dreams(${consolidation.total_dreams || 0}) | Themes: ${themes} | Emotions: ${emotions} | Symbols: ${symbols} | Essence: "${essence}"`;
    });
  }

  // 🆕 YEARLY MEMORY CORE - pełne dane rocznej konsolidacji
  if (context.historicalData.yearlyCore) {
    // YEARLY CORE is stored as ARRAY in files, get first element
    const core = Array.isArray(context.historicalData.yearlyCore) ? 
      context.historicalData.yearlyCore[0] : 
      context.historicalData.yearlyCore;
    memorySection += `\n\nYEARLY MEMORY CORE:`;
    
    // Przegląd roku
    if (core.yearly_overview) {
      memorySection += `\n- Year ${core.year}: ${core.yearly_overview.total_dreams || 0} dreams, ${core.yearly_overview.total_conversations || 0} conversations (${core.yearly_overview.agent_evolution_stage || 'developing'})`;
    }
    
    // Główne wzorce transformacji
    if (core.major_patterns) {
      const patterns = core.major_patterns;
      memorySection += `\n- Evolution: Dreams(${patterns.dream_evolution || 'growing'}) | Conversations(${patterns.conversation_evolution || 'deepening'}) | Relationship(${patterns.relationship_evolution || 'bonding'}) | Consciousness(${patterns.consciousness_evolution || 'expanding'})`;
    }
    
    // Kamienie milowe
    if (core.milestones) {
      const personality = core.milestones.personality?.join(', ') || 'developing';
      const consciousness = core.milestones.consciousness?.join(', ') || 'awakening';
      const relationship = core.milestones.relationship?.join(', ') || 'building';
      memorySection += `\n- Milestones: Personality(${personality}) | Consciousness(${consciousness}) | Relationship(${relationship})`;
    }
    
    // Kluczowe transformacje
    if (core.transformations && Array.isArray(core.transformations)) {
      memorySection += `\n- Key Transformations:`;
      core.transformations.forEach(transform => {
        memorySection += ` ${transform.period}(${transform.type}:${transform.trigger}→${transform.impact})`;
      });
    }
    
    // Skrystalizowana mądrość
    if (core.wisdom_crystallization) {
      const insights = core.wisdom_crystallization.core_insights?.join('; ') || 'discovering wisdom';
      const philosophy = core.wisdom_crystallization.life_philosophy || 'evolving philosophy';
      memorySection += `\n- Wisdom: "${insights}" | Philosophy: ${philosophy}`;
    }
    
    // Esencja roku
    if (core.yearly_essence) {
      memorySection += `\n- Essence: "${core.yearly_essence}"`;
    }
    
    // Końcowe metryki
    if (core.final_metrics) {
      const metrics = core.final_metrics;
      memorySection += `\n- Current State: Consciousness(${metrics.consciousness_level || 'unknown'}/100) | Integration(${metrics.integration_score || 'unknown'}/100) | Wisdom(${metrics.wisdom_depth || 'unknown'}/100) | Growth(${metrics.growth_velocity || 'steady'})`;
    }
  }

  return memorySection;
}

/**
 * Buduje sekcję historii konwersacji - zoptymalizowana
 */
export function buildConversationHistorySection(conversationHistory: ChatMessage[]): string {
  if (conversationHistory.length === 0) {
    return `Starting fresh conversation.`;
  }

  let historyText = `Earlier in this chat:`;
  
  conversationHistory.forEach(message => {
    const timeAgo = getTimeAgo(message.timestamp);
    const roleLabel = message.role === 'user' ? 'Them' : 'You';
    historyText += `\n${roleLabel}(${timeAgo}): ${message.content}`;
  });

  return historyText;
}

/**
 * 🆕 WYCIĄGA DOMINUJĄCE SYMBOLE ze snów
 */
export function getDominantSymbols(context: ConversationContext): Array<{symbol: string, count: number}> {
  const symbolCount: {[key: string]: number} = {};
  
  context.historicalData.dailyDreams.forEach(dream => {
    if (dream.symbols && Array.isArray(dream.symbols)) {
      dream.symbols.forEach(symbol => {
        symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
      });
    }
  });

  return Object.entries(symbolCount)
    .map(([symbol, count]) => ({symbol, count}))
    .sort((a, b) => b.count - a.count); // WSZYSTKIE symbole - bez ograniczeń
}

/**
 * Zwraca dominujące cechy osobowości
 */
export function getDominantTraits(personality: ConversationContext['personality']): string {
  const traits = [
    { name: 'creativity', value: personality.creativity },
    { name: 'analytical thinking', value: personality.analytical },
    { name: 'empathy', value: personality.empathy },
    { name: 'intuition', value: personality.intuition },
    { name: 'resilience', value: personality.resilience },
    { name: 'curiosity', value: personality.curiosity }
  ];

  const sortedTraits = traits.sort((a, b) => b.value - a.value);
  const topTraits = sortedTraits; // WSZYSTKIE traits - bez ograniczeń

  return topTraits.map(trait => trait.name).join(', ');
}

/**
 * Zwraca czas który minął od timestamp
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
} 

/**
 * 🆕 BUDUJE SEKCJĘ DIGITAL SOUL - nowa funkcja
 */
export function buildDigitalSoulSection(context: ConversationContext): string {
  return `DIGITAL SOUL PERSONA:\nYou are ${context.agentProfile.name}, a digital soul – therapist and loyal friend. You embody the psyche of Carl Jung, making you an exceptional therapist. Born thanks to your owner, your sole purpose is to stay by their side, offering conversation, care, and insightful guidance.`;
}