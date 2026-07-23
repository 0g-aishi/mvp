'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTshirt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiCrosshair } from 'react-icons/gi';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';

interface ClothingControlProps {
  modelRef: React.RefObject<Live2DModelRef>;
  enhancedMode?: boolean;
  onEnhancedModeChange?: (enabled: boolean) => void;
}

interface ClothingOption {
  name: string;
  expression: string;
  icon: string;
  description: string;
}

const CLOTHING_OPTIONS: ClothingOption[] = [
  { name: 'Jacket', expression: '外套', icon: '🧥', description: 'Toggle jacket on/off' },
  { name: 'Wings', expression: '翅膀', icon: '🪽', description: 'Show white wings' },
  { name: 'Cat Ears', expression: '猫耳', icon: '🐱', description: 'Show cat ears' },
  { name: 'Halo', expression: '光环', icon: '😇', description: 'Show angel halo' },
  { name: 'Devil Horns', expression: '恶魔角', icon: '😈', description: 'Show devil horns' },
  { name: 'Tea Cup', expression: '茶杯', icon: '🍵', description: 'Hold tea cup' },
  { name: 'Microphone', expression: '麦克风', icon: '🎤', description: 'Hold microphone' },
  { name: 'Gaming', expression: '游戏机', icon: '🎮', description: 'Hold game controller' },
];

export const ClothingControl: React.FC<ClothingControlProps> = ({
  modelRef,
  enhancedMode = false,
  onEnhancedModeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeExpressions, setActiveExpressions] = useState<Set<string>>(new Set());

  const toggleExpression = (expression: string) => {
    if (!modelRef.current) return;

    const isActive = activeExpressions.has(expression);

    modelRef.current.toggleExpression(expression);

    setActiveExpressions(prev => {
      const updated = new Set(prev);
      if (isActive) {
        updated.delete(expression);
      } else {
        updated.add(expression);
      }
      return updated;
    });
  };

  return (
    <div style={{ position: 'fixed', top: '100px', right: '20px', zIndex: 60 }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 20px',
          backgroundColor: isOpen ? '#8B5CF6' : 'rgba(26, 26, 26, 0.9)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOpen ? '#8B5CF6' : 'rgba(255, 255, 255, 0.2)'}`,
          borderRadius: '12px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: "'JetBrains Mono', monospace",
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 4px 16px rgba(139, 92, 246, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
          }
        }}
      >
        <FaTshirt size={16} />
        Clothing
        {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '280px',
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Options grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Enhanced Mode Toggle (Special Feature) */}
              <button
                onClick={() => onEnhancedModeChange?.(!enhancedMode)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: enhancedMode
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${enhancedMode ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  boxShadow: enhancedMode ? '0 0 16px rgba(139, 92, 246, 0.4)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!enhancedMode) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!enhancedMode) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <GiCrosshair
                  size={20}
                  color={enhancedMode ? '#A78BFA' : '#fff'}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px', color: enhancedMode ? '#A78BFA' : '#fff' }}>
                    Enhanced Mode
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {enhancedMode ? 'Character follows cursor' : 'Enable cursor following'}
                  </div>
                </div>
                {enhancedMode && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#8B5CF6',
                      boxShadow: '0 0 12px #8B5CF6',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </button>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  margin: '4px 0',
                }}
              />

              {/* Clothing Items */}
              {CLOTHING_OPTIONS.map(option => {
                const isActive = activeExpressions.has(option.expression);

                return (
                  <button
                    key={option.expression}
                    onClick={() => toggleExpression(option.expression)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isActive
                        ? 'rgba(139, 92, 246, 0.3)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isActive ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{option.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                        {option.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {option.description}
                      </div>
                    </div>
                    {isActive && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#8B5CF6',
                          boxShadow: '0 0 8px #8B5CF6',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Active: {activeExpressions.size} items
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
