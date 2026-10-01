import { SHARD, CHECKPOINT_ON, BREAKABLE, SPIKES } from '../assets/astral-data/objects-a.js';
import { BOUNCE, SPEED, FINISH, CHEST_CLOSED, CHEST_OPEN, RELIC } from '../assets/astral-data/objects-b.js';
import { ARCH, WATERFALL, CRYSTAL_CLUSTER } from '../assets/astral-data/objects-c.js';

export const ASTRAL_BG = Object.freeze({
  world: 'run-bg-world',
});

export const ASTRAL_OBJ = Object.freeze({
  platformLarge: 'run-platform-large',
  platformMedium: 'run-platform-medium',
  platformSmall: 'run-platform-small',
  platformMoving: 'run-platform-moving',
  floatingIsland: 'run-platform-small',
  shard: 'run-shard',
  checkpointOff: 'run-checkpoint-on',
  checkpointOn: 'run-checkpoint-on',
  breakable: 'run-breakable',
  spikes: 'run-spikes',
  dangerCrystal: 'run-spikes',
  bounce: 'run-bounce',
  speed: 'run-speed',
  finish: 'run-finish',
  chestClosed: 'run-chest-closed',
  chestOpen: 'run-chest-open',
  relic: 'run-secret-relic',
  pedestal: 'run-secret-relic',
  arch: 'run-arch',
  waterfall: 'run-waterfall',
  crystalCluster: 'run-crystal-cluster',
  vegetationPink: 'run-crystal-cluster',
  vegetationGreen: 'run-crystal-cluster',
});

export function preloadAstralArt(scene) {
  scene.load.image(ASTRAL_BG.world, '/games/run/assets/final-real/first-light-bg-1280.webp');
  scene.load.image(ASTRAL_OBJ.platformLarge, '/games/run/assets/final-real/platform-large.webp');
  scene.load.image(ASTRAL_OBJ.platformMedium, '/games/run/assets/final-real/platform-medium.webp');
  scene.load.image(ASTRAL_OBJ.platformSmall, '/games/run/assets/final-real/platform-small.webp');
  scene.load.image(ASTRAL_OBJ.platformMoving, '/games/run/assets/final-real/platform-moving.webp');

  const load=(key,data)=>scene.load.image(key,data);
  load(ASTRAL_OBJ.shard, SHARD);
  load(ASTRAL_OBJ.checkpointOn, CHECKPOINT_ON);
  load(ASTRAL_OBJ.breakable, BREAKABLE);
  load(ASTRAL_OBJ.spikes, SPIKES);
  load(ASTRAL_OBJ.bounce, BOUNCE);
  load(ASTRAL_OBJ.speed, SPEED);
  load(ASTRAL_OBJ.finish, FINISH);
  load(ASTRAL_OBJ.chestClosed, CHEST_CLOSED);
  load(ASTRAL_OBJ.chestOpen, CHEST_OPEN);
  load(ASTRAL_OBJ.relic, RELIC);
  load(ASTRAL_OBJ.arch, ARCH);
  load(ASTRAL_OBJ.waterfall, WATERFALL);
  load(ASTRAL_OBJ.crystalCluster, CRYSTAL_CLUSTER);
}

export function installAstralTextures() {
  return true;
}
