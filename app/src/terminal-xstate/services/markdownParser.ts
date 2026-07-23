/**
 * @fileoverview Markdown Parser for Terminal Output
 * @description Lightweight Markdown to React parser for terminal-style rendering
 */

import React from 'react';

/**
 * Parse Markdown text to React elements with terminal-appropriate styling
 * Supports: bold (**text**), italic (*text* or _text_), and paragraphs
 */
export function parseMarkdownToReact(text: string): React.ReactNode {
  if (!text) return text;

  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((paragraph, pIndex) => {
    // Process each paragraph for inline formatting
    const elements = processInlineMarkdown(paragraph);
    
    // Wrap in paragraph-like spacing (except for last paragraph)
    if (pIndex < paragraphs.length - 1) {
      return React.createElement(
        React.Fragment,
        { key: `p-${pIndex}` },
        elements,
        React.createElement('br'),
        React.createElement('br')
      );
    }
    
    return React.createElement(
      React.Fragment,
      { key: `p-${pIndex}` },
      elements
    );
  });
}

/**
 * Process inline Markdown elements (bold, italic)
 */
function processInlineMarkdown(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Pattern to match bold (**text** or __text__) and italic (*text* or _text_)
  // Order matters: check bold first (longer pattern)
  const patterns = [
    {
      // Bold with **
      regex: /\*\*([^*]+)\*\*/,
      replace: (match: string, content: string) => 
        React.createElement('strong', { 
          key: `bold-${keyCounter++}`,
          style: { fontWeight: 600 }
        }, processInlineMarkdown(content))
    },
    {
      // Bold with __
      regex: /__([^_]+)__/,
      replace: (match: string, content: string) => 
        React.createElement('strong', { 
          key: `bold-${keyCounter++}`,
          style: { fontWeight: 600 }
        }, processInlineMarkdown(content))
    },
    {
      // Italic with * (but not ** which is bold)
      regex: /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/,
      replace: (match: string, content: string) => 
        React.createElement('em', { 
          key: `italic-${keyCounter++}`,
          style: { fontStyle: 'italic' }
        }, processInlineMarkdown(content))
    },
    {
      // Italic with _ (but not __ which is bold)
      regex: /(?<!_)_(?!_)([^_]+)_(?!_)/,
      replace: (match: string, content: string) => 
        React.createElement('em', { 
          key: `italic-${keyCounter++}`,
          style: { fontStyle: 'italic' }
        }, processInlineMarkdown(content))
    }
  ];

  while (remaining.length > 0) {
    let matched = false;
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        // Add text before match
        if (match.index > 0) {
          elements.push(remaining.substring(0, match.index));
        }
        
        // Add formatted element
        elements.push(pattern.replace(match[0], match[1]));
        
        // Continue with remaining text
        remaining = remaining.substring(match.index + match[0].length);
        matched = true;
        break;
      }
    }
    
    // If no pattern matched, add the rest as plain text
    if (!matched) {
      elements.push(remaining);
      break;
    }
  }

  // Handle single line breaks (convert to <br/>)
  return elements.map((element, index) => {
    if (typeof element === 'string') {
      const lines = element.split('\n');
      if (lines.length > 1) {
        return lines.map((line, lineIndex) => {
          if (lineIndex < lines.length - 1) {
            return React.createElement(
              React.Fragment,
              { key: `line-${index}-${lineIndex}` },
              line,
              React.createElement('br')
            );
          }
          return line;
        });
      }
    }
    return element;
  });
}

/**
 * Check if text contains Markdown formatting
 */
export function containsMarkdown(text: string): boolean {
  if (!text) return false;
  
  // Check for common Markdown patterns
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,     // Bold with **
    /__[^_]+__/,         // Bold with __
    /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/,  // Italic with *
    /(?<!_)_(?!_)[^_]+_(?!_)/,       // Italic with _
    /\n\n/               // Paragraph breaks
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}