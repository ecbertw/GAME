import { BG_SKY } from '../assets/astral-data/backdrops.js';
import { SHARD, CHECKPOINT_ON, BREAKABLE, SPIKES } from '../assets/astral-data/objects-a.js';
import { BOUNCE, SPEED, FINISH, CHEST_CLOSED, CHEST_OPEN, RELIC } from '../assets/astral-data/objects-b.js';
import { ARCH, WATERFALL, CRYSTAL_CLUSTER } from '../assets/astral-data/objects-c.js';
import { PLATFORM } from '../assets/astral-data/platform.js';

export const ASTRAL_BG = Object.freeze({
  sky: 'run-bg-sky',
  world: 'run-bg-sky',
});

export const ASTRAL_OBJ = Object.freeze({
  platformLarge: 'run-platform-large',
  platformMedium: 'run-platform-large',
  platformSmall: 'run-platform-large',
  platformMoving: 'run-platform-large',
  floatingIsland: 'run-platform-large',
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
  const load=(key,data)=>scene.load.image(key,data);

  load(ASTRAL_BG.sky, BG_SKY);
  load(ASTRAL_OBJ.platformLarge, PLATFORM);

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
