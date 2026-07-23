'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaRedo, FaTimes } from 'react-icons/fa';

interface SaveRetryDialogProps {
  isOpen: boolean;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  stepName: string;
  onRetry: () => void;
  onAbort: () => void;
}

export const SaveRetryDialog: React.FC<SaveRetryDialogProps> = ({
  isOpen,
  errorMessage,
  retryCount,
  maxRetries,
  stepName,
  onRetry,
  onAbort
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
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '90%',
            maxWidth: '520px',
            padding: '32px',
            backgroundColor: 'rgba(10, 10, 10, 0.98)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)',
          }}
        >
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <FaExclamationTriangle size={48} color="#EF4444" />
          </div>

          {/* Title */}
          <h2
            style={{
              color: '#EF4444',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'center',
            }}
          >
            Save Operation Failed
          </h2>

          {/* Step name */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Step: {stepName}
          </p>

          {/* Retry count badge */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#EF4444',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Retry Attempt: {retryCount}/{maxRetries}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                  marginBottom: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                }}
              >
                Error Details:
              </div>
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  fontFamily: "'JetBrains Mono', monospace",
                  wordBreak: 'break-word',
                }}
              >
                {errorMessage}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onAbort}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <FaTimes size={14} />
              Abort Save
            </button>

            <button
              onClick={onRetry}
              style={{
                padding: '12px 32px',
                backgroundColor: '#EF4444',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DC2626';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#EF4444';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
              }}
            >
              <FaRedo size={14} />
              Retry Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
