'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '../contexts/LoadingContext';
import { SplashScreen } from './SplashScreen';

export const NavigationLoader = () => {
  const pathname = usePathname();
  const { isLoading, progress, setProgress, startLoading, stopLoading } = useLoading();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);

  // Check if splash screen is disabled via environment variable
  const isSplashDisabled = process.env.NEXT_PUBLIC_SPLASH_SCREEN === 'off';
  
  // Early return if splash is disabled
  if (isSplashDisabled) {
    return null;
  }

  useEffect(() => {
    // Skip splash screen on first page load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // Start loading when pathname changes
    startLoading();
    
    // Smooth progress animation for 4 seconds
    let currentProgress = 0;
    const duration = 4000; // 4 seconds total
    const interval = 50; // Update every 50ms for smooth animation
    const steps = duration / interval; // 80 steps
    const increment = 90 / steps; // ~1.125% per step to reach 90%
    
    progressIntervalRef.current = setInterval(() => {
      currentProgress += increment;
      if (currentProgress > 90) {
        currentProgress = 90;
      }
      setProgress(Math.floor(currentProgress));
    }, interval);

    // Stop loading after 4 seconds
    const timeout = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      stopLoading();
    }, duration);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [pathname]);

  return <SplashScreen isLoading={isLoading} progress={progress} />;
};