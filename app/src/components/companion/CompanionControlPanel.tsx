'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeart,
  FaTshirt,
  FaStar,
  FaPalette,
  FaSliders,
  FaBookmark,
  FaSave,
  FaChartBar,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSearch
} from 'react-icons/fa';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { ParameterSlider } from './ParameterSlider';
import { PhysicsPresetsLibrary, type PhysicsPreset } from './PhysicsPresetsLibrary';
import { StateManager, type CompanionState } from './StateManager';
import {
  PARAMETER_DEFINITIONS,
  getAllCategories,
  getParametersByCategory,
  getTotalParameterCount,
  getParameterCountByCategory,
  getModifiedParameterCount,
  type ParameterCategory
} from './ParameterDefinitions';

export interface CompanionControlPanelProps {
  modelRef: React.RefObject<Live2DModelRef>;
  isModelReady: boolean;
  currentParameters: Map<string, number>;
  onParameterChange: (parameterId: string, value: number) => void;
  onParameterReset: (parameterId: string) => void;
  onResetAllParameters: () => void;
  currentExpressions: string[];
}

type TabType =
  | 'emotions'
  | 'accessories'
  | 'decorations'
  | 'special'
  | 'physics'
  | 'presets'
  | 'state'
  | 'performance';

// ============================================================
// HELPER COMPONENTS (Defined before main component for proper hoisting)
// ============================================================

// Reusable Tab Content Wrapper
const TabContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

// Expression Button Component
interface ExpressionButtonProps {
  icon: string;
  name: string;
  expression: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'emotion' | 'accessory' | 'decoration' | 'special';
}

const ExpressionButton: React.FC<ExpressionButtonProps> = ({
  icon,
  name,
  expression,
  isActive,
  onClick,
  variant = 'emotion'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    emotion: { active: '#8B5CF6', inactive: 'rgba(139, 92, 246, 0.3)' },
    accessory: { active: '#22C55E', inactive: 'rgba(34, 197, 94, 0.3)' },
    decoration: { active: '#FBBf24', inactive: 'rgba(251, 191, 36, 0.3)' },
    special: { active: '#A855F7', inactive: 'rgba(168, 85, 247, 0.3)' }
  };

  const colors = colorMap[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '14px',
        backgroundColor: isActive
          ? `${colors.active}20`
          : isHovered
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.03)',
        border: `2px solid ${isActive ? colors.active : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '12px',
        color: isActive ? colors.active : '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <span style={{ fontSize: '11px', textAlign: 'center' }}>{name}</span>
      <span
        style={{
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {expression}
      </span>
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: colors.active,
            borderRadius: '50%',
            boxShadow: `0 0 8px ${colors.active}`,
          }}
        />
      )}
    </motion.button>
  );
};

// Performance Monitor Component
interface PerformanceMonitorProps {
  currentParameters: Map<string, number>;
  currentExpressions: string[];
  isModelReady: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  currentParameters,
  currentExpressions,
  isModelReady
}) => {
  const modifiedCount = getModifiedParameterCount(currentParameters);
  const categoryStats = getParameterCountByCategory();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Model Status */}
      <div
        style={{
          padding: '16px',
          backgroundColor: isModelReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isModelReady ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isModelReady ? '#22C55E' : '#EF4444',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: isModelReady ? '#22C55E' : '#EF4444',
              borderRadius: '50%',
              boxShadow: `0 0 10px ${isModelReady ? '#22C55E' : '#EF4444'}`,
            }}
          />
          Model {isModelReady ? 'Ready' : 'Loading'}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
          Aishi (Jellyfish VTuber Model)
        </div>
      </div>

      {/* Statistics */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
        }}
      >
        <h4
          style={{
            color: '#8B5CF6',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Current Statistics
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '8px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Active Expressions:</div>
          <div style={{ color: '#8B5CF6', fontWeight: 'bold', textAlign: 'right' }}>
            {currentExpressions.length}
          </div>

          <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Modified Parameters:</div>
          <div style={{ color: '#8B5CF6', fontWeight: 'bold', textAlign: 'right' }}>{modifiedCount}</div>

          <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Parameters:</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'right' }}>
            {getTotalParameterCount()}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
        }}
      >
        <h4
          style={{
            color: '#8B5CF6',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Parameter Breakdown
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '6px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {Object.entries(categoryStats).map(([category, count]) => (
            <React.Fragment key={category}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{category}:</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'right' }}>{count}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Model Specifications */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
        }}
      >
        <h4
          style={{
            color: '#8B5CF6',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Model Specifications
        </h4>

        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.6',
          }}
        >
          <div>• Texture Resolution: 8192×8192</div>
          <div>• Physics Groups: 50</div>
          <div>• Total Parameters: 127+</div>
          <div>• Expressions: 27</div>
          <div>• Live2D Version: Cubism 4</div>
          <div>• Auto Breathing: ENABLED</div>
          <div>• Auto Blinking: DISABLED</div>
          <div>• Idle Motion: DISABLED</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const CompanionControlPanel: React.FC<CompanionControlPanelProps> = ({
  modelRef,
  isModelReady,
  currentParameters,
  onParameterChange,
  onParameterReset,
  onResetAllParameters,
  currentExpressions
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>('physics');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [paramSearch, setParamSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ParameterCategory>>(
    new Set(['Head Movement', 'Eye Control', 'Mouth'])
  );

  // Expression mappings (from ultrathink analysis)
  const expressionMapping = {
    // Emotions
    love: '爱心眼',
    star: '星星眼',
    angry: '生气',
    cry: '哭哭',
    dark: '黑脸',
    blush: '脸红',
    blank: '空白眼',
    dizzy: '蚊香眼',
    // Accessories
    eyepatch: '眼罩',
    jacket: '外套',
    wings: '翅膀',
    gaming: '游戏机',
    mic: '麦克风',
    tea: '茶杯',
    catEars: '猫耳',
    devil: '恶魔角',
    halo: '光环',
    // Decorations
    flowers: '花花',
    crossPin: '十字发夹',
    linePin: '一字发夹',
    bow: '蝴蝶结',
    // Special FX
    heart: '比心',
    board: '写字板',
    colorChange: '换色',
    touch: '点触',
    watermark: '水印',
    haloColorChange: '光环换色',
    wingsToggle: '翅膀切换'
  };

  // Toggle expression
  const handleToggleExpression = useCallback((expression: string) => {
    if (!modelRef.current) return;
    modelRef.current.toggleExpression(expression);
  }, [modelRef]);

  // Reset all expressions
  const handleResetExpressions = useCallback(() => {
    if (!modelRef.current) return;
    modelRef.current.resetExpression();
  }, [modelRef]);

  // Apply physics preset
  const handleApplyPreset = useCallback((preset: PhysicsPreset) => {
    if (!modelRef.current) return;

    // Reset all expressions first
    modelRef.current.resetExpression();

    // Reset all parameters to defaults
    onResetAllParameters();

    // Apply preset expressions
    preset.expressions.forEach(expr => {
      modelRef.current!.setExpression(expr);
    });

    // Apply preset parameters
    Object.entries(preset.parameters).forEach(([paramId, value]) => {
      onParameterChange(paramId, value);
    });
  }, [modelRef, onResetAllParameters, onParameterChange]);

  // Import state
  const handleImportState = useCallback((state: CompanionState) => {
    if (!modelRef.current) return;

    // Clear current state
    modelRef.current.resetExpression();
    onResetAllParameters();

    // Apply imported expressions
    state.expressions.forEach(expr => {
      modelRef.current!.setExpression(expr);
    });

    // Apply imported parameters
    Object.entries(state.parameters).forEach(([paramId, value]) => {
      onParameterChange(paramId, value);
    });
  }, [modelRef, onResetAllParameters, onParameterChange]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: ParameterCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Filtered parameters for search
  const filteredParameters = useMemo(() => {
    if (!paramSearch) return PARAMETER_DEFINITIONS;

    const search = paramSearch.toLowerCase();
    return Object.fromEntries(
      Object.entries(PARAMETER_DEFINITIONS).filter(([id, def]) =>
        id.toLowerCase().includes(search) ||
        def.label.toLowerCase().includes(search) ||
        def.category.toLowerCase().includes(search) ||
        def.description?.toLowerCase().includes(search)
      )
    );
  }, [paramSearch]);

  // Categorized parameters
  const parametersByCategory = useMemo(() => {
    const categories = getAllCategories();
    const result: Record<ParameterCategory, Array<[string, any]>> = {} as any;

    categories.forEach(category => {
      result[category] = Object.entries(filteredParameters).filter(
        ([_, def]) => def.category === category
      );
    });

    return result;
  }, [filteredParameters]);

  // Tab configuration (using emoji strings, consistent with existing codebase pattern)
  const tabs = [
    { id: 'emotions' as TabType, icon: '💖', label: 'Emotions', count: 8 },
    { id: 'accessories' as TabType, icon: '👔', label: 'Accessories', count: 9 },
    { id: 'decorations' as TabType, icon: '⭐', label: 'Decorations', count: 4 },
    { id: 'special' as TabType, icon: '🎨', label: 'Special FX', count: 7 },
    { id: 'physics' as TabType, icon: '🎚️', label: 'Physics', count: getTotalParameterCount() },
    { id: 'presets' as TabType, icon: '🔖', label: 'Presets', count: 9 },
    { id: 'state' as TabType, icon: '💾', label: 'State', count: 0 },
    { id: 'performance' as TabType, icon: '📊', label: 'Performance', count: 0 }
  ];

  if (!isPanelOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsPanelOpen(true)}
        style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(139, 92, 246, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
        }}
      >
        <FaChevronLeft size={20} />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 420 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 420 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        bottom: '20px',
        width: '420px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        padding: '20px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div>
          <h3
            style={{
              color: '#8B5CF6',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Control Panel
          </h3>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '11px',
              margin: '4px 0 0 0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Aishi Model Testing Environment
          </p>
        </div>

        <button
          onClick={() => setIsPanelOpen(false)}
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <FaChevronRight size={14} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              padding: '10px 8px',
              backgroundColor: currentTab === tab.id ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              border: `1px solid ${currentTab === tab.id ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              color: currentTab === tab.id ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: currentTab === tab.id ? '#8B5CF6' : 'rgba(255, 255, 255, 0.2)',
                    color: currentTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </div>
            <span style={{ fontSize: '9px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* EMOTIONS TAB */}
          {currentTab === 'emotions' && (
            <TabContent key="emotions">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { key: 'love', icon: '💖', name: 'Love Eyes', expr: expressionMapping.love },
                  { key: 'star', icon: '⭐', name: 'Starry Eyes', expr: expressionMapping.star },
                  { key: 'angry', icon: '😠', name: 'Angry', expr: expressionMapping.angry },
                  { key: 'cry', icon: '😭', name: 'Crying', expr: expressionMapping.cry },
                  { key: 'dark', icon: '😑', name: 'Dark Face', expr: expressionMapping.dark },
                  { key: 'blush', icon: '😊', name: 'Blush', expr: expressionMapping.blush },
                  { key: 'blank', icon: '😶', name: 'Blank Eyes', expr: expressionMapping.blank },
                  { key: 'dizzy', icon: '😵', name: 'Dizzy', expr: expressionMapping.dizzy }
                ].map(({ key, icon, name, expr }) => (
                  <ExpressionButton
                    key={key}
                    icon={icon}
                    name={name}
                    expression={expr}
                    isActive={currentExpressions.includes(expr)}
                    onClick={() => handleToggleExpression(expr)}
                  />
                ))}
              </div>
            </TabContent>
          )}

          {/* ACCESSORIES TAB */}
          {currentTab === 'accessories' && (
            <TabContent key="accessories">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { key: 'eyepatch', icon: '😎', name: 'Eyepatch', expr: expressionMapping.eyepatch },
                  { key: 'jacket', icon: '🧥', name: 'Jacket', expr: expressionMapping.jacket },
                  { key: 'wings', icon: '🪶', name: 'Wings', expr: expressionMapping.wings },
                  { key: 'gaming', icon: '🎮', name: 'Gaming', expr: expressionMapping.gaming },
                  { key: 'mic', icon: '🎤', name: 'Microphone', expr: expressionMapping.mic },
                  { key: 'tea', icon: '☕', name: 'Tea Cup', expr: expressionMapping.tea },
                  { key: 'catEars', icon: '🐱', name: 'Cat Ears', expr: expressionMapping.catEars },
                  { key: 'devil', icon: '😈', name: 'Devil Horns', expr: expressionMapping.devil },
                  { key: 'halo', icon: '😇', name: 'Halo', expr: expressionMapping.halo }
                ].map(({ key, icon, name, expr }) => (
                  <ExpressionButton
                    key={key}
                    icon={icon}
                    name={name}
                    expression={expr}
                    isActive={currentExpressions.includes(expr)}
                    onClick={() => handleToggleExpression(expr)}
                    variant="accessory"
                  />
                ))}
              </div>
            </TabContent>
          )}

          {/* DECORATIONS TAB */}
          {currentTab === 'decorations' && (
            <TabContent key="decorations">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { key: 'flowers', icon: '🌸', name: 'Flowers', expr: expressionMapping.flowers },
                  { key: 'crossPin', icon: '✖️', name: 'Cross Pin', expr: expressionMapping.crossPin },
                  { key: 'linePin', icon: '➖', name: 'Line Pin', expr: expressionMapping.linePin },
                  { key: 'bow', icon: '🎀', name: 'Bow', expr: expressionMapping.bow }
                ].map(({ key, icon, name, expr }) => (
                  <ExpressionButton
                    key={key}
                    icon={icon}
                    name={name}
                    expression={expr}
                    isActive={currentExpressions.includes(expr)}
                    onClick={() => handleToggleExpression(expr)}
                    variant="decoration"
                  />
                ))}
              </div>
            </TabContent>
          )}

          {/* SPECIAL FX TAB */}
          {currentTab === 'special' && (
            <TabContent key="special">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { key: 'heart', icon: '💝', name: 'Heart Gesture', expr: expressionMapping.heart },
                  { key: 'board', icon: '📝', name: 'Writing Board', expr: expressionMapping.board },
                  { key: 'colorChange', icon: '🎨', name: 'Color Shift', expr: expressionMapping.colorChange },
                  { key: 'touch', icon: '👆', name: 'Touch Effect', expr: expressionMapping.touch },
                  { key: 'watermark', icon: '💧', name: 'Watermark', expr: expressionMapping.watermark },
                  { key: 'haloColor', icon: '🌈', name: 'Halo Color', expr: expressionMapping.haloColorChange },
                  { key: 'wingsToggle', icon: '🦋', name: 'Wings Toggle', expr: expressionMapping.wingsToggle }
                ].map(({ key, icon, name, expr }) => (
                  <ExpressionButton
                    key={key}
                    icon={icon}
                    name={name}
                    expression={expr}
                    isActive={currentExpressions.includes(expr)}
                    onClick={() => handleToggleExpression(expr)}
                    variant="special"
                  />
                ))}
              </div>
            </TabContent>
          )}

          {/* PHYSICS PARAMETERS TAB */}
          {currentTab === 'physics' && (
            <TabContent key="physics">
              {/* Search Box */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <FaSearch size={14} color="rgba(255, 255, 255, 0.5)" />
                  <input
                    type="text"
                    placeholder="Search parameters..."
                    value={paramSearch}
                    onChange={(e) => setParamSearch(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                  />
                  {paramSearch && (
                    <button
                      onClick={() => setParamSearch('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              {/* Parameters by Category */}
              {getAllCategories().map(category => {
                const params = parametersByCategory[category];
                if (!params || params.length === 0) return null;

                const isExpanded = expandedCategories.has(category);
                const categoryCount = params.length;

                return (
                  <div key={category} style={{ marginBottom: '12px' }}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: isExpanded ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '8px',
                        color: '#8B5CF6',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: "'JetBrains Mono', monospace",
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isExpanded ? '8px' : 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>
                        {isExpanded ? '▼' : '▶'} {category}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        {categoryCount} params
                      </span>
                    </button>

                    {/* Category Parameters */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {params.map(([paramId, definition]) => (
                          <ParameterSlider
                            key={paramId}
                            parameterId={paramId}
                            definition={definition}
                            currentValue={currentParameters.get(paramId) || definition.default}
                            onChange={(value) => onParameterChange(paramId, value)}
                            onReset={() => onParameterReset(paramId)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* No results message */}
              {Object.keys(filteredParameters).length === 0 && (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}
                >
                  No parameters found matching "{paramSearch}"
                </div>
              )}
            </TabContent>
          )}

          {/* PRESETS TAB */}
          {currentTab === 'presets' && (
            <TabContent key="presets">
              <PhysicsPresetsLibrary
                onApplyPreset={handleApplyPreset}
                onSaveCustomPreset={(name, desc) => {}}
                currentParameters={currentParameters}
                currentExpressions={currentExpressions}
              />
            </TabContent>
          )}

          {/* STATE MANAGER TAB */}
          {currentTab === 'state' && (
            <TabContent key="state">
              <StateManager
                currentParameters={currentParameters}
                currentExpressions={currentExpressions}
                onImportState={handleImportState}
                onResetAll={onResetAllParameters}
                modelPath="/水母_vts/水母.model3.json"
              />
            </TabContent>
          )}

          {/* PERFORMANCE TAB */}
          {currentTab === 'performance' && (
            <TabContent key="performance">
              <PerformanceMonitor
                currentParameters={currentParameters}
                currentExpressions={currentExpressions}
                isModelReady={isModelReady}
              />
            </TabContent>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </motion.div>
  );
};
