'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Lazy load the FaultyTerminal component
const FaultyTerminal = dynamic(
  () => import('./FaultyTerminal').then(mod => mod.default),
  {
    loading: () => (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0A2E 20%, #0A0A0A 100%)',
          zIndex: -1,
          opacity: 0.5,
          animation: 'fadeIn 0.5s ease'
        }}
      />
    ),
    ssr: false // Disable SSR for WebGL component
  }
);

export default FaultyTerminal;