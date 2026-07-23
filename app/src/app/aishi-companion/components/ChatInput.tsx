'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...'
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '700px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `2px solid ${isFocused ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '24px',
          boxShadow: isFocused
            ? '0 8px 32px rgba(139, 92, 246, 0.3)'
            : '0 4px 16px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '0',
          }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: (disabled || !input.trim()) ? 'rgba(139, 92, 246, 0.2)' : '#8B5CF6',
            border: 'none',
            color: '#fff',
            cursor: (disabled || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: (disabled || !input.trim()) ? 0.5 : 1,
            boxShadow: (disabled || !input.trim())
              ? 'none'
              : '0 4px 12px rgba(139, 92, 246, 0.4)',
          }}
          onMouseEnter={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.backgroundColor = '#9F7AEA';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.backgroundColor = '#8B5CF6';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <FaPaperPlane size={14} />
        </button>
      </div>
    </form>
  );
};
