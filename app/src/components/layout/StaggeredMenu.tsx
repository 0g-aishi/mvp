'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import ConnectButton from '../wallet/ConnectButton';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
  external?: boolean;
  testMode?: boolean;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B19EEF', '#5227FF'],
  logoUrl = '/logo_clean.png',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#8B5CF6',
  accentColor = '#8B5CF6',
  changeMenuColorOnOpen = true,
  onMenuOpen,
  onMenuClose
}: StaggeredMenuProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  // Refs for DOM elements
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close']);

  // Refs for animations
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  // Check if test mode is enabled
  const isTestMode = process.env.NEXT_PUBLIC_DREAM_TEST === 'true';
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_AISHI_URL;

  // Menu items configuration - NO ICONS, clean text only
  const menuItems: StaggeredMenuItem[] = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Mint Aishi', ariaLabel: 'Mint new Aishi agent', link: '/aishi-mint' },
    { label: 'aishiOS', ariaLabel: 'Access aishiOS terminal', link: '/aishiOS' },
    { label: 'Companion', ariaLabel: 'Your AI companion', link: '/aishi-companion' },
    { label: 'Docs', ariaLabel: 'View documentation', link: docsUrl || '#', external: true },
    ...(isTestMode ? [
      { label: 'Upload', ariaLabel: 'Upload dream test', link: '/upload', testMode: true },
      { label: 'Compute', ariaLabel: 'Test compute', link: '/compute', testMode: true },
      { label: 'Agent', ariaLabel: 'Test agent', link: '/agent-test', testMode: true },
    ] : [])
  ];

  // Initial setup
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  // Build open timeline
  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
    ) as HTMLElement[];
    const walletBtn = panel.querySelector('.sm-wallet-section') as HTMLElement | null;
    const footer = panel.querySelector('.sm-footer') as HTMLElement | null;

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (walletBtn) {
      gsap.set(walletBtn, { opacity: 0, y: -20 });
    }
    if (footer) {
      gsap.set(footer, { opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (walletBtn) {
      tl.to(walletBtn, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, panelInsertTime + panelDuration * 0.2);
    }

    if (itemEls.length) {
      const itemsStartRatio = 0.25;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (footer) {
      const footerStart = panelInsertTime + panelDuration * 0.4;
      tl.to(footer, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      }, footerStart);
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  // Play open animation
  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  // Play close animation
  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
        ) as HTMLElement[];
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        const walletBtn = panel.querySelector('.sm-wallet-section') as HTMLElement | null;
        const footer = panel.querySelector('.sm-footer') as HTMLElement | null;
        if (walletBtn) gsap.set(walletBtn, { opacity: 0, y: -20 });
        if (footer) gsap.set(footer, { opacity: 0 });
        busyRef.current = false;
      }
    });
  }, [position]);

  // Animate icon
  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, []);

  // Animate button color
  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  // Animate text
  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }, []);

  // Toggle menu
  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  // Handle navigation
  const handleNavigation = useCallback((item: StaggeredMenuItem) => {
    if (item.external) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      router.push(item.link);
      toggleMenu(); // Close menu after navigation
    }
  }, [router, toggleMenu]);

  // Check if route is active
  const isActive = useCallback((link: string) => {
    if (link === '/') return pathname === '/';
    return pathname?.startsWith(link);
  }, [pathname]);

  return (
    <>
      {/* Dark overlay when menu is open */}
      {open && (
        <div
          className="sm-overlay"
          onClick={toggleMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 39,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <div
        className="staggered-menu-wrapper"
        style={accentColor ? { ['--sm-accent' as any]: accentColor } : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
            let arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
          })()}
        </div>

        <header className="staggered-menu-header" aria-label="Main navigation header">
          <div className="sm-logo" aria-label="Logo">
            <img
              src={logoUrl}
              alt="Logo"
              className="sm-logo-img"
              draggable={false}
            />
          </div>
          <button
            ref={toggleBtnRef}
            className="sm-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span className="sm-toggle-textWrap" aria-hidden="true">
              <span ref={textInnerRef} className="sm-toggle-textInner">
                {textLines.map((l, i) => (
                  <span className="sm-toggle-line" key={i}>
                    {l}
                  </span>
                ))}
              </span>
            </span>
            <span ref={iconRef} className="sm-icon" aria-hidden="true">
              <span ref={plusHRef} className="sm-icon-line" />
              <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
            </span>
          </button>
        </header>

        <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
          <div className="sm-panel-inner">
            {/* Wallet Connect Button - TOP PRIORITY */}
            <div className="sm-wallet-section">
              <ConnectButton />
            </div>

            {/* Navigation Items - NO ICONS, with numbering */}
            <ul className="sm-panel-list" role="list" data-numbering>
              {menuItems.map((item, idx) => {
                const active = isActive(item.link);
                return (
                  <li className="sm-panel-itemWrap" key={item.label + idx}>
                    <button
                      className={`sm-panel-item ${active ? 'sm-panel-item-active' : ''}`}
                      onClick={() => handleNavigation(item)}
                      aria-label={item.ariaLabel}
                      data-index={idx + 1}
                      type="button"
                    >
                      <span className="sm-panel-itemLabel">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Footer - Powered by 0G Network */}
            <div className="sm-footer" aria-label="Powered by 0G Network">
              <div className="sm-footer-content">
                <span className="sm-footer-text">Powered by</span>
                <img
                  src="/og.png"
                  alt="0G Network"
                  className="sm-footer-logo"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default StaggeredMenu;
