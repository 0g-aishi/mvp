// =============================================================================
// DREAMSCAPE TYPES
// =============================================================================

import { ReactNode } from 'react';
import type { Address } from 'viem';

// =============================================================================
// THEME TYPES
// =============================================================================

export interface ThemeColors {
  bg: {
    main: string;
    card: string;
    panel: string;
    success: string;
    primary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    success: string;
    white: string;
  };
  border: string;
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
    success: string;
    error: string;
  };
  dream: {
    violet: string;
    purple: string;
    lightPurple: string;
    pink: string;
    cyan: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    rainbow: string;
    dream: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  typography: {
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };
    fontFamilies: {
      primary: string;
      monospace: string;
    };
    fontWeights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    full: string;
  };
  effects: {
    blur: {
      sm: string;
      md: string;
    };
    shadows: {
      glow: string;
    };
    transitions: {
      fast: string;
      normal: string;
    };
  };
  shimmer: {
    color: string;
    size: string;
    duration: string;
  };
}

export interface ThemeContextType {
  theme: ThemeColors;
  debugLog: (message: string, data?: any) => void;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

export interface ChainConfig {
  id: number;
  name: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

export interface WalletState {
  address: Address | undefined;
  shortAddress: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  isLoading: boolean;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  networkName: string;
  networkDisplayName: string;
  chainConfig: ChainConfig;
}

// =============================================================================
// DREAM AGENT TYPES
// =============================================================================

export type AgentLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AgentCapabilities {
  memoryContext: number;
  analysisDepth: string;
  symbolDatabase: number;
  processingFeatures: string[];
  promptComplexity: number;
  predictionWindow?: number;
}

export interface DreamAgent {
  id: string;
  owner: Address;
  level: AgentLevel;
  dreamsProcessed: number;
  capabilities: AgentCapabilities;
  createdAt: Date;
  lastActive: Date;
  metadata: {
    name?: string;
    description?: string;
    avatar?: string;
  };
}

// =============================================================================
// DREAM TYPES
// =============================================================================

export interface DreamData {
  id: string;
  userId: Address;
  title: string;
  description: string;
  audioUrl?: string;
  transcript?: string;
  analysis?: DreamAnalysis;
  timestamp: Date;
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DreamAnalysis {
  level: AgentLevel;
  interpretation: string;
  emotions: string[];
  symbols: DreamSymbol[];
  patterns: string[];
  insights: string[];
  recommendations?: string[];
  prediction?: {
    timeframe: string;
    content: string;
  };
}

export interface DreamSymbol {
  symbol: string;
  meaning: string;
  frequency: number;
  context: string;
}

// =============================================================================
// COMPONENT TYPES
// =============================================================================

export interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}

export interface FeatureCardProps extends BaseComponentProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DreamUploadResponse {
  dreamId: string;
  status: 'uploaded' | 'processing';
  estimatedCompletion?: string;
}

export interface AgentStatsResponse {
  totalDreams: number;
  currentLevel: AgentLevel;
  nextLevelRequirement: number;
  processingAccuracy: number;
  averageResponseTime: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type DreamscapeError = 
  | { type: 'WALLET_NOT_CONNECTED' }
  | { type: 'WRONG_NETWORK'; expected: string }
  | { type: 'INSUFFICIENT_BALANCE'; required: bigint; current: bigint }
  | { type: 'UPLOAD_FAILED'; message: string }
  | { type: 'PROCESSING_FAILED'; dreamId: string; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'CONTRACT_ERROR'; message: string };

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithLoading<T> = T & {
  isLoading: boolean;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}; 