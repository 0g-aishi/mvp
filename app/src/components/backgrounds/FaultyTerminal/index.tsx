'use client';

import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { FaultyTerminalProps, FaultyTerminalConfig, defaultConfig, performanceConfig } from "./types";
import { vertexShader, fragmentShader } from "./shaders";
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'FaultyTerminal' });

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const num = parseInt(h, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export default function FaultyTerminal({
  config = {},
  enabled = true,
  performanceMode = false,
  className,
  style,
  ...rest
}: FaultyTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const loadAnimationStartRef = useRef<number>(0);
  const timeOffsetRef = useRef<number>(Math.random() * 100);
  const isVisibleRef = useRef(true);

  // Merge configs based on performance mode
  const finalConfig: FaultyTerminalConfig = useMemo(() => {
    const baseConfig = performanceMode ? performanceConfig : defaultConfig;
    return { ...baseConfig, ...config };
  }, [config, performanceMode]);

  // Extract values from config
  const {
    scale = 1.5,
    gridMul = [2, 1],
    digitSize = 1.2,
    timeScale = 0.8,
    pause = false,
    scanlineIntensity = 0.3,
    glitchAmount = 0.5,
    flickerAmount = 0.3,
    noiseAmp = 0.8,
    chromaticAberration = 0.005,
    dither = 0.5,
    curvature = 0,
    tint = "#8B5CF6",
    mouseReact = true,
    mouseStrength = 0.2,
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    pageLoadAnimation = true,
    brightness = 0.15,
  } = finalConfig;

  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(
    () => (typeof dither === "boolean" ? (dither ? 1 : 0) : dither),
    [dither]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseReact) return;
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, [mouseReact]);

  // Handle visibility changes for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    
    const ctn = containerRef.current;
    if (!ctn) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      log.warn('WebGL not supported, FaultyTerminal background disabled');
      return;
    }

    const renderer = new Renderer({ dpr });
    rendererRef.current = renderer;
    const glContext = renderer.gl;
    glContext.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(glContext);

    const program = new Program(glContext, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(
            glContext.canvas.width,
            glContext.canvas.height,
            glContext.canvas.width / glContext.canvas.height
          ),
        },
        uScale: { value: scale },
        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: {
          value: new Float32Array([
            smoothMouseRef.current.x,
            smoothMouseRef.current.y,
          ]),
        },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(glContext, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new Color(
        glContext.canvas.width,
        glContext.canvas.height,
        glContext.canvas.width / glContext.canvas.height
      );
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(ctn);
    resize();

    const update = (t: number) => {
      rafRef.current = requestAnimationFrame(update);

      // Skip rendering if tab is not visible
      if (!isVisibleRef.current) return;

      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t;
      }

      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }

      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        const progress = Math.min(animationElapsed / animationDuration, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }

      if (mouseReact) {
        const dampingFactor = 0.08;
        const smoothMouse = smoothMouseRef.current;
        const mouse = mouseRef.current;
        smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
        smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;

        const mouseUniform = program.uniforms.uMouse.value as Float32Array;
        mouseUniform[0] = smoothMouse.x;
        mouseUniform[1] = smoothMouse.y;
      }

      renderer.render({ scene: mesh });
    };

    // Start animation loop
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        rafRef.current = requestAnimationFrame(update);
      });
    } else {
      rafRef.current = requestAnimationFrame(update);
    }

    ctn.appendChild(glContext.canvas);

    if (mouseReact) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (mouseReact) {
        document.removeEventListener("mousemove", handleMouseMove);
      }
      if (glContext.canvas.parentElement === ctn) {
        ctn.removeChild(glContext.canvas);
      }
      glContext.getExtension("WEBGL_lose_context")?.loseContext();
      loadAnimationStartRef.current = 0;
      timeOffsetRef.current = Math.random() * 100;
    };
  }, [
    enabled,
    dpr,
    pause,
    timeScale,
    scale,
    gridMul,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    ditherValue,
    curvature,
    tintVec,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    handleMouseMove,
  ]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className={`faulty-terminal-bg ${className || ''}`}
      style={style}
      {...rest}
    />
  );
}