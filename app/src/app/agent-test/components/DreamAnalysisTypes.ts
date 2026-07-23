// Shared types and interfaces for Dream Analysis components

export interface DreamAnalysisSectionProps {
  hasAgent: boolean;
  effectiveTokenId: number | undefined;
}

export interface AgentData {
  agentName: string;
  intelligenceLevel: number;
  dreamCount: number;
  conversationCount: number;
  totalEvolutions: number;
  personalityInitialized: boolean;
  personality?: {
    creativity: number;
    analytical: number;
    empathy: number;
    intuition: number;
    resilience: number;
    curiosity: number;
    dominantMood: string;
    uniqueFeatures?: string[];
  };
  memory?: {
    memoryCoreHash: string;
    currentDreamDailyHash: string;
    lastDreamMonthlyHash: string;
    currentConvDailyHash: string;
    lastConvMonthlyHash: string;
    currentMonth: number;
    currentYear: number;
    lastConsolidation?: number;
  };
}

export interface MemoryAccess {
  monthsAccessible: number;
  memoryDepth: string;
}

export interface Theme {
  bg: {
    card: string;
    panel: string;
  };
  border: string;
  text: {
    primary: string;
    secondary: string;
  };
  accent: {
    primary: string;
    secondary: string;
  };
}

export interface BuiltContext {
  agentProfile: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ParsedResponse {
  dreamData?: {
    id: number;
    [key: string]: any;
  };
  personalityImpact?: any;
  [key: string]: any;
}

export interface PromptFormat {
  needsPersonalityEvolution: boolean;
  [key: string]: any;
}

// Debug logging function type
export type DebugLogFunction = (message: string, data?: any) => void;

// Common handler types
export type AsyncHandler = () => Promise<void>;
export type Handler = () => void;

// Storage and processing result types
export interface ProcessingResult {
  success: boolean;
  error?: string;
  rootHash?: string;
  txHash?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}