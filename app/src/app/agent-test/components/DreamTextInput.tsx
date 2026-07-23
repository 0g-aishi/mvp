'use client';

import { Moon } from 'lucide-react';
import { Theme, DebugLogFunction } from './DreamAnalysisTypes';

interface DreamTextInputProps {
  dreamText: string;
  onDreamTextChange: (text: string) => void;
  effectiveTokenId: number | undefined;
  theme: Theme;
  disabled?: boolean;
  debugLog: DebugLogFunction;
}

export default function DreamTextInput({
  dreamText,
  onDreamTextChange,
  effectiveTokenId,
  theme,
  disabled = false,
  debugLog
}: DreamTextInputProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onDreamTextChange(value);
    debugLog('Dream text changed', { length: value.length, preview: value.substring(0, 50) + '...' });
  };

  return (
    <div style={{
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: theme.text.primary,
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Moon size={20} />
        STEP 1: Dream Input - Agent #{effectiveTokenId}
      </h3>
      
      <div style={{
        fontSize: '14px',
        color: theme.text.secondary,
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: theme.bg.panel,
        borderRadius: '6px',
        border: `1px solid ${theme.border}`
      }}>
        💭 Enter your dream to analyze and evolve your agent's personality. Each dream contributes to your agent's growth and memory.
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          color: theme.text.primary,
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          Describe Your Dream
        </label>
        
        <textarea
          value={dreamText}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Tell me about your dream... What happened? How did you feel? What was the atmosphere like?"
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            backgroundColor: disabled ? theme.bg.card : theme.bg.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            color: disabled ? theme.text.secondary : theme.text.primary,
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
        
        <div style={{
          fontSize: '12px',
          color: theme.text.secondary,
          marginTop: '5px',
          textAlign: 'right'
        }}>
          {dreamText.length} characters
        </div>
      </div>
    </div>
  );
}