'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
  text: string;
  agentName: string;
  onComplete?: () => void;
  displayDuration?: number;
}

/**
 * Message bubble that fades in, displays for 15s, then fades out
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  agentName,
  onComplete,
  displayDuration = 15000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after display duration
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [displayDuration]);

  useEffect(() => {
    // Call onComplete after fade out animation finishes
    if (!isVisible && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300); // Match exit animation duration

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '80%',
            width: 'auto',
            padding: '16px 24px',
            backgroundColor: 'rgba(139, 92, 246, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
            zIndex: 50,
          }}
        >
          {/* Agent name */}
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '6px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.5px',
            }}
          >
            {agentName}
          </div>

          {/* Message text */}
          <div
            style={{
              color: '#fff',
              fontSize: '15px',
              lineHeight: '1.5',
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {text}
          </div>

          {/* Progress indicator */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: displayDuration / 1000, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '0 0 16px 16px',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
