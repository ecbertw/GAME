export const RUN_PHYSICS = Object.freeze({
  gravityY: 1700,
  runSpeed: 390,
  jumpSpeed: 640,
  wallJumpSpeed: 600,
  wallKickSpeed: 440,
  coyoteMs: 105,
  jumpBufferMs: 125,
});

// Design envelope used by level geometry:
// same-height theoretical range ≈ 294 px; max rise ≈ 120 px.
// Mandatory jumps are kept well inside those maxima.
