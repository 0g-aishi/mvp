/**
 * @fileoverview Parameter Animator for Live2D Smooth Transitions
 * @description Generates interpolation steps and executes animations at 60 FPS
 */

import type { ParameterUpdate } from './aiParameterService';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'ParameterAnimator' });

/**
 * Animation step for single parameter
 */
interface AnimationStep {
  paramId: string;
  value: number;
}

/**
 * Animation sequence for single parameter
 */
export interface AnimationSequence {
  paramId: string;
  name: string;
  steps: number[];         // Interpolated values from current to target
  currentStep: number;
  totalSteps: number;
}

/**
 * Step size configuration for different parameter types
 * Smaller step = smoother but slower animation
 * Larger step = faster but choppier animation
 */
const STEP_SIZE_CONFIG: Record<string, number> = {
  // Head movements - moderate speed (1 degree per step)
  'ParamAngleX': 1,
  'ParamAngleY': 1,
  'ParamAngleZ': 0.5,

  // Eye movements - fast and responsive (0.05 per step)
  'ParamEyeBallX': 0.05,
  'ParamEyeBallY': 0.05,
  'ParamEyeLOpen': 0.1,
  'ParamEyeROpen': 0.1,

  // Facial expressions - smooth and natural (0.05 per step)
  'ParamBrowLY': 0.05,
  'ParamBrowRY': 0.05,
  'ParamMouthOpenY': 0.1,
  'ParamMouthForm': 0.05,

  // Subtle movements - very smooth (0.02-0.05 per step)
  'Param59': 0.05,   // MouthX
  'Param58': 0.05,   // CheekPuff
  'Param31': 0.05,   // MouthPucker
  'Param76': 0.05,   // ChinPosition
};

/**
 * Parameter Animator Class
 * Manages smooth interpolation and execution of parameter animations
 */
export class ParameterAnimator {
  private frameInterval: number = 16; // ~60 FPS
  private activeAnimations: Map<string, AnimationSequence> = new Map();

  /**
   * Generate interpolation steps from current to target value
   */
  private generateSteps(
    paramId: string,
    currentValue: number,
    targetValue: number
  ): number[] {
    const stepSize = STEP_SIZE_CONFIG[paramId] || 1;
    const delta = targetValue - currentValue;
    const absDelta = Math.abs(delta);

    // If change is very small, return single step
    if (absDelta < stepSize) {
      return [currentValue, targetValue];
    }

    // Calculate number of steps
    const numSteps = Math.ceil(absDelta / stepSize);
    const actualStepSize = delta / numSteps;

    // Generate intermediate values
    const steps: number[] = [];
    for (let i = 0; i <= numSteps; i++) {
      const value = currentValue + (actualStepSize * i);
      steps.push(Math.round(value * 100) / 100); // Round to 2 decimals
    }

    return steps;
  }

  /**
   * Create animation sequence for a parameter update
   */
  createAnimationSequence(update: ParameterUpdate): AnimationSequence | null {
    if (!update.isValid) {
      log.debug('Skipping invalid parameter', { paramId: update.paramId, error: update.error });
      return null;
    }

    const steps = this.generateSteps(
      update.paramId,
      update.currentValue,
      update.targetValue
    );

    log.debug('Created animation sequence', {
      name: update.name,
      paramId: update.paramId,
      from: update.currentValue,
      to: update.targetValue,
      steps: steps.length,
      values: steps
    });

    return {
      paramId: update.paramId,
      name: update.name,
      steps,
      currentStep: 0,
      totalSteps: steps.length
    };
  }

  /**
   * Queue multiple animations to run in parallel
   */
  queueAnimations(updates: ParameterUpdate[]): AnimationSequence[] {
    const sequences: AnimationSequence[] = [];

    updates.forEach(update => {
      const sequence = this.createAnimationSequence(update);
      if (sequence) {
        sequences.push(sequence);
        this.activeAnimations.set(update.paramId, sequence);
      }
    });

    log.debug('Queued animations', {
      count: sequences.length,
      parameters: sequences.map(s => s.name)
    });

    return sequences;
  }

  /**
   * Execute animations frame by frame at 60 FPS
   * All sequences run in parallel
   */
  async executeAnimations(
    sequences: AnimationSequence[],
    modelRef: Live2DModelRef
  ): Promise<void> {
    if (sequences.length === 0) {
      log.debug('No animations to execute');
      return;
    }

    // Find longest animation duration
    const maxSteps = Math.max(...sequences.map(s => s.totalSteps));

    log.debug('Starting animation execution', {
      totalSequences: sequences.length,
      maxSteps,
      estimatedDuration: maxSteps * this.frameInterval
    });

    // Execute frame by frame
    for (let frame = 0; frame < maxSteps; frame++) {
      await new Promise(resolve => setTimeout(resolve, this.frameInterval));

      sequences.forEach(sequence => {
        if (sequence.currentStep < sequence.steps.length) {
          const value = sequence.steps[sequence.currentStep];

          // Update model parameter
          modelRef.setParameterValue(sequence.paramId, value);

          sequence.currentStep++;
        }
      });
    }

    // Cleanup completed animations
    sequences.forEach(seq => {
      this.activeAnimations.delete(seq.paramId);
    });

    log.debug('Animation execution complete');
  }

  /**
   * Cancel all active animations
   */
  cancelAll(): void {
    this.activeAnimations.clear();
    log.debug('All animations cancelled');
  }

  /**
   * Check if any animations are active
   */
  isAnimating(paramId?: string): boolean {
    if (paramId) {
      return this.activeAnimations.has(paramId);
    }
    return this.activeAnimations.size > 0;
  }

  /**
   * Get active animation count
   */
  getActiveCount(): number {
    return this.activeAnimations.size;
  }
}

/**
 * Create a singleton animator instance
 */
let animatorInstance: ParameterAnimator | null = null;

export function getParameterAnimator(): ParameterAnimator {
  if (!animatorInstance) {
    animatorInstance = new ParameterAnimator();
  }
  return animatorInstance;
}
