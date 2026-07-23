'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionStartDialogProps {
  isOpen: boolean;
  onStart: () => void;
  onCancel: () => void;
  agentName?: string;
}

export const SessionStartDialog: React.FC<SessionStartDialogProps> = ({
  isOpen,
  onStart,
  onCancel,
  agentName = 'Aishi'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: '480px',
            padding: '32px',
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          }}
        >
          {/* Title */}
          <h2
            style={{
              color: '#8B5CF6',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'center',
            }}
          >
            Start Chat Session?
          </h2>

          {/* Description */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Do you want to start a chat session with <span style={{ color: '#8B5CF6', fontWeight: 'bold' }}>{agentName}</span>?
          </p>

          {/* Info */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                lineHeight: '1.5',
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {agentName} will respond with body language and facial expressions through Live2D animations.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Cancel
            </button>

            <button
              onClick={onStart}
              style={{
                padding: '12px 32px',
                backgroundColor: '#8B5CF6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#9F7AEA';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8B5CF6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              Start Session
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
