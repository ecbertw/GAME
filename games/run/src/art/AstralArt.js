import { BG_SKY, BG_WORLD } from '../assets/astral-data/backdrops.js';
import { SHARD, CHECKPOINT_OFF, CHECKPOINT_ON, BREAKABLE, SPIKES } from '../assets/astral-data/objects-a.js';
import { BOUNCE, SPEED, FINISH, CHEST_CLOSED, CHEST_OPEN, RELIC } from '../assets/astral-data/objects-b.js';
import { ARCH, WATERFALL, CRYSTAL_CLUSTER } from '../assets/astral-data/objects-c.js';
import { PLATFORM } from '../assets/astral-data/platform.js';

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

export function preloadAstralArt(scene) {
  const load=(key,data)=>scene.load.image(key,data);

  // Same transport strategy as the approved Runner: embedded data URIs.
  // This removes Nginx/session/CSP/static-path variability from Phaser's loader.
  load(ASTRAL_BG.sky, BG_SKY);
  load(ASTRAL_BG.world, BG_WORLD);

  load(ASTRAL_OBJ.platformLarge, PLATFORM);
  load(ASTRAL_OBJ.platformMedium, PLATFORM);
  load(ASTRAL_OBJ.platformSmall, PLATFORM);
  load(ASTRAL_OBJ.platformMoving, PLATFORM);
  load(ASTRAL_OBJ.floatingIsland, PLATFORM);

  load(ASTRAL_OBJ.shard, SHARD);
  load(ASTRAL_OBJ.checkpointOff, CHECKPOINT_OFF);
  load(ASTRAL_OBJ.checkpointOn, CHECKPOINT_ON);
  load(ASTRAL_OBJ.breakable, BREAKABLE);
  load(ASTRAL_OBJ.spikes, SPIKES);
  load(ASTRAL_OBJ.dangerCrystal, SPIKES);
  load(ASTRAL_OBJ.bounce, BOUNCE);
  load(ASTRAL_OBJ.speed, SPEED);
  load(ASTRAL_OBJ.finish, FINISH);
  load(ASTRAL_OBJ.chestClosed, CHEST_CLOSED);
  load(ASTRAL_OBJ.chestOpen, CHEST_OPEN);
  load(ASTRAL_OBJ.relic, RELIC);
  load(ASTRAL_OBJ.pedestal, RELIC);
  load(ASTRAL_OBJ.routeBanner, CHECKPOINT_OFF);
  load(ASTRAL_OBJ.signMarker, CHECKPOINT_OFF);
  load(ASTRAL_OBJ.arch, ARCH);
  load(ASTRAL_OBJ.waterfall, WATERFALL);
  load(ASTRAL_OBJ.crystalCluster, CRYSTAL_CLUSTER);
  load(ASTRAL_OBJ.vegetationPink, CRYSTAL_CLUSTER);
  load(ASTRAL_OBJ.vegetationGreen, CRYSTAL_CLUSTER);
}
