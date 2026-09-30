export const ASTRAL_KEYS = Object.freeze({
  exactConcept:'run-astral-exact-concept',
  exactPlatform:'run-astral-exact-platform',
  sky:'run-astral-sky',
  far:'run-astral-far',
  mid:'run-astral-mid',
  foreground:'run-astral-foreground',
  platformLarge:'run-platform-large',
  platformMedium:'run-platform-medium',
  platformSmall:'run-platform-small',
  movingPlatform:'run-platform-moving',
  shard:'run-shard',
  checkpointOff:'run-checkpoint-off',
  checkpointOn:'run-checkpoint-on',
  breakable:'run-breakable',
  spikes:'run-spikes',
  bounce:'run-bounce',
  speed:'run-speed',
  finish:'run-finish',
  chestClosed:'run-chest-closed',
  chestOpen:'run-chest-open',
  relic:'run-relic',
  arch:'run-arch',
  waterfall:'run-waterfall',
  crystalCluster:'run-crystal-cluster',
});

const BASE='/games/run/assets/astral/';
const EXACT='/games/run/assets/astral-exact/';

export function preloadAstralArt(scene){
  scene.load.image(ASTRAL_KEYS.exactConcept,EXACT+'first-light-concept.webp');
  scene.load.image(ASTRAL_KEYS.exactPlatform,EXACT+'platform-master.webp');

  // These are cropped directly from the approved RUN project boards.
  // Keep the public texture keys stable so FirstLightScene can swap from
  // placeholder SVGs to the canonical artwork without touching gameplay.
  scene.load.image(ASTRAL_KEYS.shard,EXACT+'shard.webp');
  scene.load.image(ASTRAL_KEYS.checkpointOff,EXACT+'checkpoint-off.webp');
  scene.load.image(ASTRAL_KEYS.checkpointOn,EXACT+'checkpoint-on.webp');
  scene.load.image(ASTRAL_KEYS.breakable,EXACT+'breakable.webp');
  scene.load.image(ASTRAL_KEYS.spikes,EXACT+'spikes.webp');
  scene.load.image(ASTRAL_KEYS.bounce,EXACT+'bounce-pad.webp');
  scene.load.image(ASTRAL_KEYS.speed,EXACT+'speed-strip.webp');
  scene.load.image(ASTRAL_KEYS.finish,EXACT+'finish-gate.webp');
  scene.load.image(ASTRAL_KEYS.chestClosed,EXACT+'chest-closed.webp');
  scene.load.image(ASTRAL_KEYS.chestOpen,EXACT+'chest-open.webp');
  scene.load.image(ASTRAL_KEYS.relic,EXACT+'secret-relic.webp');

  const assets=[
    [ASTRAL_KEYS.sky,'sky.svg'],
    [ASTRAL_KEYS.far,'far-ruins.svg'],
    [ASTRAL_KEYS.mid,'mid-ruins.svg'],
    [ASTRAL_KEYS.foreground,'foreground.svg'],
    [ASTRAL_KEYS.platformLarge,'platform-large.svg'],
    [ASTRAL_KEYS.platformMedium,'platform-medium.svg'],
    [ASTRAL_KEYS.platformSmall,'platform-small.svg'],
    [ASTRAL_KEYS.movingPlatform,'platform-moving.svg'],
    [ASTRAL_KEYS.arch,'arch.svg'],
    [ASTRAL_KEYS.waterfall,'waterfall.svg'],
    [ASTRAL_KEYS.crystalCluster,'crystal-cluster.svg'],
  ];
  for(const [key,file] of assets) scene.load.svg(key,BASE+file);
}
