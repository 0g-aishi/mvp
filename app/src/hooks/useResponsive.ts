import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  isSmallMobile: boolean;  // < 480px
  isMobile: boolean;        // < 768px
  isTablet: boolean;        // 768px - 1024px
  isDesktop: boolean;       // > 1024px
  isLargeDesktop: boolean;  // > 1440px
  screenWidth: number;
}

export const useResponsive = (): ResponsiveBreakpoints => {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>({
    isSmallMobile: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      setBreakpoints({
        isSmallMobile: width < 480,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isLargeDesktop: width >= 1440,
        screenWidth: width
      });
    };

    // Initial check
    checkScreenSize();

    // Add resize listener with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScreenSize, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoints;
};

// Export responsive style helpers
export const responsiveStyles = {
  padding: (mobile: string, tablet: string, desktop: string) => {
    return typeof window !== 'undefined' 
      ? window.innerWidth < 768 ? mobile 
      : window.innerWidth < 1024 ? tablet 
      : desktop
      : desktop;
  },
  
  fontSize: (mobile: string, tablet: string, desktop: string) => {
    return typeof window !== 'undefined'
      ? window.innerWidth < 768 ? mobile
      : window.innerWidth < 1024 ? tablet
      : desktop
      : desktop;
  },
  
  gridColumns: (mobile: string, tablet: string, desktop: string) => {
    return typeof window !== 'undefined'
      ? window.innerWidth < 768 ? mobile
      : window.innerWidth < 1024 ? tablet
      : desktop
      : desktop;
  }
};