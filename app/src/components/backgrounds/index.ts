// Export lazy-loaded version by default for performance
export { default as FaultyTerminal } from './LazyFaultyTerminal';
// Export original for cases where lazy loading is not needed
export { default as FaultyTerminalDirect } from './FaultyTerminal';
export type { FaultyTerminalProps, FaultyTerminalConfig } from './FaultyTerminal/types';