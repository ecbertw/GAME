export const ASTRAL_BG = Object.freeze({
  sky: 'run-bg-sky',
  world: 'run-bg-world',
});

export const ASTRAL_OBJ = Object.freeze({
  platformLarge: 'run-platform-large',
  platformMedium: 'run-platform-medium',
  platformSmall: 'run-platform-small',
  platformMoving: 'run-platform-moving',
  floatingIsland: 'run-floating-island',
  shard: 'run-shard',
  checkpointOff: 'run-checkpoint-off',
  checkpointOn: 'run-checkpoint-on',
  breakable: 'run-breakable',
  spikes: 'run-spikes',
  dangerCrystal: 'run-danger-crystal',
  bounce: 'run-bounce',
  speed: 'run-speed',
  finish: 'run-finish',
  chestClosed: 'run-chest-closed',
  chestOpen: 'run-chest-open',
  relic: 'run-secret-relic',
  pedestal: 'run-pedestal',
  routeBanner: 'run-route-banner',
  signMarker: 'run-sign-marker',
  arch: 'run-arch',
  waterfall: 'run-waterfall',
  crystalCluster: 'run-crystal-cluster',
  vegetationPink: 'run-vegetation-pink',
  vegetationGreen: 'run-vegetation-green',
});

const EXACT='/games/run/assets/astral-exact/';

export function preloadAstralArt(scene) {
  const load=(key,file)=>scene.load.image(key,EXACT+file);

  load(ASTRAL_BG.sky,'bg-sky.webp');
  load(ASTRAL_BG.world,'first-light-concept.webp');

  // Use the approved extracted artwork already committed in astral-exact.
  // Several size/decoration variants deliberately share the same canonical
  // artwork so the browser never falls back to Phaser's green missing texture.
  load(ASTRAL_OBJ.platformLarge,'platform-master.webp');
  load(ASTRAL_OBJ.platformMedium,'platform-master.webp');
  load(ASTRAL_OBJ.platformSmall,'platform-master.webp');
  load(ASTRAL_OBJ.platformMoving,'platform-master.webp');
  load(ASTRAL_OBJ.floatingIsland,'platform-master.webp');

  load(ASTRAL_OBJ.shard,'shard.webp');
  load(ASTRAL_OBJ.checkpointOff,'checkpoint-off.webp');
  load(ASTRAL_OBJ.checkpointOn,'checkpoint-on.webp');
  load(ASTRAL_OBJ.breakable,'breakable.webp');
  load(ASTRAL_OBJ.spikes,'spikes.webp');
  load(ASTRAL_OBJ.dangerCrystal,'spikes.webp');
  load(ASTRAL_OBJ.bounce,'bounce-pad.webp');
  load(ASTRAL_OBJ.speed,'speed-strip.webp');
  load(ASTRAL_OBJ.finish,'finish-gate.webp');
  load(ASTRAL_OBJ.chestClosed,'chest-closed.webp');
  load(ASTRAL_OBJ.chestOpen,'chest-open.webp');
  load(ASTRAL_OBJ.relic,'secret-relic.webp');
  load(ASTRAL_OBJ.pedestal,'secret-relic.webp');
  load(ASTRAL_OBJ.routeBanner,'checkpoint-off.webp');
  load(ASTRAL_OBJ.signMarker,'checkpoint-off.webp');
  load(ASTRAL_OBJ.arch,'arch.webp');
  load(ASTRAL_OBJ.waterfall,'waterfall.webp');
  load(ASTRAL_OBJ.crystalCluster,'crystal-cluster.webp');
  load(ASTRAL_OBJ.vegetationPink,'crystal-cluster.webp');
  load(ASTRAL_OBJ.vegetationGreen,'crystal-cluster.webp');
}
