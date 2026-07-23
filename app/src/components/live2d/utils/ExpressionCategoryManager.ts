// Expression Category Manager for handling multiple expressions with categories
import type { Live2DModel, Cubism4InternalModel } from 'pixi-live2d-display-lipsyncpatch/cubism4';
import {
  ExpressionState,
  findExpressionCategory,
  getConflictingExpressions,
  applyPreset,
  EXPRESSION_PRESETS
} from './expression-categories';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'ExpressionCategoryManager' });

export class ExpressionCategoryManager {
  private model: Live2DModel | null = null;
  private state: ExpressionState = {
    activeExpressions: new Set<string>(),
    lastExclusiveByCategory: new Map<string, string>()
  };
  private expressionParameters: Map<string, any[]> = new Map();
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  // Initialize with a Live2D model
  setModel(model: Live2DModel | null) {
    this.model = model;
    if (!model) {
      this.reset();
    }
  }

  // Load expression parameter mappings from exp3.json files
  async loadExpressionParameters(expressions: Array<{ name: string; file: string }>) {
    for (const expr of expressions) {
      try {
        const response = await fetch(expr.file);
        const data = await response.json();
        if (data.Parameters) {
          this.expressionParameters.set(expr.name, data.Parameters);
        }
      } catch (error) {
        log.warn(`Failed to load expression parameters for ${expr.name}`, { error });
      }
    }
  }

  // Get currently active expressions
  getActiveExpressions(): string[] {
    return Array.from(this.state.activeExpressions);
  }

  // Check if an expression is active
  isExpressionActive(expressionName: string): boolean {
    return this.state.activeExpressions.has(expressionName);
  }

  // Toggle an expression on/off
  toggleExpression(expressionName: string): boolean {
    if (this.isExpressionActive(expressionName)) {
      this.removeExpression(expressionName);
      return false;
    } else {
      this.applyExpression(expressionName);
      return true;
    }
  }

  // Apply an expression with category logic
  applyExpression(expressionName: string): void {
    if (!this.model) {
      log.warn('No model set for ExpressionCategoryManager');
      return;
    }

    // Get conflicting expressions
    const conflicts = getConflictingExpressions(expressionName, this.state.activeExpressions);
    
    // Remove conflicting expressions
    for (const conflict of conflicts) {
      this.removeExpressionInternal(conflict);
    }

    // Apply the new expression
    this.applyExpressionInternal(expressionName);

    // Update state
    this.state.activeExpressions.add(expressionName);
    
    // Track last exclusive expression per category
    const category = findExpressionCategory(expressionName);
    if (category && category[1].mode === 'exclusive') {
      this.state.lastExclusiveByCategory.set(category[0], expressionName);
    }

    this.debugLog(`Applied expression: ${expressionName}`);
    this.debugLog(`Active expressions: ${this.getActiveExpressions().join(', ')}`);
  }

  // Remove an expression
  removeExpression(expressionName: string): void {
    if (!this.model || !this.state.activeExpressions.has(expressionName)) {
      return;
    }

    this.removeExpressionInternal(expressionName);
    this.state.activeExpressions.delete(expressionName);

    this.debugLog(`Removed expression: ${expressionName}`);
    this.debugLog(`Active expressions: ${this.getActiveExpressions().join(', ')}`);
  }

  // Apply a preset form (angel, devil, neutral)
  applyFormPreset(presetName: keyof typeof EXPRESSION_PRESETS): void {
    if (!this.model) return;

    const { add, remove } = applyPreset(presetName, this.state.activeExpressions);

    // Remove expressions
    for (const expr of remove) {
      this.removeExpression(expr);
    }

    // Add expressions
    for (const expr of add) {
      this.applyExpression(expr);
    }

    this.debugLog(`Applied preset: ${presetName}`);
  }

  // Reset all expressions
  reset(): void {
    if (!this.model) return;

    // Remove all active expressions
    for (const expr of this.state.activeExpressions) {
      this.removeExpressionInternal(expr);
    }

    this.state.activeExpressions.clear();
    this.state.lastExclusiveByCategory.clear();

    // Reset expression in Live2D model
    this.model.expression(null);

    this.debugLog('Reset all expressions');
  }

  // Internal method to apply expression parameters
  private applyExpressionInternal(expressionName: string): void {
    if (!this.model) return;

    const parameters = this.expressionParameters.get(expressionName);
    if (!parameters) {
      // Fallback to using built-in expression system
      this.model.expression(expressionName);
      return;
    }

    // Apply parameters manually for additive support
    for (const param of parameters) {
      const currentValue = (this.model.internalModel as Cubism4InternalModel).coreModel.getParameterValueById(param.Id) || 0;
      let newValue = currentValue;

      switch (param.Blend) {
        case 'Add':
          newValue = currentValue + (param.Value || 0);
          break;
        case 'Multiply':
          newValue = currentValue * (param.Value || 1);
          break;
        case 'Overwrite':
        default:
          newValue = param.Value || 0;
          break;
      }

      (this.model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById(param.Id, newValue);
    }
  }

  // Internal method to remove expression parameters
  private removeExpressionInternal(expressionName: string): void {
    if (!this.model) return;

    const parameters = this.expressionParameters.get(expressionName);
    if (!parameters) {
      return;
    }

    // Reset parameters based on blend mode
    for (const param of parameters) {
      const currentValue = (this.model.internalModel as Cubism4InternalModel).coreModel.getParameterValueById(param.Id) || 0;
      let newValue = currentValue;

      switch (param.Blend) {
        case 'Add':
          newValue = currentValue - (param.Value || 0);
          break;
        case 'Multiply':
          newValue = param.Value !== 0 ? currentValue / (param.Value || 1) : 0;
          break;
        case 'Overwrite':
        default:
          newValue = 0; // Reset to default
          break;
      }

      (this.model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById(param.Id, newValue);
    }
  }

  // Debug logging
  private debugLog(message: string): void {
    if (this.debugMode && process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
      log.debug(message);
    }
  }
}