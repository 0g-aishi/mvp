/**
 * @fileoverview Simplified PillNav component for CTA buttons replacement
 * @description Clean pill navigation with logo and 3 action buttons, no mobile menu
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useTheme } from '../../contexts/ThemeContext';
import { ShimmerButton } from './ShimmerButton';

export type PillNavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

export interface PillNavProps {
  items: PillNavItem[];
  className?: string;
  ease?: string;
}

const PillNav: React.FC<PillNavProps> = ({
  items,
  className = '',
  ease = 'power3.easeOut'
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const labelStackRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);

  useEffect(() => {
    const layout = () => {
      labelStackRefs.current.forEach((labelStack, index) => {
        if (!labelStack) return;

        const label = labelStack.querySelector<HTMLElement>('.pill-label');
        const hover = labelStack.querySelector<HTMLElement>('.pill-label-hover');
        
        // Simple text hover animation - no circle
        if (label) gsap.set(label, { y: 0, opacity: 1 });
        if (hover) gsap.set(hover, { y: 0, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        // Text swap animation
        if (label && hover) {
          tl.to(label, { y: -30, opacity: 0, duration: 0.3, ease }, 0);
          tl.to(hover, { y: 0, opacity: 1, duration: 0.3, ease }, 0.1);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease]);

  const handlePillEnter = (index: number) => {
    const tl = tlRefs.current[index];
    if (!tl) return;
    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto',
    });
  };

  const handlePillLeave = (index: number) => {
    const tl = tlRefs.current[index];
    if (!tl) return;
    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto',
    });
  };


  const handleItemClick = (item: PillNavItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      if (item.href.startsWith('http') || item.href.startsWith('//')) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(item.href);
      }
    }
  };

  const cssVars = {
    '--base': theme.bg.card,
    '--pill-bg': theme.accent.primary,
    '--hover-text': theme.text.white,
    '--pill-text': theme.text.primary,
  } as React.CSSProperties;

  return (
    <nav
      className={`pill-nav ${className}`}
      aria-label="Primary navigation"
      style={cssVars}
    >
      <div className="pill-nav-items">
        <ul className="pill-list" role="menubar">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} role="none">
              <div 
                className="pill-shimmer-container"
                onMouseEnter={() => handlePillEnter(index)}
                onMouseLeave={() => handlePillLeave(index)}
                style={{ position: 'relative' }}
              >
                <ShimmerButton
                  onClick={() => handleItemClick(item)}
                  aria-label={item.ariaLabel || item.label}
                  shimmerColor="#ffffff"
                  background={theme.accent.primary}
                  borderRadius="9999px"
                  shimmerDuration="3s"
                  className="pill-shimmer"
                  style={{
                    padding: `0 ${24}px`,
                    height: `${48}px`,
                    fontSize: '18px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2px'
                  }}
                >
                  <span className="label-stack" ref={(el) => {
                    labelStackRefs.current[index] = el;
                  }}>
                    <span className="pill-label">{item.label}</span>
                    <span className="pill-label-hover" aria-hidden="true">
                      {item.label}
                    </span>
                  </span>
                </ShimmerButton>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default PillNav;