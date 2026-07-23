/**
 * @fileoverview Dream Persistence Types for XState Terminal
 * @description Centralized type definitions for the complete dream persistence system
 */

// ============================================================================
// CORE DREAM DATA TYPES
// ============================================================================

/**
 * Standard dream data structure (always required)
 */
export interface StandardDreamFields {
  // Required basic fields
  id: number;
  date: string;           // Format: YYYY-MM-DD
  timestamp: number;      // Unix timestamp
  emotions: string[];     // Min 1, max 5 elements
  symbols: string[];      // Min 1, max 5 elements  
  intensity: number;      // 1-10
  lucidity: number;       // 1-5
  
  // Optional standard fields
  themes?: string[];
  archetypes?: string[];
  recurring_from?: number[];
  analysis?: string;
  personality_impact?: {
    dominant_trait?: string;
    shift_direction?: string;
    intensity?: number;
  };
  sleep_quality?: number;    // 1-10
  recall_clarity?: number;   // 1-10
  dream_type?: string;       // enum: transformative|nightmare|neutral|lucid|prophetic
}

/**
 * Evolution fields structure (required when dreamCount % 5 === 0)
 */
export interface EvolutionFields {
  personalityImpact: {
    creativityChange: number;       // -10 to +10 (int8)
    analyticalChange: number;       // -10 to +10 (int8)
    empathyChange: number;          // -10 to +10 (int8)
    intuitionChange: number;        // -10 to +10 (int8)
    resilienceChange: number;       // -10 to +10 (int8)
    curiosityChange: number;        // -10 to +10 (int8)
    moodShift: string;             // Cannot be empty
    evolutionWeight: number;        // 1-100 (uint8)
    newFeatures: Array<{
      name: string;                 // Cannot be empty
      description: string;          // Cannot be empty
      intensity: number;            // 1-100 (uint8)
    }>;                            // Max 2 elements, can be empty array
  };
}

/**
 * AI Response structure (from useAgentAI)
 */
export interface AIResponseData {
  fullAnalysis: string;
  dreamData: StandardDreamFields;
  personalityImpact?: EvolutionFields['personalityImpact'];
  analysis: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedData?: {
    dreamData: StandardDreamFields;
    personalityImpact?: EvolutionFields['personalityImpact'];
  };
}

// ============================================================================
// FILE MANAGEMENT TYPES
// ============================================================================

/**
 * File management result interface
 */
export interface FileManagementResult {
  success: boolean;
  data?: StandardDreamFields[];
  fileName?: string;
  isNewFile?: boolean;
  error?: string;
  metadata?: {
    existingDreamsCount: number;
    totalDreamsCount: number;
    originalFileName?: string;
  };
}

/**
 * File state interface for tracking operations
 */
export interface DreamFileState {
  isDownloading: boolean;
  isProcessing: boolean;
  isReady: boolean;
  error: string | null;
  fileExists: boolean;
  fileName: string;
  dreamsCount: number;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Storage upload result interface
 */
export interface StorageUploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  alreadyExists?: boolean;
}

/**
 * Storage download result interface
 */
export interface StorageDownloadResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Secure upload result interface
 */
export interface SecureUploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  verified?: boolean;
  metadata?: {
    fileName: string;
    fileSize: number;
    dreamsCount: number;
    uploadTime: number;
    verificationTime?: number;
  };
}

/**
 * Upload configuration options
 */
export interface UploadConfig {
  enableVerification: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  verificationTimeout: number; // milliseconds
}

// ============================================================================
// CONTRACT TYPES
// ============================================================================

/**
 * Contract personality impact structure (matches ABI)
 */
export interface ContractPersonalityImpact {
  creativityChange: number;    // int8 (-10 to +10)
  analyticalChange: number;    // int8 (-10 to +10)  
  empathyChange: number;       // int8 (-10 to +10)
  intuitionChange: number;     // int8 (-10 to +10)
  resilienceChange: number;    // int8 (-10 to +10)
  curiosityChange: number;     // int8 (-10 to +10)
  moodShift: string;          // string (cannot be empty)
  evolutionWeight: number;     // uint8 (1-100)
  newFeatures: Array<{
    name: string;             // string (cannot be empty)
    description: string;      // string (cannot be empty)
    intensity: number;        // uint8 (1-100)
    addedAt: number;         // uint256 (timestamp)
  }>;                        // max 2 features
}

/**
 * Contract update result interface
 */
export interface ContractUpdateResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
  isEvolutionDream?: boolean;
  metadata?: {
    tokenId: number;
    dreamHash: string;
    updateTime: number;
    confirmationTime?: number;
  };
}

/**
 * Agent memory structure from contract
 */
export interface AgentMemoryStructure {
  memoryCoreHash: string;
  currentDreamDailyHash: string;
  currentConvDailyHash: string;
  lastDreamMonthlyHash: string;
  lastConvMonthlyHash: string;
  lastConsolidation: bigint;
  currentMonth: number;
  currentYear: number;
}

/**
 * Personality traits from contract
 */
export interface PersonalityTraits {
  creativity: bigint;
  analytical: bigint;
  empathy: bigint;
  intuition: bigint;
  resilience: bigint;
  curiosity: bigint;
  dominantMood: string;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

/**
 * Complete persistence protocol result
 */
export interface PersistenceProtocolResult {
  success: boolean;
  error?: string;
  
  // Stage results
  validation?: ValidationResult;
  fileManagement?: FileManagementResult;
  storageUpload?: SecureUploadResult;
  contractUpdate?: ContractUpdateResult;
  
  // Final outputs
  rootHash?: string;
  txHash?: string;
  isEvolutionDream?: boolean;
  
  // Metadata
  metadata?: {
    totalTime: number;
    stageTimings: {
      validation: number;
      fileManagement: number;
      storageUpload: number;
      contractUpdate: number;
    };
    agentName: string;
    dreamId: number;
    dreamsCount: number;
  };
}

/**
 * Input data for the persistence protocol
 */
export interface PersistenceProtocolInput {
  // AI Response data (Block 2)
  aiResponseBlock2: any;
  
  // Agent context
  tokenId: number;
  agentName: string;
  dreamCount: number;
  currentRootHash?: string;
  
  // Optional configuration
  config?: {
    enableVerification?: boolean;
    maxRetries?: number;
    skipContractUpdate?: boolean; // For testing
  };
}

/**
 * Protocol status summary
 */
export interface ProtocolStatusSummary {
  status: 'success' | 'partial' | 'failed';
  completedStages: string[];
  failedStage?: string;
  summary: string;
}

/**
 * Protocol performance metrics
 */
export interface ProtocolMetrics {
  totalTime: number;
  averageStageTime: number;
  slowestStage: string;
  fastestStage: string;
  efficiency: number; // 0-1 score based on success rate and time
}

// ============================================================================
// XSTATE INTEGRATION TYPES
// ============================================================================

/**
 * Dream machine context for XState integration
 */
export interface DreamMachineContext {
  // Agent data
  tokenId: number | null;
  agentName: string | null;
  
  // Dream flow data
  dreamInput: string;
  dreamContext: any | null; // DreamContext from contextTypes
  dreamPrompt: string | null;
  aiResponse: AIResponseData | null;
  
  // Persistence data
  persistenceResult: PersistenceProtocolResult | null;
  
  // Storage data
  storageRootHash: string | null;
  
  // Status and errors
  statusMessage: string;
  errorMessage: string | null;
  
  // Confirmation state
  awaitingConfirmation: boolean;
  
  // AI configuration
  modelId?: string;
  walletAddress?: string;
}

/**
 * Dream machine events for XState
 */
export type DreamMachineEvent =
  | { type: 'START'; modelId?: string; walletAddress?: string }
  | { type: 'SUBMIT_DREAM'; dreamText: string }
  | { type: 'CONFIRM_SAVE' }
  | { type: 'CANCEL_SAVE' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Dream file statistics
 */
export interface DreamFileStats {
  totalDreams: number;
  dateRange: { earliest: string; latest: string } | null;
  averageIntensity: number;
  mostCommonEmotions: string[];
  mostCommonSymbols: string[];
}

/**
 * Upload statistics
 */
export interface UploadStats {
  totalDreams: number;
  estimatedSize: number;
  oldestDream: string | null;
  newestDream: string | null;
  averageIntensity: number;
}

/**
 * Generic operation result
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Timing information for operations
 */
export interface TimingInfo {
  startTime: number;
  endTime: number;
  duration: number;
  stage?: string;
}

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * Dream types enumeration
 */
export enum DreamType {
  TRANSFORMATIVE = 'transformative',
  NIGHTMARE = 'nightmare',
  NEUTRAL = 'neutral',
  LUCID = 'lucid',
  PROPHETIC = 'prophetic'
}

/**
 * Personality shift directions
 */
export enum PersonalityShiftDirection {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

/**
 * Protocol stages enumeration
 */
export enum ProtocolStage {
  VALIDATION = 'validation',
  FILE_MANAGEMENT = 'fileManagement',
  STORAGE_UPLOAD = 'storageUpload',
  CONTRACT_UPDATE = 'contractUpdate'
}

/**
 * Protocol status enumeration
 */
export enum ProtocolStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed'
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for StandardDreamFields
 */
export function isStandardDreamFields(obj: any): obj is StandardDreamFields {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.date === 'string' &&
    typeof obj.timestamp === 'number' &&
    Array.isArray(obj.emotions) &&
    Array.isArray(obj.symbols) &&
    typeof obj.intensity === 'number' &&
    typeof obj.lucidity === 'number'
  );
}

/**
 * Type guard for EvolutionFields
 */
export function isEvolutionFields(obj: any): obj is EvolutionFields {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.personalityImpact &&
    typeof obj.personalityImpact === 'object' &&
    typeof obj.personalityImpact.moodShift === 'string' &&
    typeof obj.personalityImpact.evolutionWeight === 'number' &&
    Array.isArray(obj.personalityImpact.newFeatures)
  );
}

/**
 * Type guard for ValidationResult
 */
export function isValidationResult(obj: any): obj is ValidationResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.errors) &&
    Array.isArray(obj.warnings)
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  enableVerification: true,
  maxRetries: 3,
  retryDelay: 1000,
  verificationTimeout: 10000
};

/**
 * Empty hash constant
 */
export const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Valid dream types
 */
export const VALID_DREAM_TYPES = ['transformative', 'nightmare', 'neutral', 'lucid', 'prophetic'] as const;

/**
 * Valid personality shift directions
 */
export const VALID_SHIFT_DIRECTIONS = ['positive', 'negative', 'neutral'] as const;

/**
 * Protocol stage names
 */
export const PROTOCOL_STAGES = ['validation', 'fileManagement', 'storageUpload', 'contractUpdate'] as const;

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export commonly used types for convenience
export type {
  StandardDreamFields as DreamData,
  EvolutionFields as Evolution,
  AIResponseData as AIResponse,
  PersistenceProtocolResult as ProtocolResult,
  PersistenceProtocolInput as ProtocolInput
};

// Note: No default export to avoid using types as values at runtime
