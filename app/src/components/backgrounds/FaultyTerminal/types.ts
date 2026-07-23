export type Vec2 = [number, number];

export interface FaultyTerminalConfig {
  scale?: number;
  gridMul?: Vec2;
  digitSize?: number;
  timeScale?: number;
  pause?: boolean;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  dither?: number | boolean;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  dpr?: number;
  pageLoadAnimation?: boolean;
  brightness?: number;
}

export interface FaultyTerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: FaultyTerminalConfig;
  enabled?: boolean;
  performanceMode?: boolean;
}

export const defaultConfig: FaultyTerminalConfig = {
  scale: 1.5,
  gridMul: [2, 1],
  digitSize: 1.2,
  timeScale: 0.8,
  pause: false,
  scanlineIntensity: 0.3,
  glitchAmount: 0.5,
  flickerAmount: 0.3,
  noiseAmp: 0.8,
  chromaticAberration: 0.005,
  dither: 0.5,
  curvature: 0,
  tint: "#8B5CF6",
  mouseReact: true,
  mouseStrength: 0.2,
  pageLoadAnimation: true,
  brightness: 0.15,
};

export const performanceConfig: FaultyTerminalConfig = {
  ...defaultConfig,
  dpr: 1,
  scanlineIntensity: 0.1,
  glitchAmount: 0.2,
  flickerAmount: 0.1,
  noiseAmp: 0.3,
  chromaticAberration: 0,
  dither: 0,
  mouseReact: false,
  pageLoadAnimation: false,
};