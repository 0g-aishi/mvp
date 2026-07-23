'use client';

import React, { useEffect, useState } from 'react';
import { FullscreenTerminal } from '@/terminal-xstate/components/FullscreenTerminal';
import '@rainbow-me/rainbowkit/styles.css';

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR hydration issues
  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0A0A0A',
        color: '#8A8A8A',
        fontFamily: 'monospace'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <FullscreenTerminal
      selectedModel={selectedModel}
      selectedVoice={selectedVoice}
    />
  );
}