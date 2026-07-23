// Expression category system for Live2D models
export type ExpressionMode = 'exclusive' | 'additive';

export interface ExpressionCategory {
  name: string;
  mode: ExpressionMode;
  expressions: string[];
  conflicts?: Record<string, string[]>; // expression -> conflicting expressions
}

export interface ExpressionState {
  activeExpressions: Set<string>;
  lastExclusiveByCategory: Map<string, string>;
}

// Expression categories for 水母 (Jellyfish) model
export const EXPRESSION_CATEGORIES: Record<string, ExpressionCategory> = {
  emotions: {
    name: 'Emotions',
    mode: 'exclusive',
    expressions: ['哭哭', '生气', '脸红', '黑脸', '空白眼', '蚊香眼']
  },
  eyeEffects: {
    name: 'Eye Effects',
    mode: 'exclusive',
    expressions: ['爱心眼', '星星眼']
  },
  headAccessories: {
    name: 'Head Accessories',
    mode: 'additive',
    expressions: ['猫耳', '花花', '一字发夹', '十字发夹', '光环', '恶魔角'],
    conflicts: {
      '光环': ['恶魔角'], // Halo conflicts with devil horns
      '恶魔角': ['光环']  // Devil horns conflict with halo
    }
  },
  faceAccessories: {
    name: 'Face Accessories',
    mode: 'additive',
    expressions: ['眼罩']
  },
  clothing: {
    name: 'Clothing',
    mode: 'additive',
    expressions: ['外套']
  },
  heldItems: {
    name: 'Held Items',
    mode: 'exclusive',
    expressions: ['麦克风', '茶杯', '游戏机', '写字板', '蝴蝶结']
  },
  wings: {
    name: 'Wings',
    mode: 'exclusive',
    expressions: ['翅膀', '翅膀切换']
  },
  colorTransform: {
    name: 'Color Transform',
    mode: 'exclusive',
    expressions: ['换色', '光环换色']
  },
  specialEffects: {
    name: 'Special Effects',
    mode: 'additive',
    expressions: ['比心', '点触', '水印']
  }
};

// Preset combinations for specific forms
export const EXPRESSION_PRESETS = {
  angel: {
    name: 'Angel Form',
    expressions: ['光环', '翅膀'], // Halo + white wings
    removeExpressions: ['恶魔角', '翅膀切换', '换色'] // Remove devil horns, ensure white wings
  },
  devil: {
    name: 'Devil Form',
    expressions: ['恶魔角', '翅膀', '翅膀切换', '换色'], // Devil horns + black wings + dark colors
    removeExpressions: ['光环', '光环换色'] // Remove halo
  },
  neutral: {
    name: 'Neutral Form',
    expressions: [],
    removeExpressions: ['光环', '恶魔角', '翅膀', '换色'] // Remove all form-specific items
  }
};

// Helper function to find which category an expression belongs to
export function findExpressionCategory(expressionName: string): [string, ExpressionCategory] | null {
  for (const [categoryId, category] of Object.entries(EXPRESSION_CATEGORIES)) {
    if (category.expressions.includes(expressionName)) {
      return [categoryId, category];
    }
  }
  return null;
}

// Check if two expressions can be active simultaneously
export function canExpressionsCoexist(expr1: string, expr2: string): boolean {
  const category1 = findExpressionCategory(expr1);
  const category2 = findExpressionCategory(expr2);

  // If either expression is not categorized, allow coexistence
  if (!category1 || !category2) return true;

  const [catId1, cat1] = category1;
  const [catId2, cat2] = category2;

  // Same category with exclusive mode = cannot coexist
  if (catId1 === catId2 && cat1.mode === 'exclusive') {
    return false;
  }

  // Check for explicit conflicts
  if (cat1.conflicts && cat1.conflicts[expr1]?.includes(expr2)) {
    return false;
  }
  if (cat2.conflicts && cat2.conflicts[expr2]?.includes(expr1)) {
    return false;
  }

  return true;
}

// Get expressions that need to be removed when applying a new expression
export function getConflictingExpressions(
  newExpression: string,
  activeExpressions: Set<string>
): string[] {
  const toRemove: string[] = [];
  const newCategory = findExpressionCategory(newExpression);

  if (!newCategory) return toRemove;

  const [newCatId, newCat] = newCategory;

  for (const activeExpr of activeExpressions) {
    // Skip if it's the same expression
    if (activeExpr === newExpression) continue;

    // Check if they can coexist
    if (!canExpressionsCoexist(newExpression, activeExpr)) {
      toRemove.push(activeExpr);
    }
  }

  return toRemove;
}

// Apply a preset, returning expressions to add and remove
export function applyPreset(
  presetName: keyof typeof EXPRESSION_PRESETS,
  activeExpressions: Set<string>
): { add: string[], remove: string[] } {
  const preset = EXPRESSION_PRESETS[presetName];
  const toAdd: string[] = [];
  const toRemove: string[] = [];

  // Remove expressions that should be removed by preset
  for (const expr of preset.removeExpressions) {
    if (activeExpressions.has(expr)) {
      toRemove.push(expr);
    }
  }

  // Add preset expressions, checking for conflicts
  for (const expr of preset.expressions) {
    if (!activeExpressions.has(expr)) {
      const conflicts = getConflictingExpressions(expr, activeExpressions);
      toRemove.push(...conflicts);
      toAdd.push(expr);
    }
  }

  return { add: toAdd, remove: toRemove };
}