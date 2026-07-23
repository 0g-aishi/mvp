/**
 * @fileoverview Responsive design utilities and breakpoint system
 * @description Centralized responsive design tokens and helper functions for consistent breakpoint handling across the application
 */

export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  
  // Max width queries for mobile-first
  xsMax: `@media (max-width: ${breakpoints.xs - 1}px)`,
  smMax: `@media (max-width: ${breakpoints.sm - 1}px)`,
  mdMax: `@media (max-width: ${breakpoints.md - 1}px)`,
  lgMax: `@media (max-width: ${breakpoints.lg - 1}px)`,
  xlMax: `@media (max-width: ${breakpoints.xl - 1}px)`,
} as const;

/**
 * Hook to detect current breakpoint
 */
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  if (width < breakpoints.xl) return 'xl';
  return '2xl';
};

/**
 * Responsive value helper - returns different values based on breakpoint
 */
export const responsiveValue = <T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}, currentBreakpoint: string): T => {
  const breakpointOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i] as keyof typeof values;
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return values.base;
};

/**
 * Touch target sizes for better mobile UX
 */
export const touchTargets = {
  minimum: 44, // iOS HIG minimum
  comfortable: 48, // Material Design recommendation
  large: 56 // Enhanced accessibility
} as const;

/**
 * Container max widths per breakpoint
 */
export const containerWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;