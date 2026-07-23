'use client';

import React, { useEffect, useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useTheme } from '../../contexts/ThemeContext';
import { LucideIcon } from 'lucide-react';

export interface CarouselItem {
  title: string;
  description: string;
  id: number;
  icon: LucideIcon;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 300;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 200, damping: 25, duration: 0.8 };

export default function Carousel({
  items = [],
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
}: CarouselProps): React.JSX.Element {
  const { theme } = useTheme();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Responsive dimensions
  const containerPadding = isMobile ? 18 : 16; // Więcej padding na mobile
  const responsiveBaseWidth = isMobile ? Math.min(baseWidth, window.innerWidth - 40) : baseWidth;
  const itemWidth = responsiveBaseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const carouselItems = loop ? [...items, items[0]] : items;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === items.length - 1 && loop) {
            return prev + 1;
          }
          if (prev === carouselItems.length - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [
    autoplay,
    autoplayDelay,
    isHovered,
    loop,
    items.length,
    carouselItems.length,
    pauseOnHover,
  ]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex((prev) => Math.min(prev + 1, carouselItems.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(items.length - 1);
      } else {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0,
        },
      };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        borderRadius: '24px',
        padding: '16px',
        width: `${baseWidth}px`,
        backgroundColor: theme.bg.card,
        ...(round && { height: `${baseWidth}px`, borderRadius: "50%" }),
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        drag="x"
        {...dragProps}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item, index) => {
          const range = [
            -(index + 1) * trackItemOffset,
            -index * trackItemOffset,
            -(index - 1) * trackItemOffset,
          ];
          const outputRange = [90, 0, -90];
          const rotateY = useTransform(x, range, outputRange, { clamp: false });
          
          return (
            <motion.div
              key={index}
              style={{
                position: 'relative',
                display: 'flex',
                flexShrink: 0,
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                backgroundColor: theme.bg.panel,
                overflow: 'hidden',
                cursor: 'grab',
                width: itemWidth,
                height: round ? itemWidth : '280px',
                rotateY: rotateY,
                ...(round && { borderRadius: "50%" }),
              }}
              transition={effectiveTransition}
              whileHover={{
                borderColor: theme.accent.primary,
                boxShadow: `0 0 20px rgba(139, 92, 246, 0.2)`,
                scale: 1.02
              }}
            >
              {/* Header with Icon */}
              <div style={{
                padding: '20px',
                paddingBottom: '16px',
                ...(round && { padding: '0', margin: '0' })
              }}>
                <div style={{
                  display: 'flex',
                  height: '48px',
                  width: '48px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: theme.gradients.primary,
                  boxShadow: `0 0 15px rgba(139, 92, 246, 0.3)`
                }}>
                  {React.createElement(item.icon, {
                    size: 24,
                    color: 'white'
                  })}
                </div>
              </div>
              
              {/* Content */}
              <div style={{
                padding: '0 20px 20px 20px',
                flex: 1
              }}>
                <div style={{
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '18px',
                  color: theme.text.primary,
                  lineHeight: '1.3'
                }}>
                  {item.title}
                </div>
                <p style={{
                  fontSize: '14px',
                  color: theme.text.secondary,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Indicators */}
      <div style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        ...(round && {
          position: 'absolute',
          zIndex: 2,
          bottom: '3em',
          left: '50%',
          transform: 'translateX(-50%)'
        })
      }}>
        <div style={{
          marginTop: '16px',
          display: 'flex',
          width: '150px',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          {items.map((_, index) => (
            <motion.div
              key={index}
              style={{
                height: '8px',
                width: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                backgroundColor: currentIndex % items.length === index 
                  ? theme.accent.primary 
                  : theme.border,
                transition: 'background-color 150ms',
              }}
              animate={{
                scale: currentIndex % items.length === index ? 1.2 : 1,
              }}
              onClick={() => setCurrentIndex(index)}
              transition={{ duration: 0.15 }}
              whileHover={{
                backgroundColor: theme.accent.primary
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 