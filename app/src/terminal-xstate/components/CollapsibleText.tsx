/**
 * @fileoverview Collapsible Text Component for Terminal Output
 * @description Displays long text with show more/less functionality
 */

import React, { useState, useMemo } from 'react';

interface CollapsibleTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  formatContent?: (content: string) => React.ReactNode;
}

const colors = {
  accent: '#8B5CF6',
  silver: '#8A8A8A'
};

export const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  text,
  maxLength = 400,
  className = '',
  formatContent
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if text needs collapsing
  const needsCollapse = text.length > maxLength;
  
  // Get display text
  const displayText = useMemo(() => {
    if (!needsCollapse || isExpanded) {
      return text;
    }
    // Find last space before maxLength to avoid cutting words
    const cutoff = text.lastIndexOf(' ', maxLength);
    return text.substring(0, cutoff > 0 ? cutoff : maxLength);
  }, [text, maxLength, isExpanded, needsCollapse]);
  
  const toggleButtonStyle: React.CSSProperties = {
    display: 'inline-block',
    marginLeft: '0.5rem',
    color: colors.accent,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'opacity 0.2s ease',
    userSelect: 'none'
  };
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };
  
  if (!needsCollapse) {
    return <>{formatContent ? formatContent(text) : text}</>;
  }
  
  return (
    <span className={className}>
      {formatContent ? formatContent(displayText) : displayText}
      {!isExpanded && '...'}
      <span
        style={toggleButtonStyle}
        onClick={handleToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isExpanded ? 'show less' : 'read more'}
      </span>
    </span>
  );
};