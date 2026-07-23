/**
 * @fileoverview SVGIcon component for loading custom SVG icons from public folder
 * @description Renders SVG icons with proper theming and sizing for sidebar usage
 */

'use client';

import React from 'react';

interface SVGIconProps {
  src: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const SVGIcon: React.FC<SVGIconProps> = ({ 
  src, 
  size = 18, 
  className = '', 
  style = {}, 
  alt = 'Icon'
}) => {
  return (
    <div 
      className={`svg-icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <img 
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          filter: 'brightness(0) saturate(100%) invert(84%) sepia(8%) saturate(228%) hue-rotate(202deg) brightness(95%) contrast(88%)',
          transition: 'filter 0.2s ease'
        }}
      />
    </div>
  );
};

export default SVGIcon;