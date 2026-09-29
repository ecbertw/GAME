export const RUNNER_TEXTURE_PREFIX = 'runnerV2:';

export const RUNNER_FRAMES = Object.freeze(Object.fromEntries(
  ["idle_01","idle_02","idle_03","idle_04","run_01","run_02","run_03","run_04","run_05","run_06","run_07","run_08","skid_01","skid_02","skid_03","jump_start_01","jump_start_02","jump_rise_01","jump_rise_02","apex_01","apex_02","fall_01","fall_02","land_soft_01","land_soft_02","land_hard_01","land_hard_02","land_hard_03","death_01","death_02","death_03","death_04","death_05","victory_01","victory_02","victory_03","victory_04"].map(name => [name, Object.freeze({
    key: RUNNER_TEXTURE_PREFIX + name,
    file: '/games/run/assets/runner/v2/' + name + '.svg',
  })])
));

export const RUNNER_META = Object.freeze({
  sourceSize: 256,
  originX: 0.5,
  originY: 0.91,
  frameCount: 37,
  fixedOutfit: true,
  bakedFx: false,
});

export const RUNNER_ANIMATIONS = Object.freeze({
  idle: { frames: ['idle_01','idle_02','idle_03','idle_04'], fps: 2.4, loop: true },
  run: { frames: ['run_01','run_02','run_03','run_04','run_05','run_06','run_07','run_08'], distanceDriven: true, loop: true },
  skid: { frames: ['skid_01','skid_02','skid_03'], fps: 24, loop: false },
  jumpStart: { frames: ['jump_start_01','jump_start_02'], fps: 26, loop: false },
  jump: { frames: ['jump_rise_01','jump_rise_02'], fps: 10, loop: false },
  apex: { frames: ['apex_01','apex_02'], fps: 12, loop: false },
  fall: { frames: ['fall_01','fall_02'], fps: 9, loop: false },
  land: { frames: ['land_soft_01','land_soft_02'], fps: 22, loop: false },
  hardLand: { frames: ['land_hard_01','land_hard_02','land_hard_03'], fps: 22, loop: false },
  death: { frames: ['death_01','death_02','death_03','death_04','death_05'], fps: 12, loop: false },
  victory: { frames: ['victory_01','victory_02','victory_03','victory_04'], fps: 7, loop: true },
});
