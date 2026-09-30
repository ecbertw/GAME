export const ASTRAL_KEYS = Object.freeze({
  backgrounds: 'run-astral-backgrounds',
  objects: 'run-astral-objects',
});

export const ASTRAL_BG = Object.freeze({
  sky: 'sky-backdrop',
  clouds: 'far-clouds',
  far: 'far-ruins',
  mid: 'mid-ruins',
  foreground: 'foreground',
});

export const ASTRAL_OBJ = Object.freeze({
  platformLarge: 'platform-large',
  platformMedium: 'platform-medium',
  platformSmall: 'platform-small',
  platformMoving: 'platform-moving',
  floatingIsland: 'floating-island',
  shard: 'shard',
  checkpointOff: 'checkpoint-off',
  checkpointOn: 'checkpoint-on',
  breakable: 'breakable',
  spikes: 'spikes',
  dangerCrystal: 'danger-crystal',
  bounce: 'bounce-pad',
  speed: 'speed-strip',
  finish: 'finish-gate',
  chestClosed: 'chest-closed',
  chestOpen: 'chest-open',
  relic: 'secret-relic',
  pedestal: 'collectible-pedestal',
  routeBanner: 'route-banner',
  signMarker: 'sign-marker',
  arch: 'arch',
  waterfall: 'waterfall',
  crystalCluster: 'crystal-cluster',
  vegetationPink: 'vegetation-pink',
  vegetationGreen: 'vegetation-green',
});

const BASE='/games/run/assets/final/';

export function preloadAstralArt(scene) {
  scene.load.atlas(
    ASTRAL_KEYS.backgrounds,
    BASE+'astral-backgrounds.webp',
    BASE+'astral-backgrounds.json',
  );
  scene.load.atlas(
    ASTRAL_KEYS.objects,
    BASE+'astral-objects.webp',
    BASE+'astral-objects.json',
  );
}
