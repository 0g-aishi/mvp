import { ReactNode } from 'react';

// Gemini 2.5 Pro Preview TTS Voice IDs
export type GeminiVoiceId =
  | 'aoede'     // Breezy and natural (female)
  | 'zephyr'    // Bright and cheerful (female)
  | 'achernar'  // Soft and gentle (male)
  | 'kore'      // Firm and confident (female)
  | 'charon'    // Informative and clear (male)
  | 'fenrir'    // Excitable and dynamic (male)
  | 'puck'      // Upbeat and energetic (neutral)
  | 'achird'    // Steady and reliable (male)
  | 'algenib'   // Sophisticated and elegant (female)
  | 'algieba'   // Warm and welcoming (female)
  | 'alnilam'   // Strong and commanding (male)
  | 'autonoe'   // Mysterious and intriguing (female)
  | 'callirhoe'; // Melodic and harmonious (female)

// Terminal line types matching the old terminal
export type LineType =
  | 'input'
  | 'output'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'system'
  | 'help-command'
  | 'help-interactive'
  | 'help-header'
  | 'info-labeled'
  | 'voice-input'
  | 'voice-output';

export interface TerminalLine {
  type: LineType;
  content: string | ReactNode;
  timestamp: number;
  // Additional data for interactive help lines
  command?: string;
  hasTooltip?: boolean;
  tooltip?: string;
  // Voice message data
  audioData?: string; // Base64 encoded audio
  audioBlob?: Blob;
  audioFormat?: string; // MIME type for audio (e.g., 'audio/mp3', 'audio/webm')
  duration?: number;
  transcript?: string;
  voiceId?: string;
}

// Context for the terminal machine
export interface TerminalContext {
  lines: TerminalLine[];
  welcomeLines: TerminalLine[];
  currentInput: string;
  commandHistory: string[];
  historyIndex: number;
  isInitialized: boolean;
  brokerRef: any; // ActorRef from XState
  modelRef: any; // ActorRef from XState
  agentRef: any; // ActorRef from XState for agent synchronization
  dreamRef: any; // ActorRef from XState for dream workflow
  chatRef: any; // ActorRef from XState for chat workflow
  voiceRef: any; // ActorRef from XState for voice control
  monthLearnRef: any; // ActorRef from XState for month-learn workflow
  memoryCoreRef: any; // ActorRef from XState for memory-core workflow
  selectedModel: string | null;
  // Voice state
  selectedVoice: GeminiVoiceId | null;
  isVoiceEnabled: boolean;
  voiceStatus: string | null;
  isRecording: boolean;
  wasVoiceInput: boolean; // Track if current input came from voice
  // Dream workflow state
  isDreamActive: boolean;
  dreamStatus: string | null;
  dreamPrompt: string | null;
  // Chat workflow state
  isChatActive: boolean;
  chatStatus: string | null;
  chatPrompt: string | null;
  // Month-learn workflow state
  isMonthLearnActive: boolean;
  monthLearnStatus: string | null;
  // Memory-core workflow state
  isMemoryCoreActive: boolean;
  memoryCoreStatus: string | null;
  // Last parsed command for state transitions
  lastParsedCommand: string | null;
  // TTS synthesis state
  isSynthesizing: boolean;
}

// Events the terminal can receive
export type TerminalEvent =
  | { type: 'INPUT.CHANGE'; value: string }
  | { type: 'INPUT.SUBMIT' }
  | { type: 'HISTORY.UP' }
  | { type: 'HISTORY.DOWN' }
  | { type: 'CLEAR' }
  | { type: 'INITIALIZE' }
  | { type: 'UPDATE_MODEL'; modelId: string }
  | { type: 'INITIALIZE_BROKER'; walletAddress: string }
  | { type: 'SYNC_AGENT'; walletAddress: string; provider: any }
  | { type: 'APPEND_LINES'; lines: TerminalLine[] }
  | { type: 'UPDATE_STATUS'; status?: string | null; prompt?: string | null; source?: 'global' | 'dream' | 'chat' | 'month' | 'memory'; preservePrompt?: boolean }
  | { type: 'DREAM.COMPLETE' }
  | { type: 'CHAT_COMPLETED' }
  | { type: 'MONTH_LEARN.COMPLETE' }
  | { type: 'MEMORY_CORE.COMPLETE' }
  | { type: 'END_SESSION' }
  // Voice events
  | { type: 'VOICE.TOGGLE' }
  | { type: 'VOICE.START_RECORDING' }
  | { type: 'VOICE.STOP_RECORDING' }
  | { type: 'VOICE.TRANSCRIBED'; transcript: string; language?: string }
  | { type: 'VOICE.SELECT_VOICE'; voiceId: GeminiVoiceId }
  | { type: 'VOICE.SPEAK'; text: string; emotionalTone?: string }
  | { type: 'VOICE.ERROR'; message: string }
  | { type: 'VOICE.TTS_COMPLETE' }
  | { type: 'APPEND_VOICE_INPUT'; audioBase64: string; audioBlob: Blob; duration: number; transcript?: string }
  | { type: 'SET_VOICE_INPUT'; value: boolean };