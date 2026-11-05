/**
 * Particle field from the brand board's core sheet. Dots gather in the corners
 * and along the edges — they never touch the wings.
 */
export interface HermesParticle {
  cx: number;
  cy: number;
  r: number;
  o: number;
}

export const HERMES_PARTICLES: readonly HermesParticle[] = [
  { cx: 46.4, cy: 50.6, r: 0.9, o: 0.7 },
  { cx: 43.1, cy: 42.2, r: 0.9, o: 1 },
  { cx: 45.2, cy: 62.7, r: 1.1, o: 0.55 },
  { cx: 51.4, cy: 40, r: 1.4, o: 0.85 },
  { cx: 47.6, cy: 66.8, r: 1.1, o: 0.55 },
  { cx: 14.7, cy: 53.5, r: 1.8, o: 0.55 },
  { cx: 14.6, cy: 43.9, r: 1.4, o: 0.85 },
  { cx: 83.9, cy: 43.2, r: 2.2, o: 0.85 },
  { cx: 84.1, cy: 33.5, r: 1.1, o: 0.85 },
  { cx: 7.6, cy: 60.3, r: 1.4, o: 0.85 },
  { cx: 81.6, cy: 54.2, r: 2.2, o: 0.85 },
  { cx: 82.4, cy: 69, r: 2.2, o: 0.7 },
  { cx: 13, cy: 73.1, r: 0.9, o: 1 },
  { cx: 50.9, cy: 78.7, r: 1.1, o: 0.85 },
  { cx: 24.7, cy: 15.6, r: 2.6, o: 0.55 },
  { cx: 69.3, cy: 13.7, r: 2.6, o: 1 },
  { cx: 37.6, cy: 16.6, r: 0.9, o: 0.55 },
  { cx: 70.6, cy: 85.6, r: 1.4, o: 0.7 },
  { cx: 15.1, cy: 12.9, r: 0.9, o: 0.7 },
  { cx: 28.4, cy: 81.4, r: 1.8, o: 0.55 },
  { cx: 13.3, cy: 85.1, r: 1.8, o: 0.7 },
  { cx: 53.4, cy: 7.5, r: 1.1, o: 0.7 },
  { cx: 29.5, cy: 25.7, r: 1.4, o: 0.85 },
  { cx: 55.8, cy: 21.8, r: 2.2, o: 0.85 },
  { cx: 87.3, cy: 24.4, r: 1.8, o: 0.7 },
  { cx: 82.8, cy: 81.8, r: 1.1, o: 0.85 },
  { cx: 80.4, cy: 10.8, r: 1.8, o: 0.85 },
  { cx: 61.8, cy: 77.9, r: 2.6, o: 0.7 },
  { cx: 43.4, cy: 8.4, r: 2.2, o: 0.55 },
  { cx: 41.4, cy: 76.1, r: 1.1, o: 0.7 },
];
