"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

export interface SplitTextProps {
  text?: string;
  texts?: string[];
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  textAlign?: React.CSSProperties["textAlign"];
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
  rotationDelay?: number;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  texts,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  textAlign = "center",
  onAnimationComplete,
  style = {},
  rotationDelay = 3500
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle both single text and array of texts
  const textArray = texts || (text ? [text] : []);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const animateText = (textToAnimate: string, animateIn = true) => {
    if (!containerRef.current) return;

    // Clear previous animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Split text into elements
    let elements: HTMLSpanElement[] = [];
    
    if (splitType === "words") {
      const words = textToAnimate.split(" ");
      words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement("span");
        wordSpan.style.display = "inline-block";
        wordSpan.style.whiteSpace = "nowrap";
        wordSpan.textContent = word;
        elements.push(wordSpan);
        containerRef.current!.appendChild(wordSpan);
        
        // Add space between words
        if (wordIndex < words.length - 1) {
          const space = document.createTextNode(" ");
          containerRef.current!.appendChild(space);
        }
      });
    } else {
      // Split by characters
      const chars = textToAnimate.split("");
      chars.forEach((char) => {
        const charSpan = document.createElement("span");
        charSpan.style.display = "inline-block";
        if (char === " ") {
          charSpan.innerHTML = "&nbsp;";
          charSpan.style.width = "0.25em";
        } else {
          charSpan.textContent = char;
        }
        elements.push(charSpan);
        containerRef.current!.appendChild(charSpan);
      });
    }

    if (animateIn) {
      // Set initial state for animation in
      gsap.set(elements, from);

      // Create animation timeline
      const tl = gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      });

      // Animate elements in
      tl.to(elements, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
      });

      animationRef.current = tl;
    } else {
      // Animation out
      gsap.set(elements, to);
      
      const tl = gsap.timeline({
        onComplete: () => {
          // After animating out, pick a new random text
          let newIndex;
          if (textArray.length > 1) {
            do {
              newIndex = Math.floor(Math.random() * textArray.length);
            } while (newIndex === currentTextIndex);
          } else {
            newIndex = 0;
          }
          setCurrentTextIndex(newIndex);
        }
      });

      // Animate out with reverse effect
      tl.to(elements, {
        opacity: 0,
        y: -15,
        rotateX: 90,
        duration: duration * 0.7,
        ease: "power2.in",
        stagger: delay / 2000, // Faster stagger for exit
      });

      animationRef.current = tl;
    }
  };

  // Initial animation and rotation setup
  useEffect(() => {
    if (textArray.length === 0) return;

    setIsAnimating(true);
    animateText(textArray[currentTextIndex], true);

    // Only set up rotation if there are multiple texts
    if (textArray.length > 1) {
      const startRotation = () => {
        rotationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(true);
          animateText(textArray[currentTextIndex], false); // Animate out
        }, rotationDelay);
      };

      startRotation();

      return () => {
        if (rotationTimeoutRef.current) {
          clearTimeout(rotationTimeoutRef.current);
        }
        if (animationRef.current) {
          animationRef.current.kill();
        }
      };
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [currentTextIndex]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        textAlign,
        display: "inline-block",
        minHeight: "1.5em",
        ...style
      }}
    />
  );
};

export default SplitText;