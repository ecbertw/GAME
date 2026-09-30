import p0 from './approved-runner-data/part0.js';
import p1 from './approved-runner-data/part1.js';
import p2 from './approved-runner-data/part2.js';
import p3 from './approved-runner-data/part3.js';
import p4 from './approved-runner-data/part4.js';
import p5 from './approved-runner-data/part5.js';
import p6 from './approved-runner-data/part6.js';
import p7 from './approved-runner-data/part7.js';

const APPROVED_RUNNER_DATA = 'data:image/webp;base64,' + p0 + p1 + p2 + p3 + p4 + p5 + p6 + p7;

export const RUNNER_ATLAS = Object.freeze({
  key: 'approvedRunnerAtlas',
  file: APPROVED_RUNNER_DATA,
  frameWidth: 128,
  frameHeight: 128,
  originX: 0.5,
  originY: 0.875,
  source: 'approved EIXO RUN anime/chibi sprite atlas',
  concept: 'EIXO RUN approved Runner',
  transport: 'embedded-webp-data-uri',
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
  idle: { frames: ['idle_01','idle_02'], fps: 2.4, loop: true },
  run: { frames: ['run_01','run_02','run_03','run_04'], distanceDriven: true, loop: true },
  skid: { frames: ['skid_01'], fps: 1, loop: false },
  jumpStart: { frames: ['jump_start'], fps: 1, loop: false },
  jump: { frames: ['jump_rise'], fps: 1, loop: false },
  apex: { frames: ['apex'], fps: 1, loop: false },
  fall: { frames: ['fall'], fps: 1, loop: false },
  land: { frames: ['land_soft'], fps: 1, loop: false },
  hardLand: { frames: ['land_hard'], fps: 1, loop: false },
  death: { frames: ['death_01','death_02'], fps: 6, loop: false },
  victory: { frames: ['victory'], fps: 1, loop: true },
});
