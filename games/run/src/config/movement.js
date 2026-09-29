export const MOVEMENT = Object.freeze({
  bodyWidth: 40,
  bodyHeight: 76,
  maxRunSpeed: 520,
  groundAcceleration: 3000,
  groundBrake: 3800,
  reverseBrake: 4800,
  reverseFacingSpeed: 70,
  airAcceleration: 1650,
  jumpVelocity: 750,
  gravityRise: 1900,
  gravityFall: 2750,
  maxFallSpeed: 1150,
  coyoteMs: 100,
  jumpBufferMs: 115,
  jumpCut: 0.46,
  jumpStartMs: 78,
  skidThreshold: 240,
  skidHoldMs: 120,
  landingHoldMs: 88,
  hardLandingHoldMs: 132,
  hardLandingSpeed: 820,
  respawnMs: 425,
  spriteScale: 0.62,
  runCycleDistance: 260,
  cameraLookAhead: 165,
  cameraLookAheadRate: 6.5,
  cameraVerticalRate: 5.5,
});

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const moveToward = (value, target, delta) => {
  if (value < target) return Math.min(target, value + delta);
  if (value > target) return Math.max(target, value - delta);
  return target;
};
