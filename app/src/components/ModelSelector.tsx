'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Cloud, Check, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { breakpoints, touchTargets } from '../utils/responsive';

export interface Model {
  id: string;
  name: string;
  type: 'decentralized' | 'centralized';
  provider: string;
  verifiability?: string;
  inputPrice?: string;
  outputPrice?: string;
  available: boolean;
  badge?: string | null;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  isLoading?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  isLoading = false
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.sm);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentModel = selectedModel === 'auto' 
    ? { name: 'Auto-select best model', type: 'auto' as any }
    : models.find(m => m.id === selectedModel) || { name: 'Select a model', type: 'auto' as any };

  const decentralizedModels = models.filter(m => m.type === 'decentralized');
  const centralizedModels = models.filter(m => m.type === 'centralized');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          backgroundColor: isOpen ? theme.bg.panel : theme.bg.card,
          color: theme.text.primary,
          cursor: isLoading ? 'wait' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          minWidth: '200px',
          justifyContent: 'space-between',
          opacity: isLoading ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.borderColor = theme.accent.primary;
            e.currentTarget.style.backgroundColor = theme.bg.panel;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.backgroundColor = isOpen ? theme.bg.panel : theme.bg.card;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentModel.type === 'decentralized' ? (
            <Cpu size={16} color={theme.accent.primary} />
          ) : currentModel.type === 'centralized' ? (
            <Cloud size={16} color={theme.accent.primary} />
          ) : (
            <img 
              src="/logo_clean.png" 
              alt="Aishi AI" 
              style={{ 
                width: '16px', 
                height: '16px',
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
            />
          )}
          <span style={{ fontSize: '13px' }}>
            {isLoading ? 'Loading models...' : currentModel.name}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && !isLoading && (
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                animation: 'fadeIn 0.2s ease'
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '50%' : 'calc(100% + 8px)',
            left: isMobile ? '50%' : 0,
            transform: isMobile ? 'translate(-50%, -50%)' : 'none',
            width: isMobile ? 'calc(100vw - 32px)' : 'auto',
            minWidth: isMobile ? 'auto' : '380px',
            maxWidth: isMobile ? '400px' : '480px',
            backgroundColor: theme.bg.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius.lg,
            boxShadow: isMobile 
              ? '0 20px 60px rgba(0,0,0,0.3)' 
              : '0 10px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 1000,
            animation: isMobile ? 'scaleIn 0.3s ease' : 'slideDown 0.2s ease'
          }}>
          {/* Auto-select option */}
          <div style={{ padding: '8px' }}>
            <div
              onClick={() => {
                onModelChange('auto');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: selectedModel === 'auto' ? theme.bg.card : 'transparent',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                if (selectedModel !== 'auto') {
                  e.currentTarget.style.backgroundColor = theme.bg.card;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModel !== 'auto') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src="/logo_clean.png" 
                  alt="Aishi AI" 
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} 
                />
                <span style={{ fontSize: '13px', fontWeight: selectedModel === 'auto' ? '600' : '400' }}>
                  Auto-select best model
                </span>
              </div>
              {selectedModel === 'auto' && <Check size={14} color={theme.accent.primary} />}
            </div>
          </div>

          {/* Decentralized Models */}
          <div style={{ borderTop: `1px solid ${theme.border}` }}>
            <div style={{ padding: '8px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 8px 4px 8px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: theme.text.secondary,
                  letterSpacing: '0.5px'
                }}>
                  Decentralized
                </span>
                <img 
                  src="/og.png" 
                  alt="0G Network" 
                  style={{
                    height: '16px',
                    width: 'auto',
                    opacity: 0.9
                  }}
                />
              </div>
              {decentralizedModels.length > 0 ? (
                decentralizedModels.map(model => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    theme={theme}
                  />
                ))
              ) : (
                <div style={{
                  padding: '12px 12px 8px 12px',
                  textAlign: 'center',
                  color: theme.text.secondary,
                  fontSize: '12px',
                  fontStyle: 'italic',
                  opacity: 0.8
                }}>
                  No models available
                </div>
              )}
            </div>
          </div>

          {/* Centralized Models */}
          {centralizedModels.length > 0 && (
            <div style={{ borderTop: `1px solid ${theme.border}` }}>
              <div style={{ padding: '8px' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 8px 4px 8px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: theme.text.secondary,
                    letterSpacing: '0.5px'
                  }}>
                    Centralized
                  </span>
                </div>
                {centralizedModels.map(model => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Info footer */}
          <div style={{
            borderTop: `1px solid ${theme.border}`,
            padding: isMobile ? '12px 16px' : '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            backgroundColor: theme.bg.card,
            opacity: 0.8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={12} color={theme.text.secondary} />
              <span style={{ fontSize: '11px', color: theme.text.secondary }}>
                Models refresh every 5 minutes
              </span>
            </div>
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color={theme.text.secondary} />
              </button>
            )}
          </div>
        </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Model Option Component
const ModelOption: React.FC<{
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
}> = ({ model, isSelected, onSelect, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.sm);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto',
        gap: '12px',
        alignItems: 'center',
        padding: isMobile ? '14px 16px' : '12px 16px',
        minHeight: isMobile ? `${touchTargets.comfortable}px` : 'auto',
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        backgroundColor: isSelected ? theme.bg.card : (isHovered ? theme.bg.card : 'transparent'),
        transition: theme.effects.transitions.fast,
        transform: isHovered && !isMobile ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      {/* Icon Column - Fixed Width */}
      <div style={{ 
        width: '20px', 
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {model.type === 'decentralized' ? (
          <Cpu size={16} color={theme.accent.primary} />
        ) : (
          <Cloud size={16} color={theme.accent.primary} />
        )}
      </div>
      
      {/* Text Column - Flexible */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2px',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        <span style={{ 
          fontSize: isMobile ? '14px' : '13px', 
          fontWeight: isSelected ? '600' : '400',
          color: theme.text.primary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {model.name}
        </span>
        {model.verifiability && model.verifiability !== 'none' && (
          <span style={{ 
            fontSize: '10px', 
            color: theme.text.secondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {model.verifiability}
          </span>
        )}
      </div>
      
      {/* Actions Column - Auto Width */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        flexShrink: 0
      }}>
        {model.badge && (
          <span style={{
            padding: '3px 8px',
            borderRadius: theme.radius.sm,
            fontSize: '10px',
            fontWeight: '600',
            backgroundColor: model.badge === 'Verified' ? theme.accent.success : theme.accent.primary,
            color: '#ffffff',
            whiteSpace: 'nowrap'
          }}>
            {model.badge}
          </span>
        )}
        {!model.available && (
          <AlertCircle size={16} color={theme.accent.error} />
        )}
        {isSelected && (
          <Check size={16} color={theme.accent.primary} />
        )}
      </div>
    </div>
  );
};

export default ModelSelector;