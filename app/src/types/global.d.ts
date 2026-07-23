/**
 * @fileoverview Global type declarations for the application
 * @description Extends global interfaces and adds missing types for Web3 providers
 */

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress: string | null;
      chainId: string;
      networkVersion: string;
      isConnected(): boolean;
    };
  }
}

export {};