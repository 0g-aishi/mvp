'use client';

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useLive2D } from './hooks/useLive2D';
import type { Live2DModelOptions, Live2DModelRef } from './utils/live2d-types';

// Loading component
const Live2DLoading: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#8B5CF6',
    fontFamily: "'JetBrains Mono', monospace",
  }}>
    <div style={{
      fontSize: '24px',
      marginBottom: '16px',
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      Loading Live2D Model
    </div>
    <div style={{
      width: '200px',
      height: '4px',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '60px',
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: '2px',
        animation: 'loading 1.5s ease-in-out infinite',
      }} />
    </div>
    <style jsx>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes loading {
        0% { transform: translateX(-60px); }
        100% { transform: translateX(200px); }
      }
    `}</style>
  </div>
);

// Error component
const Live2DError: React.FC<{ error: string }> = ({ error }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#EF4444',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '20px',
  }}>
    <div style={{
      fontSize: '20px',
      marginBottom: '8px',
    }}>
      Failed to Load Model
    </div>
    <div style={{
      fontSize: '14px',
      opacity: 0.8,
      textAlign: 'center',
      maxWidth: '400px',
    }}>
      {error}
    </div>
  </div>
);

// Main Live2D Model component
export const Live2DModel = forwardRef<Live2DModelRef, Live2DModelOptions>((props, ref) => {
  const {
    modelPath,
    width = 800,
    height = 600,
    scale = 1,
    x,
    y,
    transparent = false,
    autoPlay = true,
    className = '',
    onLoad,
    onError,
    onMotionStart,
    onMotionFinish,
    onHit,
  } = props;

  const {
    containerRef,
    modelRef,
    isLoading,
    error,
    isReady,
    metrics,
    resizeModel,
    updateScale,
  } = useLive2D({
    modelPath,
    width,
    height,
    scale,
    transparent,
    autoPlay,
    onLoad,
    onError,
    onMotionStart,
    onMotionFinish,
    onHit,
  });

  // Expose model ref to parent
  useImperativeHandle(ref, () => modelRef, [modelRef]);

  // Only resize after model is ready to prevent null errors
  useEffect(() => {
    if (isReady && resizeModel) {
      resizeModel(width, height);
    }
  }, [width, height, resizeModel, isReady]);

  // Only update scale after model is ready
  useEffect(() => {
    if (isReady && updateScale) {
      updateScale(scale, x, y);
    }
  }, [scale, x, y, updateScale, isReady]);

  return (
    <div 
      className={`live2d-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Canvas container */}
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Loading state */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10,
        }}>
          <Live2DLoading />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10,
        }}>
          <Live2DError error={error} />
        </div>
      )}

      {/* Performance metrics (only in test mode) */}
      {process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true' && isReady && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          fontSize: '12px',
          fontFamily: 'monospace',
          borderRadius: '4px',
          zIndex: 100,
        }}>
          <div>FPS: {metrics.fps}</div>
          <div>Memory: {metrics.memory}MB</div>
          <div>Textures: {metrics.textureCount}</div>
        </div>
      )}
    </div>
  );
});

Live2DModel.displayName = 'Live2DModel';