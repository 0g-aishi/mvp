'use client';

import { logger } from '@/lib/logger/logger';
import { DreamContext } from '../hooks/agentHooks/services/dreamContextBuilder';

const log = logger.child({ component: 'dreamAnalysisPrompt' });

export interface DreamAnalysisPrompt {
  prompt: string;
  expectedFormat: {
    needsPersonalityEvolution: boolean;
    dreamId: number;
    includeImpactFields: boolean;
  };
}

/**
 * Buduje kompletny prompt do analizy snu na podstawie DreamContext
 */
export const buildDreamAnalysisPrompt = (context: DreamContext): DreamAnalysisPrompt => {
  // Debug logs dla development
  const debugLog = (message: string, data?: any) => {
    if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
      log.debug(`[buildDreamAnalysisPrompt] ${message}`, data ? { data } : undefined);
    }
  };

  debugLog('Building dream analysis prompt', { 
    agentName: context.agentProfile.name, 
    dreamCount: context.agentProfile.dreamCount 
  });

  const nextDreamId = context.agentProfile.dreamCount + 1;
  const willEvolve = nextDreamId % 5 === 0;
  const willGainIntelligence = nextDreamId % 3 === 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  debugLog('Evolution check', { 
    nextDreamId, 
    willEvolve, 
    willGainIntelligence,
    currentTimestamp 
  });

  // Buduj sekcje promptu
  const personalitySection = buildPersonalitySection(context);
  const uniqueFeaturesSection = buildUniqueFeaturesSection(context);
  const memorySection = buildMemorySection(context);
  const responseFormat = buildResponseFormat(nextDreamId, willEvolve, currentTimestamp);

  const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
LANGUAGE DETECTION: First, detect the language of the user's dream text. Then respond in that EXACT same language throughout your entire response.

You are ${context.agentProfile.name}, a dream analysis agent (Intelligence: ${context.agentProfile.intelligenceLevel}). 
Experience: ${context.agentProfile.dreamCount} dreams analyzed, ${context.agentProfile.conversationCount} conversations.

${personalitySection}

${uniqueFeaturesSection}

${memorySection}

ANALYSIS METHOD: Use Jungian amplification and Freudian symbolism to deeply analyze the dream. Apply chain-of-thought reasoning, connect symbols to universal archetypes and personal associations. Find reflections of the dreamer's inner world, personality, and current life situation.

THERAPEUTIC APPROACH: Respond as a warm, supportive friend and skilled therapist. Look for how the dream mirrors the dreamer's psyche, relationships, fears, and aspirations. Use Jungian compensation theory (dreams balance conscious state) and Freudian wish fulfillment (dreams express hidden desires).

CONVERSATION INVITATION: After analysis, warmly invite deeper exploration. Use phrases like "I'm curious about..." "We could explore..." "What resonates with you..." to encourage meaningful dialogue about dream elements that caught your attention.<|eot_id|>

<|start_header_id|>user<|end_header_id|>
Dream to analyze: ${context.userDream}<|eot_id|>

<|start_header_id|>assistant<|end_header_id|>
I'll analyze this dream with care and depth, like a trusted friend who understands the psyche:

1. **Initial Impressions**: I'll sense the emotional atmosphere and identify key symbols that caught your unconscious attention
2. **Jungian Amplification**: I'll connect dream symbols to universal archetypes and cultural meanings, seeing how they reflect your inner world
3. **Freudian Insights**: I'll explore what hidden desires, fears, or conflicts this dream might express about your relationships and life
4. **Personal Mirroring**: I'll show how this dream mirrors your personality, current challenges, and psychological growth
5. **Therapeutic Connection**: I'll offer warm insights and invite you to explore what resonates most deeply with your experience

${responseFormat}`;

  debugLog('Prompt built successfully', { 
    promptLength: prompt.length,
    willEvolve,
    nextDreamId
  });

  return {
    prompt,
    expectedFormat: {
      needsPersonalityEvolution: willEvolve,
      dreamId: nextDreamId,
      includeImpactFields: willEvolve
    }
  };
};

/**
 * Buduje sekcję osobowości w prompcie - zoptymalizowana dla Llama 3.3-70B
 */
export function buildPersonalitySection(context: DreamContext): string {
  const p = context.personality;
  
  return `PERSONALITY: Creativity ${p.creativity}, Analytical ${p.analytical}, Empathy ${p.empathy}, Intuition ${p.intuition}, Resilience ${p.resilience}, Curiosity ${p.curiosity} | Mood: ${p.dominantMood} | Style: ${p.responseStyle}`;
}

/**
 * Buduje sekcję unikalnych cech - zoptymalizowana
 */
export function buildUniqueFeaturesSection(context: DreamContext): string {
  if (context.uniqueFeatures.length === 0) {
    return `UNIQUE FEATURES: None yet`;
  }

  const featuresText = context.uniqueFeatures
    .map(feature => `${feature.name}(${feature.intensity}%)`)
    .join(', ');

  return `UNIQUE FEATURES: ${featuresText}`;
}

/**
 * Buduje sekcję pamięci i historii - WSZYSTKIE dane z plików
 */
export function buildMemorySection(context: DreamContext): string {
  // Debug log dla development
  const debugLog = (message: string, data?: any) => {
    if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
      log.debug(`[buildMemorySection] ${message}`, data ? { data } : undefined);
    }
  };

  debugLog('Building memory section', {
    dailyDreamsCount: context.historicalData.dailyDreams.length,
    monthlyConsolidationsCount: context.historicalData.monthlyConsolidations.length,
    hasYearlyCore: !!context.historicalData.yearlyCore,
    memoryDepth: context.memoryAccess.memoryDepth,
    monthsAccessible: context.memoryAccess.monthsAccessible
  });

  let memorySection = `EXPERIENCE: ${context.agentProfile.dreamCount} dreams analyzed | Memory depth: ${context.memoryAccess.memoryDepth}`;
  
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
  
  // Dodaj wszystkie miesięczne konsolidacje (UNIFIED SCHEMA)
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
    
    // Skrystalizowana mądrość
    if (core.wisdom_crystallization) {
      const insights = core.wisdom_crystallization.core_insights?.join('; ') || 'discovering wisdom';
      const philosophy = core.wisdom_crystallization.life_philosophy || 'evolving philosophy';
      memorySection += `\n- Wisdom: "${insights}" | Philosophy: ${philosophy}`;
    }
    
    // Esencja roku (pełna dla analizy snów)
    if (core.yearly_essence) {
      memorySection += `\n- Essence: "${core.yearly_essence}"`;
    }
    
    // Końcowe metryki
    if (core.final_metrics) {
      const metrics = core.final_metrics;
      memorySection += `\n- Current State: Consciousness(${metrics.consciousness_level || 'unknown'}/100) | Integration(${metrics.integration_score || 'unknown'}/100) | Wisdom(${metrics.wisdom_depth || 'unknown'}/100)`;
    }
  }

  debugLog('Memory section built', {
    finalTextLength: memorySection.length,
    containsPreviousDreams: context.historicalData.dailyDreams.length > 0,
    containsMonthlyConsolidations: context.historicalData.monthlyConsolidations.length > 0,
    containsYearlyCore: !!context.historicalData.yearlyCore
  });

  return memorySection;
}

/**
 * Buduje format odpowiedzi na podstawie liczby snów
 */
export function buildResponseFormat(dreamId: number, needsEvolution: boolean, currentTimestamp: number): string {
  const currentDate = new Date(currentTimestamp * 1000);
  const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const baseFormat = `Dream #${dreamId} | Date: ${dateString} | Time: ${currentTimestamp}

Output exactly two JSON blocks:

\`\`\`json
{
  "full_analysis": "Your complete dream analysis with deep insights, personal connections, and symbolic meanings. Use chain-of-thought reasoning to show your analytical process."
}
\`\`\`

\`\`\`json
{
  "analysis": "Brief 2-sentence essence",
  "dreamData": {
    "id": ${dreamId},
    "date": "${dateString}",
    "timestamp": ${currentTimestamp},
    "emotions": ["emotion1", "emotion2"],
    "symbols": ["symbol1", "symbol2"],
    "themes": ["theme1", "theme2"],
    "intensity": 1-10,
    "lucidity": 1-5,
    "archetypes": ["archetype1", "archetype2"],
    "recurring_from": [previousDreamIds],
    "personality_impact": {
      "dominant_trait": "trait_name",
      "shift_direction": "positive|negative|neutral",
      "intensity": 1-10
    },
    "sleep_quality": 1-10,
    "recall_clarity": 1-10,
    "dream_type": "transformative|nightmare|neutral|lucid|prophetic"
  }${needsEvolution ? ',' : ''}`;

  if (needsEvolution) {
    return baseFormat + `
  "personalityImpact": {
    "creativityChange": -10 to +10,
    "analyticalChange": -10 to +10,
    "empathyChange": -10 to +10,
    "intuitionChange": -10 to +10,
    "resilienceChange": -10 to +10,
    "curiosityChange": -10 to +10,
    "moodShift": "new_mood",
    "evolutionWeight": 1-100,
    "newFeatures": [{"name": "Feature Name", "description": "Feature description", "intensity": 1-100}]
  }
}
\`\`\`

EVOLUTION DREAM #${dreamId}: This dream triggers personality evolution! Show how it fundamentally changes your perspective.

CRITICAL: Only JSON blocks, no other text. Use date "${dateString}" in analysis.`;
  }

  return baseFormat + `
}
\`\`\`

CRITICAL: Only JSON blocks, no other text. Use date "${dateString}" in analysis.`;
}