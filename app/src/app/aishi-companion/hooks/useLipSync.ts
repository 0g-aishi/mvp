/**
 * @fileoverview Lip Sync Hook for Text-based Speech Simulation
 * @description Animates mouth parameters during AI text display
 */

import { useRef, useCallback } from 'react';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useLipSync' });

/**
 * Lip sync configuration
 */
const LIP_SYNC_CONFIG = {
  cycleTime: 200,           // ms per open-close cycle
  maxMouthOpen: 0.4,        // Maximum mouth opening during speech
  characterDuration: 50,    // ms per character estimate
};

/**
 * Hook for managing lip sync during text display
 */
export const useLipSync = (modelRef: React.RefObject<Live2DModelRef>) => {
  const isActiveRef = useRef(false);
  const cancelTokenRef = useRef(false);

  /**
   * Perform single mouth cycle (open → close)
   */
  const mouthCycle = useCallback(async (cancelToken: { cancelled: boolean }) => {
    if (!modelRef.current || cancelToken.cancelled) return;

    const halfCycle = LIP_SYNC_CONFIG.cycleTime / 2;

    // Open mouth
    for (let i = 0; i <= 10; i++) {
      if (cancelToken.cancelled) break;

      const value = (i / 10) * LIP_SYNC_CONFIG.maxMouthOpen;
      modelRef.current?.setParameterValue('ParamMouthOpenY', value);

      await new Promise(resolve => setTimeout(resolve, halfCycle / 10));
    }

    // Close mouth
    for (let i = 10; i >= 0; i--) {
      if (cancelToken.cancelled) break;

      const value = (i / 10) * LIP_SYNC_CONFIG.maxMouthOpen;
      modelRef.current?.setParameterValue('ParamMouthOpenY', value);

      await new Promise(resolve => setTimeout(resolve, halfCycle / 10));
    }
  }, [modelRef]);

  /**
   * Start lip sync animation for given text
   */
  const startLipSync = useCallback(async (text: string) => {
    if (!modelRef.current) {
      log.debug('Cannot start lip sync - model ref is null');
      return;
    }

    if (isActiveRef.current) {
      log.debug('Lip sync already active, stopping previous');
      stopLipSync();
    }

    isActiveRef.current = true;
    cancelTokenRef.current = false;

    // Calculate duration based on text length
    const estimatedDuration = text.length * LIP_SYNC_CONFIG.characterDuration;
    const cycles = Math.floor(estimatedDuration / LIP_SYNC_CONFIG.cycleTime);

    log.debug('Starting lip sync', {
      textLength: text.length,
      estimatedDuration,
      cycles
    });

    const cancelToken = { cancelled: false };
    cancelTokenRef.current = false;

    // Execute cycles
    for (let i = 0; i < cycles; i++) {
      if (cancelTokenRef.current) {
        log.debug('Lip sync cancelled mid-execution');
        break;
      }

      await mouthCycle(cancelToken);
    }

    // Ensure mouth is closed at end
    if (modelRef.current && !cancelTokenRef.current) {
      modelRef.current.setParameterValue('ParamMouthOpenY', 0);
    }

    isActiveRef.current = false;
    log.debug('Lip sync complete');
  }, [modelRef, mouthCycle]);

  /**
   * Stop lip sync immediately
   */
  const stopLipSync = useCallback(() => {
    if (!isActiveRef.current) return;

    cancelTokenRef.current = true;
    isActiveRef.current = false;

    // Close mouth
    if (modelRef.current) {
      modelRef.current.setParameterValue('ParamMouthOpenY', 0);
    }

    log.debug('Lip sync stopped');
  }, [modelRef]);

  /**
   * Perform single blink animation
   */
  const blink = useCallback(async () => {
    if (!modelRef.current) return;

    const currentLeft = modelRef.current.getParameterValue('ParamEyeLOpen');
    const currentRight = modelRef.current.getParameterValue('ParamEyeROpen');

    log.debug('Performing blink', {
      currentLeft,
      currentRight
    });

    const closeDuration = 100; // ms to close
    const openDuration = 100;  // ms to reopen

    // Close eyes (10 steps)
    for (let i = 10; i >= 0; i--) {
      const progress = i / 10;
      modelRef.current?.setParameterValue('ParamEyeLOpen', currentLeft * progress);
      modelRef.current?.setParameterValue('ParamEyeROpen', currentRight * progress);
      await new Promise(resolve => setTimeout(resolve, closeDuration / 10));
    }

    // Reopen eyes (10 steps)
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      modelRef.current?.setParameterValue('ParamEyeLOpen', currentLeft * progress);
      modelRef.current?.setParameterValue('ParamEyeROpen', currentRight * progress);
      await new Promise(resolve => setTimeout(resolve, openDuration / 10));
    }

    log.debug('Blink complete');
  }, [modelRef]);

  return {
    startLipSync,
    stopLipSync,
    blink,
    isActive: () => isActiveRef.current
  };
};
