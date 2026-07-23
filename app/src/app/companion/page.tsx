'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaExpand, FaCompress } from 'react-icons/fa';
import { Live2DModel } from '@/components/live2d/Live2DModel';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { CompanionControlPanel } from '@/components/companion/CompanionControlPanel';
import { PARAMETER_DEFINITIONS } from '@/components/companion/ParameterDefinitions';
import { Toaster } from 'react-hot-toast';
import { logger } from '@/lib/logger';

export default function CompanionPreview() {
  const log = logger.child({ component: 'CompanionPreview' });
  const router = useRouter();
  const modelRef = useRef<Live2DModelRef>(null);

  // Window and layout state
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Model state
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Parameter state (all 127+ parameters)
  const [allParameters, setAllParameters] = useState<Map<string, number>>(new Map());

  // Expression state
  const [activeExpressions, setActiveExpressions] = useState<string[]>([]);

  // Performance metrics state
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);

  // Zoom & Pan state
  const [currentScale, setCurrentScale] = useState(0.4);
  const [modelPosition, setModelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; modelX: number; modelY: number } | null>(null);

  // Auto-save ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Model load handler
  const handleModelLoad = useCallback(() => {
    if (!modelRef.current) return;

    setIsModelReady(true);
    setIsLoading(false);

    try {
      const model = modelRef.current.getModel();
      if (!model) return;

      // CRITICAL: Disable auto blinking for manual control
      if (model.internalModel.eyeBlink) {
        model.internalModel.eyeBlink = null;
        log.debug('Auto blinking DISABLED for manual control');
      }

      // CRITICAL: Stop idle motion for static testing
      modelRef.current.stopAllMotions();
      log.debug('Idle motion STOPPED for static testing');

      // Keep auto breathing ENABLED (user preference)
      // ParamBreath will oscillate automatically via physics
      log.debug('Auto breathing ENABLED (physics-driven)');

      // Initialize parameter state from model's current values
      const paramMap = new Map<string, number>();

      Object.keys(PARAMETER_DEFINITIONS).forEach(paramId => {
        try {
          const currentValue = modelRef.current!.getParameterValue(paramId);
          paramMap.set(paramId, currentValue);
        } catch (error) {
          // Parameter might not exist in model, use default
          const def = PARAMETER_DEFINITIONS[paramId];
          paramMap.set(paramId, def.default);
        }
      });

      setAllParameters(paramMap);

      // Try to load auto-saved state
      const autoSaved = localStorage.getItem('companion_autosave');
      if (autoSaved) {
        try {
          const savedState = JSON.parse(autoSaved);
          log.debug('Found auto-saved state, restoring...');

          // Restore parameters
          Object.entries(savedState.parameters || {}).forEach(([paramId, value]) => {
            if (typeof value === 'number' && PARAMETER_DEFINITIONS[paramId]) {
              modelRef.current!.setParameterValue(paramId, value);
              paramMap.set(paramId, value);
            }
          });

          // Restore expressions
          if (Array.isArray(savedState.expressions)) {
            savedState.expressions.forEach((expr: string) => {
              modelRef.current!.setExpression(expr);
            });
          }

          setAllParameters(new Map(paramMap));
          log.debug('Auto-saved state restored');
        } catch (error) {
          log.error('Failed to restore auto-saved state', { error });
        }
      }

      log.debug('Model initialized successfully', {
        totalParams: paramMap.size,
        autoBreathing: true,
        autoBlinking: false,
        idleMotion: false
      });

    } catch (error) {
      log.error('Error in model initialization', { error });
    }
  }, []);

  // Model error handler
  const handleModelError = useCallback((error: string) => {
    setModelError(error);
    setIsLoading(false);
    log.error('Live2D model error', { error });
  }, []);

  // Parameter change handler (live updates!)
  const handleParameterChange = useCallback((parameterId: string, value: number) => {
    if (!modelRef.current) return;

    // Update model IMMEDIATELY (live mode!)
    modelRef.current.setParameterValue(parameterId, value);

    // Update local state
    setAllParameters(prev => {
      const newMap = new Map(prev);
      newMap.set(parameterId, value);
      return newMap;
    });

    // Debounced auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);
  }, []);

  // Parameter reset handler
  const handleParameterReset = useCallback((parameterId: string) => {
    const def = PARAMETER_DEFINITIONS[parameterId];
    if (!def) return;

    handleParameterChange(parameterId, def.default);
  }, [handleParameterChange]);

  // Reset all parameters to defaults
  const handleResetAllParameters = useCallback(() => {
    if (!modelRef.current) return;

    Object.keys(PARAMETER_DEFINITIONS).forEach(paramId => {
      const def = PARAMETER_DEFINITIONS[paramId];
      modelRef.current!.setParameterValue(paramId, def.default);
    });

    // Reset state
    const resetMap = new Map<string, number>();
    Object.entries(PARAMETER_DEFINITIONS).forEach(([paramId, def]) => {
      resetMap.set(paramId, def.default);
    });

    setAllParameters(resetMap);
    autoSave();
  }, []);

  // Auto-save to localStorage
  const autoSave = useCallback(() => {
    const state = {
      version: '1.0',
      timestamp: Date.now(),
      parameters: Object.fromEntries(allParameters),
      expressions: activeExpressions
    };

    localStorage.setItem('companion_autosave', JSON.stringify(state));
    log.debug('Auto-saved state');
  }, [allParameters, activeExpressions]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!modelRef.current) return;
    const newScale = Math.min(currentScale + 0.05, 2.0);  // Max 200%
    setCurrentScale(newScale);
    modelRef.current.updateScale(newScale);
  }, [currentScale]);

  const handleZoomOut = useCallback(() => {
    if (!modelRef.current) return;
    const newScale = Math.max(currentScale - 0.05, 0.1);  // Min 10%
    setCurrentScale(newScale);
    modelRef.current.updateScale(newScale);
  }, [currentScale]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!modelRef.current) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.02 : 0.02;  // Scroll down = zoom out
    const newScale = Math.max(0.1, Math.min(2.0, currentScale + delta));

    setCurrentScale(newScale);
    modelRef.current.updateScale(newScale);
  }, [currentScale]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modelRef.current) return;

    setIsDragging(true);
    const pos = modelRef.current.getPosition();

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      modelX: pos.x,
      modelY: pos.y
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !modelRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newX = dragStartRef.current.modelX + deltaX;
    const newY = dragStartRef.current.modelY + deltaY;

    setModelPosition({ x: newX, y: newY });
    modelRef.current.updatePosition(newX, newY);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Update active expressions list
  useEffect(() => {
    if (!modelRef.current || !isModelReady) return;

    const updateExpressions = () => {
      const active = modelRef.current!.getActiveExpressions();
      setActiveExpressions(active);
    };

    // Initial update
    updateExpressions();

    // Poll for changes (expressions can be set externally)
    const interval = setInterval(updateExpressions, 500);

    return () => clearInterval(interval);
  }, [modelRef, isModelReady]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simple FPS estimation (browser provides this via performance API)
      if ((performance as any).memory) {
        const memoryMB = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
        setMemory(memoryMB);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mouse wheel zoom (attached to model container)
  useEffect(() => {
    const modelContainer = document.querySelector('.model-container');
    if (!modelContainer) return;

    const wheelHandler = (e: WheelEvent) => handleWheel(e);
    modelContainer.addEventListener('wheel', wheelHandler, { passive: false });

    return () => modelContainer.removeEventListener('wheel', wheelHandler);
  }, [handleWheel]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate model view width (accounting for control panel)
  const controlPanelWidth = 420 + 40; // Panel width + margins
  const modelViewWidth = windowSize.width - controlPanelWidth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px'
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            }
          }
        }}
      />

      {/* Top Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 30,
        }}
      >
        {/* Left: Back Button */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s ease',
          }}
        >
          <FaArrowLeft size={14} />
          Back
        </button>

        {/* Center: Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              color: '#8B5CF6',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Companion Preview
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              margin: '2px 0 0 0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Aishi Model Testing Environment
          </p>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Performance Badge */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#8B5CF6',
              display: 'flex',
              gap: '12px',
            }}
          >
            <span>FPS: {fps}</span>
            <span>•</span>
            <span>Mem: {memory}MB</span>
          </div>

          {/* Zoom Controls */}
          {isModelReady && (
            <div
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#22C55E',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <button
                onClick={handleZoomOut}
                disabled={currentScale <= 0.1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentScale <= 0.1 ? 'rgba(255, 255, 255, 0.3)' : '#22C55E',
                  cursor: currentScale <= 0.1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                }}
                title="Zoom Out"
              >
                ➖
              </button>
              <span style={{ minWidth: '45px', textAlign: 'center' }}>
                {(currentScale * 100).toFixed(0)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={currentScale >= 2.0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentScale >= 2.0 ? 'rgba(255, 255, 255, 0.3)' : '#22C55E',
                  cursor: currentScale >= 2.0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                }}
                title="Zoom In"
              >
                ➕
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
        }}
      >
        {/* Model View (Left Side) */}
        <div
          className="model-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <Live2DModel
            ref={modelRef}
            modelPath="/水母_vts/水母.model3.json"
            width={modelViewWidth}
            height={windowSize.height - 60}
            scale={0.4}
            transparent={true}
            autoPlay={false}
            onLoad={handleModelLoad}
            onError={handleModelError}
            className="w-full h-full"
          />

          {/* Status Overlay (Bottom Left) */}
          {isModelReady && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#8B5CF6' }}>●</span> Model Ready
                </div>
                <div>Auto Breathing: ON</div>
                <div>Blinking: MANUAL</div>
                <div>
                  Active: {activeExpressions.length} expr, {countModifiedParams()} params
                </div>
              </div>
            </div>
          )}

          {/* Instruction Hint (Center Bottom) */}
          {isModelReady && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderRadius: '20px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#fff',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            >
              💡 Use Control Panel to adjust physics and expressions
            </div>
          )}
        </div>

        {/* Control Panel (Right Side) */}
        <CompanionControlPanel
          modelRef={modelRef}
          isModelReady={isModelReady}
          currentParameters={allParameters}
          onParameterChange={handleParameterChange}
          onParameterReset={handleParameterReset}
          onResetAllParameters={handleResetAllParameters}
          currentExpressions={activeExpressions}
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#8B5CF6',
              marginBottom: '16px',
              fontFamily: "'JetBrains Mono', monospace",
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            Loading Aishi Model...
          </div>
          <div
            style={{
              width: '300px',
              height: '4px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '60%',
                height: '100%',
                backgroundColor: '#8B5CF6',
                animation: 'loading 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <div
            style={{
              marginTop: '16px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Loading model, textures, and physics... (~150MB)
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {modelError && !isLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div
            style={{
              fontSize: '20px',
              color: '#EF4444',
              marginBottom: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Failed to Load Model
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            {modelError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8B5CF6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Reload Page
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300px);
          }
        }
      `}</style>
    </div>
  );

  // Helper: Count modified parameters
  function countModifiedParams(): number {
    let count = 0;
    allParameters.forEach((value, paramId) => {
      const def = PARAMETER_DEFINITIONS[paramId];
      if (def && Math.abs(value - def.default) > 0.001) {
        count++;
      }
    });
    return count;
  }
}
