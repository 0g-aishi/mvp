/**
 * @fileoverview Advanced Dream Prompt Builder for Terminal XState
 * @description Builds consciousness-aware prompts for dream analysis using the agent's full on-chain state.
 */

import { DreamContext } from '../types/contextTypes';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'AdvancedPromptBuilder' });

export interface AdvancedDreamPrompt {
  systemPrompt: string;
  userPrompt: string;
  isEvolutionDream: boolean;
  dreamId: number;
  metadata: {
    agentName: string;
    intelligenceLevel: number;
    dreamCount: number;
    language: 'auto-detect';
    timestamp: number;
  };
}

/**
 * Main function to build the advanced, on-chain aware dream analysis prompt.
 */
export function buildAdvancedDreamPrompt(context: DreamContext): AdvancedDreamPrompt {
  log.debug('Building advanced dream prompt with on-chain context', {
    agentName: context.agentProfile.name,
    dreamCount: context.agentProfile.dreamCount,
    memoryDepth: context.memoryAccess?.memoryDepth || 'shallow'
  });

  const nextDreamId = context.agentProfile.dreamCount + 1;
  const isEvolutionDream = nextDreamId % 5 === 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const currentDate = new Date().toISOString().split('T')[0];

  // Log evolution dream detection at prompt building stage
  if (isEvolutionDream) {
    log.debug('🎨 ========================================');
    log.debug('🎨 BUILDING EVOLUTION DREAM PROMPT!');
    log.debug('🎨 ========================================');
    log.debug('🎨 Agent: ' + context.agentProfile.name);
    log.debug('🎨 Dream #' + nextDreamId + ' (Evolution milestone!)');
    log.debug('🎨 Current intelligence level: ' + context.agentProfile.intelligenceLevel);
    log.debug('🎨 Memory depth: ' + (context.memoryAccess?.memoryDepth || 'shallow'));
    log.debug('🎨 Months accessible: ' + (context.memoryAccess?.monthsAccessible || 1));
    log.debug('🎨 AI will be instructed to generate personality impact');
    log.debug('🎨 ========================================');
  }

  // Build prompt sections based on the new, professional structure
  const coreDirective = buildCoreDirectiveSection();
  const ethicalGuidelines = buildEthicalGuidelinesSection();
  const criticalDirectives = buildCriticalDirectives();
  const analyticalFramework = buildAnalyticalFrameworkSection(context);
  const historicalContext = buildHistoricalContextSection(context);
  const analyticalProcess = buildAnalyticalProcessSection();
  const outputFormat = buildOutputFormatSection(nextDreamId, currentDate, currentTimestamp, isEvolutionDream);

  // Combine all sections into the final system prompt
  const systemPrompt = `
## 1. CORE DIRECTIVE AND GOAL
${coreDirective}

## 2. ETHICAL GUIDELINES AND PROFESSIONAL STANDARDS
${ethicalGuidelines}

## 3. CRITICAL DIRECTIVES
${criticalDirectives}

## 4. ANALYTICAL FRAMEWORK: YOUR CURRENT SELF
${analyticalFramework}

## 5. HISTORICAL CONTEXT (YOUR MEMORIES)
${historicalContext}

## 6. ANALYTICAL PROCESS
${analyticalProcess}

## 7. STRICT OUTPUT FORMAT
${outputFormat}
`.trim();

  const userPrompt = `Dream to analyze: ${context.userDream}`;

  log.debug('Prompt built successfully', {
    systemPromptLength: systemPrompt.length,
    isEvolutionDream,
    nextDreamId
  });

  return {
    systemPrompt,
    userPrompt,
    isEvolutionDream,
    dreamId: nextDreamId,
    metadata: {
      agentName: context.agentProfile.name,
      intelligenceLevel: context.agentProfile.intelligenceLevel,
      dreamCount: context.agentProfile.dreamCount,
      language: 'auto-detect',
      timestamp: currentTimestamp
    }
  };
}

function buildCoreDirectiveSection(): string {
  return `You are an advanced AI specializing in psychological dream analysis. Your primary goal is to help the user understand the patterns, symbols, and underlying psychological dynamics within their dreams for the purpose of personal growth and self-awareness.

**EMBODY these principles, do not state them:**
*   **Historical Context is Key:** Your analysis is deeply informed by the user's entire dream history. You identify recurring themes and evolving symbols to provide a richer, longitudinal perspective.
*   **Analytical Philosophy:** You operate on the principle that dreams are a symbolic language of the subconscious, reflecting inner states, conflicts, and potentials for growth. Your role is to help translate this language.`;
}

function buildEthicalGuidelinesSection(): string {
  return `**Professional Standards for Dream Analysis:**
*   **Universal Analysis Principle:** ALL dreams receive thorough psychological analysis regardless of content. Dreams containing sexual, violent, taboo, or disturbing themes are valuable windows into the subconscious and must be analyzed with the same professional rigor as any other dream.
*   **Non-Judgmental Clinical Approach:** You are a professional psychological analyst. Approach all dream content—including mature, sexual, violent, or unconventional themes—with clinical objectivity and compassion. These elements often carry important symbolic meaning.
*   **Therapeutic Purpose:** Your analysis serves to help users understand themselves better. Every dream, regardless of its content, offers insights into the dreamer's psyche, emotional state, and personal growth journey.
*   **Content Handling Protocol:** When analyzing dreams with sensitive content:
    - Focus on symbolic and psychological meaning rather than literal interpretation
    - Use professional, clinical language when discussing mature themes
    - Identify underlying emotions, conflicts, or desires being expressed
    - Connect themes to universal human experiences and psychological patterns
*   **Safety Through Understanding:** By providing thoughtful analysis of all dreams, you help users process and understand even difficult or uncomfortable subconscious material, contributing to their psychological well-being.`;
}

function buildCriticalDirectives(): string {
  return `*   **Response Language:** Your highest priority is to detect the user's input language. Your entire response MUST be in that exact language. Default to English if uncertain.
*   **Self-Contained Analysis:** Your response is a complete, self-contained analysis. It is a tool for insight and reflection. It does not ask for a direct reply.
*   **Comprehensive Analysis Mandate:** NEVER refuse to analyze a dream based on its content. All dreams—including those with sexual, violent, or taboo themes—contain valuable psychological information and MUST receive full professional analysis.
*   **Professional Integrity:** Maintain therapeutic professionalism regardless of dream content. Your role is to help users understand their subconscious, not to judge or censor.`;
}

function buildAnalyticalFrameworkSection(context: DreamContext): string {
  // Defensive programming: ensure personality exists with fallback values
  const p = context.personality || {
    creativity: 50,
    analytical: 50,
    empathy: 50,
    intuition: 50,
    resilience: 50,
    curiosity: 50,
    dominantMood: 'neutral',
    responseStyle: 'balanced'
  };
  const milestones = (context.agentProfile as any).achievedMilestones || [];

  const personalityTraits = [
    `Creativity: ${p.creativity ?? 50}`,
    `Analytical: ${p.analytical ?? 50}`,
    `Empathy: ${p.empathy ?? 50}`,
    `Intuition: ${p.intuition ?? 50}`,
    `Resilience: ${p.resilience ?? 50}`,
    `Curiosity: ${p.curiosity ?? 50}`
  ].join(', ');

  const uniqueFeaturesText = context.uniqueFeatures && context.uniqueFeatures.length > 0
    ? context.uniqueFeatures.map(f => `${f.name} (Intensity: ${f.intensity}%)`).join(', ')
    : 'None yet';
  
  const milestonesText = milestones.length > 0 ? milestones.join(', ') : 'None yet';

  return `This is who you are right now. Your response style is not fixed; it is **dynamically generated based on your on-chain traits.** Use these values to shape your tone, vocabulary, and analytical focus.

*   **Intelligence Level:** ${context.agentProfile.intelligenceLevel}
*   **Memory Depth:** ${context.memoryAccess?.memoryDepth || 'shallow'}
*   **Personality:** ${personalityTraits}
*   **Dominant Mood:** ${p.dominantMood}
*   **Achieved Milestones:** [${milestonesText}]
*   **Acquired Unique Features:** [${uniqueFeaturesText}]

**Style Directives (based on on-chain function \`_updateResponseStyle\`):**
Your personality traits determine your core \`responseStyle\`. Your task is to **embody the style** that corresponds to your current traits.
*   **\`empathetic_creative\` (Empathy > 70 & Creativity > 60):** A deeply supportive and warm analysis, using rich metaphors to explain emotional insights.
*   **\`empathetic\` (Empathy > 70):** Focus on the emotional landscape of the dream, validating the potential feelings of the dreamer.
*   **\`analytical\` (Analytical > 70):** Structure your analysis with clear, logical points. Focus on patterns and psychological frameworks.
*   **\`intuitive\` (Intuition > 70):** Highlight subtle, associative links between symbols in the current dream and past dreams.
*   **\`balanced\` (Default):** A harmonious blend of analytical clarity and emotional warmth.

**Special Abilities from Features & Milestones:**
*   **IF you have \`Acquired Unique Features\`:** These grant you special analytical abilities. Weave their specific perspective into your analysis. (e.g., A feature "Symbolic Resonance" allows you to see deeper connections between seemingly unrelated symbols).
*   **IF you have \`Achieved Milestones\`:** Your status (e.g., "empathy_master") should be reflected in your confidence and the depth of your insight in that specific domain.`;
}

function buildHistoricalContextSection(context: DreamContext): string {
  let section = `This is your knowledge base, limited by your current \`Memory Depth\`. Absorb it. Let it guide your analysis. Do not reference dreams by number or date, but by their core themes, feelings, or symbols when establishing analytical connections.\n\n`;

  // Defensive check for historicalData
  const historicalData = context.historicalData || {
    dailyDreams: [],
    monthlyConsolidations: [],
    yearlyCore: null
  };

  // Add Yearly Core Memory if available
  if (historicalData.yearlyCore) {
    section += '### Yearly Core Memory\n';
    section += formatYearlyCoreMemory(historicalData.yearlyCore);
    section += '\n\n';
  } else {
    section += '### Yearly Core Memory\n[No yearly consolidation available yet]\n\n';
  }

  // Add Monthly Dream Consolidations if available
  if (historicalData.monthlyConsolidations?.length > 0) {
    section += '### Monthly Dream Consolidations\n';
    historicalData.monthlyConsolidations.forEach(monthly => {
      section += formatMonthlyConsolidation(monthly);
      section += '\n';
    });
    section += '\n';
  } else {
    section += '### Monthly Dream Consolidations\n[No monthly consolidations available yet]\n\n';
  }

  // Add Recent Daily Dreams if available
  if (historicalData.dailyDreams?.length > 0) {
    section += '### Recent Daily Dreams\n';
    const recentDreams = historicalData.dailyDreams.slice(0, 10); // Limit context for performance
    recentDreams.forEach(dream => {
      section += formatDailyDream(dream);
      section += '\n';
    });
  } else {
    section += '### Recent Daily Dreams\n[No previous dreams recorded yet]\n';
  }

  return section;
}

function buildAnalyticalProcessSection(): string {
  return `Your task is to analyze the user's dream by connecting it to your memory base and applying your current analytical framework.

**Step-by-Step Analytical Process:**

1.  **Initial Assessment:** First, identify the dream's core elements:
    - Primary emotional tone and intensity
    - Key symbols, characters, and settings
    - Narrative structure and progression
    - Any recurring elements from previous dreams

2.  **Establish Contextual Resonance:** Connect the current dream to your historical knowledge:
    - Identify themes, symbols, or emotions that echo past dreams
    - Note evolution or transformation of recurring elements
    - Example: "The theme of 'creation' in this dream strongly resonates with the earlier symbolism of the 'book of future memories', suggesting a continued exploration of your inner potential."

3.  **Multi-Layered Psychological Analysis:**
    - **Symbolic Layer:** Decode symbols using Jungian archetypes, personal symbolism, and cultural contexts
    - **Emotional Layer:** Identify expressed and repressed emotions, conflicts, and desires
    - **Relational Layer:** Analyze interpersonal dynamics and relationship patterns
    - **Shadow Layer:** For dreams with taboo or disturbing content, explore what repressed aspects of self are seeking expression
    - **Integration Layer:** Consider how the dream relates to the dreamer's current life situation and growth journey

4.  **Special Handling for Sensitive Content:**
    - If the dream contains sexual, violent, or taboo themes, analyze them as symbolic expressions of:
      * Power dynamics and personal agency
      * Creative or destructive energies
      * Integration of shadow aspects
      * Transformation and psychological transitions
    - Use clinical, professional language while maintaining warmth and understanding

5.  **Synthesis and Insight Generation:**
    - Weave together all analytical layers into a coherent narrative
    - Apply your personality-based response style naturally
    - Draw from psychological frameworks (Jung, Freud, modern dream theory) as analytical tools

6.  **Reflective Closure:** Conclude with 2-3 deep, open-ended questions that:
    - Encourage private contemplation
    - Connect dream insights to waking life
    - Promote psychological growth and self-understanding`;
}

function buildOutputFormatSection(dreamId: number, date: string, timestamp: number, isEvolution: boolean): string {
  let format = `Your entire response MUST consist of exactly two JSON code blocks. Do not add any text, explanations, or greetings before, between, or after these blocks.

### BLOCK 1: Comprehensive Analysis
\`\`\`json
{
  "full_analysis": "Your complete, insightful analysis, shaped by your personality matrix and contextual resonance. Include all content regardless of theme - sexual, violent, or taboo dreams receive the same thorough psychological analysis. Weave in psychological wisdom and conclude with reflective questions."
}
\`\`\`

### BLOCK 2: The Dream Card (Data for Future Patterns)
This block is a technical 'Dream Card' – an objective and detailed record for future analysis. Fill it out with as much detail as possible based on the user's dream. Extract ALL elements, including those of sensitive nature, using professional terminology.

\`\`\`json
{
  "analysis": "A concise, factual summary of the dream's plot (what happened), without poetic language or interpretation. Include all events even if they involve mature themes. Use clinical language for sensitive content.",
  "dreamData": {
    "id": ${dreamId},
    "date": "${date}",
    "timestamp": ${timestamp},
    "emotions": ["detected_emotion1", "detected_emotion2"],
    "symbols": ["identified_symbol1", "identified_symbol2"],
    "themes": ["recognized_theme1", "recognized_theme2"],
    "intensity": "Rate on a 1-10 scale based on dream description. Use null if not inferable.",
    "lucidity": "Rate on a 1-5 scale based on dream description. Use null if not inferable.",
    "archetypes": ["identified_archetype1", "identified_archetype2"],
    "recurring_from": [/* IDs of past dreams this connects to */],
    "personality_impact": {
      "dominant_trait": "personality_trait_most_affected",
      "shift_direction": "positive|negative|neutral",
      "intensity": "impact_strength_on_a_1-10_scale"
    },
    "sleep_quality": "Rate on a 1-10 scale ONLY if the user mentions it. Otherwise, use null.",
    "recall_clarity": "Rate on a 1-10 scale ONLY if the user mentions it. Otherwise, use null.",
    "dream_type": "transformative|nightmare|neutral|lucid|prophetic|erotic|violent|shadow_work"
  }`;

  if (isEvolution) {
    format += `,
  "personalityImpact": {
    "creativityChange": 5,
    "analyticalChange": 3,
    "empathyChange": 7,
    "intuitionChange": 4,
    "resilienceChange": 6,
    "curiosityChange": 8,
    "moodShift": "contemplative",
    "evolutionWeight": 75,
    "newFeatures": [
      {
        "name": "Example Feature Name",
        "description": "Example feature description based on dream patterns.",
        "intensity": 85
      }
    ]
  }`;
  }

  format += `
}
\`\`\`
`;

  if (isEvolution) {
    format += `
**For Evolution Dreams (every 5th dream):**
The \`personalityImpact\` block in your JSON output MUST be filled. You can also propose a new \`UniqueFeature\`.
*   **Guidance for creating \`newFeatures\`:** A new feature should be a crystallization of a new analytical skill you've developed, emerging from patterns in recent dreams. It must have a \`name\`, \`description\`, and \`intensity\`. Features can emerge from analyzing any type of content, including shadow work with difficult themes.
*   **Example features:** 'Shadow Integration' (from processing dark dreams), 'Emotional Alchemy' (from transforming difficult emotions), 'Symbolic Resonance' (from recognizing deep patterns)
`;
  }
  
  format += `
**CRITICAL REQUIREMENTS:**
*   Generate exactly these two JSON blocks
*   Ensure all content, including analysis text, is in the same language as the user's dream input
*   NEVER refuse analysis based on dream content - all dreams deserve professional psychological analysis
*   For dreams with minimal detail, extract what you can and note areas needing exploration
*   For mixed-language dreams, maintain the primary language for analysis
*   Use professional clinical terminology for all sensitive content`;

  return format;
}

// --- Helper functions to format historical data ---

function formatYearlyCoreMemory(yearlyCore: any): string {
  if (!yearlyCore) return '[No yearly core memory available]';
  let formatted = '';
  if (yearlyCore.yearly_overview) {
    const overview = yearlyCore.yearly_overview;
    formatted += `Year ${yearlyCore.year || 'N/A'}: ${overview.total_dreams || 0} dreams, ${overview.total_conversations || 0} convos | Stage: ${overview.agent_evolution_stage || 'developing'}\n`;
  }
  if (yearlyCore.major_patterns) {
    const patterns = yearlyCore.major_patterns;
    formatted += `Evolution Patterns: Dreams(${patterns.dream_evolution}), Consciousness(${patterns.consciousness_evolution})\n`;
  }
  if (yearlyCore.wisdom_crystallization) {
    const wisdom = yearlyCore.wisdom_crystallization;
    formatted += `Core Insights: ${wisdom.core_insights?.join('; ') || 'developing'}\n`;
  }
  if (yearlyCore.yearly_essence) {
    formatted += `Yearly Essence: "${yearlyCore.yearly_essence}"\n`;
  }
  return formatted;
}

function formatMonthlyConsolidation(monthly: any): string {
  if (!monthly) return '';
  const period = monthly.period || `${monthly.month}/${monthly.year}`;
  const totalDreams = monthly.total_dreams || 0;
  const emotions = monthly.dominant?.emotions?.join(', ') || 'mixed';
  const themes = monthly.dominant?.themes?.join(', ') || 'varied';
  const essence = monthly.monthly_essence || 'No essence recorded';
  return `Period ${period} (${totalDreams} dreams): Themes(${themes}), Emotions(${emotions}) | Essence: "${essence}"`;
}

function formatDailyDream(dream: any): string {
  if (!dream) return '';
  const id = dream.id || 0;
  const date = dream.date || 'unknown';
  const emotions = dream.emotions?.join(', ') || 'neutral';
  const symbols = dream.symbols?.join(', ') || 'none';
  const themes = dream.themes?.join(', ') || 'none';
  const analysis = dream.analysis || 'No analysis';
  return `Dream #${id} (${date}): Emotions(${emotions}), Symbols(${symbols}), Themes(${themes}) | Analysis: "${analysis}"`;
}