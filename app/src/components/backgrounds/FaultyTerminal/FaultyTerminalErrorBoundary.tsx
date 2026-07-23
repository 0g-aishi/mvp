'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'FaultyTerminalErrorBoundary' });

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FaultyTerminalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      log.error('FaultyTerminal WebGL Error', { error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback to a simple gradient background if WebGL fails
      return (
        this.props.fallback || (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0A2E 50%, #0A0A0A 100%)',
              zIndex: -1
            }}
          >
            {/* Optional: subtle CSS animation as fallback */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                animation: 'pulse 10s ease-in-out infinite'
              }}
            />
          </div>
        )
      );
    }

    return this.props.children;
  }
}