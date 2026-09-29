export const RUNNER_ATLAS = Object.freeze({
  key: 'runnerAtlas',
  file: '/games/run/assets/runner/runner-atlas.webp',
  frameWidth: 56,
  frameHeight: 56,
  originX: 0.5,
  originY: 0.875,
});

export const RUNNER_FRAME_INDEX = Object.freeze({
  idle_01: 0,
  idle_02: 1,
  run_01: 2,
  run_02: 3,
  run_03: 4,
  run_04: 5,
  skid_01: 6,
  jump_start: 7,
  jump_rise: 8,
  apex: 9,
  fall: 10,
  land_soft: 11,
  land_hard: 12,
  death_01: 13,
  death_02: 14,
  victory: 15,
});

export const RUNNER_ANIMATIONS = Object.freeze({
  idle: { frames: ['idle_01', 'idle_02'], fps: 2 },
  run: { frames: ['run_01', 'run_02', 'run_03', 'run_04'], fps: 10 },
  skid: { frames: ['skid_01'], fps: 1 },
  jumpStart: { frames: ['jump_start'], fps: 1 },
  jump: { frames: ['jump_rise'], fps: 1 },
  apex: { frames: ['apex'], fps: 1 },
  fall: { frames: ['fall'], fps: 1 },
  land: { frames: ['land_soft'], fps: 1 },
  hardLand: { frames: ['land_hard'], fps: 1 },
  death: { frames: ['death_01', 'death_02'], fps: 6 },
  victory: { frames: ['victory'], fps: 1 },
});
