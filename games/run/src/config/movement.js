export const MOVEMENT = Object.freeze({
  bodyWidth: 42,
  bodyHeight: 78,
  maxRunSpeed: 520,
  groundAcceleration: 3200,
  groundBrake: 3800,
  reverseBrake: 4600,
  airAcceleration: 1800,
  jumpVelocity: 760,
  gravityRise: 1900,
  gravityFall: 2650,
  maxFallSpeed: 1220,
  coyoteMs: 100,
  jumpBufferMs: 120,
  jumpCut: 0.48,
  skidThreshold: 210,
  skidHoldMs: 110,
  landingHoldMs: 90,
  hardLandingHoldMs: 140,
  hardLandingSpeed: 860,
  respawnMs: 450,
  spriteScale: 2.45,
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
