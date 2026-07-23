'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, 
  FaSmile, 
  FaVolumeUp, 
  FaMouse, 
  FaEye,
  FaRandom,
  FaStop,
  FaSyncAlt,
  FaGlasses,
  FaTshirt,
  FaHeart,
  FaStar,
  FaPalette,
  FaCat,
  FaTimes
} from 'react-icons/fa';
import type { Live2DTestControlsProps, Live2DModelRef, JellyfishModelExpressions, PhonemeMapping } from './utils/live2d-types';
import { EXPRESSION_CATEGORIES, EXPRESSION_PRESETS } from './utils/expression-categories';

export const Live2DTestControls: React.FC<Live2DTestControlsProps> = ({
  modelRef,
  availableMotions,
  availableExpressions,
  showPerformance = true,
}) => {
  const [selectedMotion, setSelectedMotion] = useState('');
  const [selectedExpression, setSelectedExpression] = useState('');
  const [lipSyncValue, setLipSyncValue] = useState(0);
  const [isLipSyncActive, setIsLipSyncActive] = useState(false);
  const [currentTab, setCurrentTab] = useState<'emotions' | 'accessories' | 'decorations' | 'lipsync' | 'physics' | 'special' | 'presets'>('emotions');
  const [isOpen, setIsOpen] = useState(true);
  const [activeExpressions, setActiveExpressions] = useState<string[]>([]);
  // Expression mappings for 水母_vts model
  const expressionMapping: JellyfishModelExpressions = {
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
    // Special
    heart: '比心',
    board: '写字板',
    colorChange: '换色',
    touch: '点触',
    watermark: '水印',
    // Additional variants
    haloColorChange: '光环换色',
    wingsToggle: '翅膀切换',
  };

  // Update active expressions from model
  useEffect(() => {
    if (modelRef.current) {
      const updateActiveExpressions = () => {
        const active = modelRef.current!.getActiveExpressions();
        setActiveExpressions(active);
      };
      updateActiveExpressions();
      // Poll for changes
      const interval = setInterval(updateActiveExpressions, 500);
      return () => clearInterval(interval);
    }
  }, [modelRef]);
  const [mouthFormValue, setMouthFormValue] = useState(0);
  // Advanced LipSync with phoneme mapping
  const phonemeMapping: Record<string, PhonemeMapping> = {
    'A': { openY: 0.8, form: 0.2 },
    'I': { openY: 0.3, form: -0.5 },
    'U': { openY: 0.4, form: 0.8 },
    'E': { openY: 0.5, form: -0.3 },
    'O': { openY: 0.6, form: 0.6 },
  };

  // Play motion
  const handlePlayMotion = useCallback((motionGroup: string) => {
    if (modelRef.current) {
      modelRef.current.playMotion(motionGroup);
      setSelectedMotion(motionGroup);
    }
  }, [modelRef]);

  // Toggle expression using category system
  const handleToggleExpression = useCallback((expression: string) => {
    if (modelRef.current) {
      const isActive = modelRef.current.toggleExpression(expression);
      if (!isActive) {
        if (selectedExpression === expression) {
          setSelectedExpression('');
        }
      } else {
        // For exclusive categories, update selected expression
        const category = Object.values(EXPRESSION_CATEGORIES).find(cat => 
          cat.expressions.includes(expression) && cat.mode === 'exclusive'
        );
        if (category) {
          setSelectedExpression(expression);
        }
      }
    }
  }, [modelRef, selectedExpression]);

  // Reset expression
  const handleResetExpression = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.resetExpression();
      setSelectedExpression('');
    }
  }, [modelRef]);

  // Apply form preset
  const handleApplyPreset = useCallback((presetName: keyof typeof EXPRESSION_PRESETS) => {
    if (modelRef.current) {
      modelRef.current.applyFormPreset(presetName);
      setSelectedExpression('');
    }
  }, [modelRef]);

  // Stop all motions
  const handleStopMotions = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.stopAllMotions();
      setSelectedMotion('');
    }
  }, [modelRef]);

  // Advanced lip sync with mouth form
  const handleLipSyncChange = useCallback((value: number, formValue?: number) => {
    setLipSyncValue(value);
    if (modelRef.current) {
      modelRef.current.setLipSyncValue(value);
      if (formValue !== undefined) {
        setMouthFormValue(formValue);
        modelRef.current.setParameterValue('ParamMouthForm', formValue);
      }
    }
  }, [modelRef]);

  // Toggle advanced lip sync with phoneme simulation
  const toggleLipSync = useCallback(() => {
    if (modelRef.current) {
      if (!isLipSyncActive) {
        setIsLipSyncActive(true);
        // Simulate talking with phonemes
        const phonemes = ['A', 'I', 'U', 'E', 'O'];
        let index = 0;
        
        const interval = setInterval(() => {
          const phoneme = phonemes[index % phonemes.length];
          const mapping = phonemeMapping[phoneme];
          
          // Apply smooth transition
          const transition = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
          
          setLipSyncValue(mapping.openY * transition);
          setMouthFormValue(mapping.form);
          
          if (modelRef.current) {
            modelRef.current.setLipSyncValue(mapping.openY * transition);
            modelRef.current.setParameterValue('ParamMouthForm', mapping.form);
          }
          
          if (Math.random() > 0.85) index++; // Random phoneme changes
        }, 100);
        
        // Store interval ID for cleanup
        (window as any).__lipSyncInterval = interval;
      } else {
        setIsLipSyncActive(false);
        if ((window as any).__lipSyncInterval) {
          clearInterval((window as any).__lipSyncInterval);
        }
        modelRef.current.stopLipSync();
        modelRef.current.setParameterValue('ParamMouthForm', 0);
        setLipSyncValue(0);
        setMouthFormValue(0);
      }
    }
  }, [modelRef, isLipSyncActive, phonemeMapping]);

  // Test hit areas
  const handleTestHit = useCallback(() => {
    if (modelRef.current) {
      // Simulate random hit
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      modelRef.current.hit(x, y);
    }
  }, [modelRef]);

  const tabStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.3s ease',
    borderRadius: '8px',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    color: '#8B5CF6',
  };

  const scrollbarStyles = `
    <style>
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
    </style>
  `;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '8px',
            color: '#8B5CF6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(10px)',
          }}
        >
          <FaPlay size={16} />
        </motion.button>
      )}

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              bottom: '20px',
              width: '320px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '20px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
      {/* Header */}
      <div style={{
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <h3 style={{
            color: '#8B5CF6',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
          }}>
            Live2D Controls
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          >
            <FaTimes size={14} />
          </button>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleStopMotions}
            style={{
              ...tabStyle,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            <FaStop size={12} style={{ marginRight: '4px' }} />
            Stop
          </button>
          <button
            onClick={handleResetExpression}
            style={{
              ...tabStyle,
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22C55E',
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            <FaSyncAlt size={12} style={{ marginRight: '4px' }} />
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '8px',
      }}>
        <button
          onClick={() => setCurrentTab('emotions')}
          style={currentTab === 'emotions' ? activeTabStyle : tabStyle}
        >
          <FaHeart style={{ marginRight: '4px' }} />
          Emotions
        </button>
        <button
          onClick={() => setCurrentTab('accessories')}
          style={currentTab === 'accessories' ? activeTabStyle : tabStyle}
        >
          <FaTshirt style={{ marginRight: '4px' }} />
          Accessories
        </button>
        <button
          onClick={() => setCurrentTab('decorations')}
          style={currentTab === 'decorations' ? activeTabStyle : tabStyle}
        >
          <FaStar style={{ marginRight: '4px' }} />
          Decorations
        </button>
        <button
          onClick={() => setCurrentTab('lipsync')}
          style={currentTab === 'lipsync' ? activeTabStyle : tabStyle}
        >
          <FaVolumeUp style={{ marginRight: '4px' }} />
          Advanced LipSync
        </button>
        <button
          onClick={() => setCurrentTab('physics')}
          style={currentTab === 'physics' ? activeTabStyle : tabStyle}
        >
          <FaEye style={{ marginRight: '4px' }} />
          Physics Debug
        </button>
        <button
          onClick={() => setCurrentTab('special')}
          style={currentTab === 'special' ? activeTabStyle : tabStyle}
        >
          <FaPalette style={{ marginRight: '4px' }} />
          Special FX
        </button>
        <button
          onClick={() => setCurrentTab('presets')}
          style={currentTab === 'presets' ? activeTabStyle : tabStyle}
        >
          <FaStar style={{ marginRight: '4px' }} />
          Form Presets
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        marginTop: '16px',
      }}>
      <AnimatePresence mode="wait">
        {currentTab === 'emotions' && (
          <motion.div
            key="emotions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px',
            }}>
              {Object.entries({
                love: { icon: '💖', name: 'Love' },
                star: { icon: '⭐', name: 'Starry' },
                angry: { icon: '😠', name: 'Angry' },
                cry: { icon: '😭', name: 'Crying' },
                dark: { icon: '😑', name: 'Dark' },
                blush: { icon: '😊', name: 'Blush' },
                blank: { icon: '😶', name: 'Blank' },
                dizzy: { icon: '😵', name: 'Dizzy' },
              }).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleToggleExpression(expressionMapping[key as keyof JellyfishModelExpressions])}
                  style={{
                    padding: '12px',
                    backgroundColor: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])
                      ? 'rgba(139, 92, 246, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    color: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#8B5CF6' : '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{value.icon}</span>
                  <span style={{ fontSize: '11px' }}>{value.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'accessories' && (
          <motion.div
            key="accessories"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px',
            }}>
              {Object.entries({
                eyepatch: { icon: <FaGlasses />, name: 'Eyepatch' },
                jacket: { icon: <FaTshirt />, name: 'Jacket' },
                wings: { icon: '🪶', name: 'Wings' },
                gaming: { icon: '🎮', name: 'Gaming' },
                mic: { icon: '🎤', name: 'Microphone' },
                tea: { icon: '☕', name: 'Tea Cup' },
                catEars: { icon: <FaCat />, name: 'Cat Ears' },
                devil: { icon: '😈', name: 'Devil Horns' },
                halo: { icon: '😇', name: 'Halo' },
              }).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleToggleExpression(expressionMapping[key as keyof JellyfishModelExpressions])}
                  style={{
                    padding: '12px',
                    backgroundColor: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])
                      ? 'rgba(34, 197, 94, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#22C55E' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    color: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#22C55E' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{typeof value.icon === 'string' ? value.icon : value.icon}</span>
                  <span style={{ fontSize: '11px' }}>{value.name}</span>
                  {activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) && 
                    <span style={{ fontSize: '10px', color: '#22C55E' }}>Active</span>
                  }
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'decorations' && (
          <motion.div
            key="decorations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}>
              {Object.entries({
                flowers: { icon: '🌸', name: 'Flowers' },
                crossPin: { icon: '✖️', name: 'Cross Pin' },
                linePin: { icon: '➖', name: 'Line Pin' },
                bow: { icon: '🎀', name: 'Bow' },
              }).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleToggleExpression(expressionMapping[key as keyof JellyfishModelExpressions])}
                  style={{
                    padding: '12px',
                    backgroundColor: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])
                      ? 'rgba(251, 191, 36, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#FBBf24' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    color: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#FBBf24' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{value.icon}</span>
                  <span style={{ fontSize: '11px' }}>{value.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'lipsync' && (
          <motion.div
            key="lipsync"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <button
                onClick={toggleLipSync}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isLipSyncActive 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : 'rgba(34, 197, 94, 0.2)',
                  border: `2px solid ${isLipSyncActive ? '#EF4444' : '#22C55E'}`,
                  borderRadius: '8px',
                  color: isLipSyncActive ? '#EF4444' : '#22C55E',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FaVolumeUp />
                {isLipSyncActive ? 'Stop Lip Sync' : 'Start Lip Sync'}
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    color: '#fff',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Mouth Open: {Math.round(lipSyncValue * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lipSyncValue * 100}
                    onChange={(e) => handleLipSyncChange(Number(e.target.value) / 100)}
                    disabled={isLipSyncActive}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                      cursor: isLipSyncActive ? 'not-allowed' : 'pointer',
                      opacity: isLipSyncActive ? 0.5 : 1,
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{
                    color: '#fff',
                    fontSize: '14px',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Mouth Form: {Math.round(mouthFormValue * 100)}%
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={mouthFormValue * 100}
                    onChange={(e) => handleLipSyncChange(lipSyncValue, Number(e.target.value) / 100)}
                    disabled={isLipSyncActive}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                      cursor: isLipSyncActive ? 'not-allowed' : 'pointer',
                      opacity: isLipSyncActive ? 0.5 : 1,
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#999',
              }}>
                <p style={{ margin: '0 0 8px 0' }}>Phoneme Mapping:</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(phonemeMapping).map(([phoneme, mapping]) => (
                    <button
                      key={phoneme}
                      onClick={() => handleLipSyncChange(mapping.openY, mapping.form)}
                      disabled={isLipSyncActive}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid #8B5CF6',
                        borderRadius: '6px',
                        color: '#8B5CF6',
                        cursor: isLipSyncActive ? 'not-allowed' : 'pointer',
                        opacity: isLipSyncActive ? 0.5 : 1,
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      {phoneme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'physics' && (
          <motion.div
            key="physics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleTestHit}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8B5CF6',
                    borderRadius: '8px',
                    color: '#8B5CF6',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <FaMouse />
                  Test Hit Areas
                </button>
                
                <button
                  onClick={() => {
                    if (modelRef.current) {
                      const x = Math.random() * 2 - 1;
                      const y = Math.random() * 2 - 1;
                      const z = Math.random() * 2 - 1;
                      modelRef.current.setParameterValue('ParamAngleX', x * 30);
                      modelRef.current.setParameterValue('ParamAngleY', y * 30);
                      modelRef.current.setParameterValue('ParamAngleZ', z * 10);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid #22C55E',
                    borderRadius: '8px',
                    color: '#22C55E',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <FaRandom />
                  Random Physics
                </button>
              </div>
              
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#999',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#8B5CF6', fontWeight: 'bold' }}>水母 Model Physics (50 Groups):</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  <div>
                    <strong>Core Parameters:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '11px' }}>
                      <li>ParamAngleX/Y/Z - Head rotation</li>
                      <li>ParamBodyAngleX/Y/Z - Body rotation</li>
                      <li>ParamEyeBallX/Y - Eye tracking</li>
                      <li>ParamBrowLY/RY - Eyebrow movement</li>
                      <li>ParamMouthOpenY/Form - Mouth control</li>
                      <li>ParamBreath - Breathing effect</li>
                      <li>ParamCheek - Cheek puffing</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Physics Groups:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '11px' }}>
                      <li>Hair physics (multiple strands)</li>
                      <li>Jellyfish tentacles</li>
                      <li>Clothing physics</li>
                      <li>Accessory physics</li>
                      <li>Wing movement</li>
                      <li>Halo floating</li>
                      <li>600+ mesh deformers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'special' && (
          <motion.div
            key="special"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}>
              {Object.entries({
                heart: { icon: '💝', name: 'Heart Gesture' },
                board: { icon: '📝', name: 'Writing Board' },
                colorChange: { icon: '🎨', name: 'Color Shift' },
                touch: { icon: '👆', name: 'Touch Effect' },
                watermark: { icon: '💧', name: 'Watermark' },
                haloColorChange: { icon: '🌈', name: 'Halo Color' },
                wingsToggle: { icon: '🦋', name: 'Wings Toggle' },
              }).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleToggleExpression(expressionMapping[key as keyof JellyfishModelExpressions])}
                  style={{
                    padding: '12px',
                    backgroundColor: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions])
                      ? 'rgba(168, 85, 247, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#A855F7' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    color: activeExpressions.includes(expressionMapping[key as keyof JellyfishModelExpressions]) ? '#A855F7' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{value.icon}</span>
                  <span style={{ fontSize: '10px', textAlign: 'center' }}>{value.name}</span>
                </button>
              ))}
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#999',
            }}>
              <p style={{ margin: '0 0 8px 0', color: '#A855F7', fontWeight: 'bold' }}>Special Effects Features:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
                <li><strong>Heart Gesture:</strong> Cute hand gesture with heart effects</li>
                <li><strong>Writing Board:</strong> Interactive whiteboard prop for expressions</li>
                <li><strong>Color Shift:</strong> Dynamic color changing effects</li>
                <li><strong>Touch Effect:</strong> Visual feedback for interactions</li>
                <li><strong>Watermark:</strong> Subtle branding overlay effect</li>
              </ul>
            </div>
          </motion.div>
        )}

        {currentTab === 'presets' && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <h4 style={{
                color: '#8B5CF6',
                fontSize: '14px',
                margin: '0 0 12px 0',
                textAlign: 'center',
              }}>
                Character Form Presets
              </h4>
              
              {/* Angel Preset */}
              <button
                onClick={() => handleApplyPreset('angel')}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  border: '2px solid #FFD700',
                  borderRadius: '12px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                }}
              >
                <span style={{ fontSize: '24px' }}>😇</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Angel Form</span>
                <span style={{ fontSize: '11px', textAlign: 'center', opacity: 0.8 }}>
                  Halo + White Wings + Pure Colors
                </span>
              </button>

              {/* Devil Preset */}
              <button
                onClick={() => handleApplyPreset('devil')}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(220, 38, 127, 0.2)',
                  border: '2px solid #DC267F',
                  borderRadius: '12px',
                  color: '#DC267F',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 127, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 127, 0.2)';
                }}
              >
                <span style={{ fontSize: '24px' }}>😈</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Devil Form</span>
                <span style={{ fontSize: '11px', textAlign: 'center', opacity: 0.8 }}>
                  Devil Horns + Black Wings + Dark Colors
                </span>
              </button>

              {/* Neutral Preset */}
              <button
                onClick={() => handleApplyPreset('neutral')}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(107, 114, 128, 0.2)',
                  border: '2px solid #6B7280',
                  borderRadius: '12px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.2)';
                }}
              >
                <span style={{ fontSize: '24px' }}>🧘</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Neutral Form</span>
                <span style={{ fontSize: '11px', textAlign: 'center', opacity: 0.8 }}>
                  Remove All Form-Specific Elements
                </span>
              </button>

              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#999',
                marginTop: '8px',
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#8B5CF6', fontWeight: 'bold' }}>Active Expressions:</p>
                {activeExpressions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {activeExpressions.map((expr, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#8B5CF6',
                      }}>
                        {expr}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>No expressions active</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};