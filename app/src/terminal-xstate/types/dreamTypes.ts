/**
 * @fileoverview Type definitions for Dream Analysis System
 * @description TypeScript interfaces and types for the advanced dream prompt builder
 */

export interface DreamAnalysisResponse {
  full_analysis: string;
}

export interface DreamData {
  id: number;
  date: string;
  timestamp: number;
  emotions: string[];
  symbols: string[];
  themes: string[];
  intensity: number;
  lucidity: number;
  archetypes: string[];
  recurring_from: number[];
  personality_impact: {
    dominant_trait: string;
    shift_direction: 'positive' | 'negative' | 'neutral';
    intensity: number;
  };
  sleep_quality: number;
  recall_clarity: number;
  dream_type: 'transformative' | 'nightmare' | 'neutral' | 'lucid' | 'prophetic';
}

export interface PersonalityEvolution {
  creativityChange: number;
  analyticalChange: number;
  empathyChange: number;
  intuitionChange: number;
  resilienceChange: number;
  curiosityChange: number;
  moodShift: string;
  evolutionWeight: number;
  newFeatures: Array<{
    name: string;
    description: string;
    intensity: number;
  }>;
}

export interface DreamAnalysisResult {
  analysis: string;
  dreamData: DreamData;
  personalityImpact?: PersonalityEvolution;
}

export interface YearlyCoreMemory {
  year: number;
  yearly_overview: {
    total_dreams: number;
    total_conversations: number;
    agent_evolution_stage: string;
  };
  major_patterns: {
    dream_evolution: string;
    conversation_evolution: string;
    relationship_evolution: string;
    consciousness_evolution: string;
  };
  milestones: {
    personality: string[];
    consciousness: string[];
    relationship: string[];
  };
  wisdom_crystallization: {
    core_insights: string[];
    life_philosophy: string;
  };
  yearly_essence: string;
  final_metrics: {
    consciousness_level: number;
    integration_score: number;
    wisdom_depth: number;
  };
}

export interface MonthlyConsolidation {
  month: number;
  year: number;
  period: string;
  total_dreams: number;
  dominant: {
    emotions: string[];
    symbols: string[];
    themes: string[];
    archetypes: string[];
  };
  metrics: {
    avg_intensity: number;
    avg_lucidity: number;
    nightmare_ratio: number;
    breakthrough_dreams: number;
  };
  trends: {
    emotional: string;
    lucidity: string;
    complexity: string;
  };
  personality_evolution: {
    primary_growth: string;
    secondary_growth: string;
    total_shift: number;
    new_features: string[];
  };
  key_discoveries: string[];
  monthly_essence: string;
  dream_connections: {
    recurring_chains: number[][];
    theme_clusters: Record<string, number[]>;
  };
}

export interface DailyDream {
  id: number;
  date: string;
  timestamp?: number;
  emotions?: string[];
  symbols?: string[];
  themes?: string[];
  intensity?: number;
  lucidity?: number;
  lucidity_level?: number; // backward compatibility
  archetypes?: string[];
  dream_type?: string;
  sleep_quality?: number;
  recall_clarity?: number;
  ai_analysis?: string;
  analysis?: string; // backward compatibility
  content?: string; // backward compatibility
  recurring_from?: number[];
}

export interface HistoricalData {
  dailyDreams: DailyDream[];
  monthlyConsolidations: MonthlyConsolidation[];
  yearlyCore: YearlyCoreMemory | null;
}

export interface AgentPersonality {
  creativity: number;
  analytical: number;
  empathy: number;
  intuition: number;
  resilience: number;
  curiosity: number;
  dominantMood: string;
  responseStyle: string;
}

export interface AgentProfile {
  name: string;
  intelligenceLevel: number;
  dreamCount: number;
  conversationCount: number;
}

export interface MemoryAccess {
  monthsAccessible: number;
  memoryDepth: string;
}

export interface DreamPromptContext {
  userDream: string;
  agentProfile: AgentProfile;
  personality: AgentPersonality;
  memoryAccess: MemoryAccess;
  historicalData: HistoricalData;
}