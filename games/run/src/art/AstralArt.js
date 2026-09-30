import {
  ASTRAL_BACKGROUND_ATLAS,
  ASTRAL_OBJECT_ATLAS,
  ASTRAL_BACKGROUND_FRAMES,
  ASTRAL_OBJECT_FRAMES,
} from '../assets/astral-data/final-atlases.js';

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

const RAW_BG='run-astral-background-atlas-source';
const RAW_OBJ='run-astral-object-atlas-source';

export function preloadAstralArt(scene) {
  // Same reliable transport as the Runner: embedded data URI images.
  scene.load.image(RAW_BG, ASTRAL_BACKGROUND_ATLAS);
  scene.load.image(RAW_OBJ, ASTRAL_OBJECT_ATLAS);
}

function createTextureFromFrame(scene, key, source, frame) {
  if (!frame) throw new Error('Missing atlas frame for '+key);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const { x, y, w, h } = frame.frame;
  const texture = scene.textures.createCanvas(key, w, h);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  texture.refresh();
  return texture;
}

function drawFrame(ctx, source, frame, dx, dy, dw = null, dh = null) {
  const { x, y, w, h } = frame.frame;
  ctx.drawImage(source, x, y, w, h, dx, dy, dw ?? w, dh ?? h);
}

export function installAstralTextures(scene) {
  const bgSource = scene.textures.get(RAW_BG).getSourceImage();
  const objSource = scene.textures.get(RAW_OBJ).getSourceImage();
  if (!bgSource || !objSource) throw new Error('RUN atlas source image unavailable');

  // Individual background sky texture.
  createTextureFromFrame(scene, ASTRAL_BG.sky, bgSource, ASTRAL_BACKGROUND_FRAMES['sky-backdrop']);

  // Canonical FIRST LIGHT panorama assembled from the approved 5 environment strips.
  if (scene.textures.exists(ASTRAL_BG.world)) scene.textures.remove(ASTRAL_BG.world);
  const worldW = 1536, worldH = 720;
  const world = scene.textures.createCanvas(ASTRAL_BG.world, worldW, worldH);
  const ctx = world.getContext();
  ctx.clearRect(0, 0, worldW, worldH);

  drawFrame(ctx, bgSource, ASTRAL_BACKGROUND_FRAMES['sky-backdrop'], 0, 0, worldW, 222);
  drawFrame(ctx, bgSource, ASTRAL_BACKGROUND_FRAMES['far-clouds'], 0, 150, worldW, 132);
  drawFrame(ctx, bgSource, ASTRAL_BACKGROUND_FRAMES['far-ruins'], 0, 255, worldW, 157);
  drawFrame(ctx, bgSource, ASTRAL_BACKGROUND_FRAMES['mid-ruins'], 0, 375, worldW, 204);
  drawFrame(ctx, bgSource, ASTRAL_BACKGROUND_FRAMES['foreground'], 0, 560, worldW, 160);
  world.refresh();

  const map = [
    [ASTRAL_OBJ.checkpointOn, 'checkpoint-on'],
    [ASTRAL_OBJ.checkpointOff, 'checkpoint-off'],
    [ASTRAL_OBJ.arch, 'arch'],
    [ASTRAL_OBJ.finish, 'finish-gate'],
    [ASTRAL_OBJ.routeBanner, 'route-banner'],
    [ASTRAL_OBJ.floatingIsland, 'floating-island'],
    [ASTRAL_OBJ.dangerCrystal, 'danger-crystal'],
    [ASTRAL_OBJ.waterfall, 'waterfall'],
    [ASTRAL_OBJ.platformLarge, 'platform-large'],
    [ASTRAL_OBJ.breakable, 'breakable'],
    [ASTRAL_OBJ.shard, 'shard'],
    [ASTRAL_OBJ.spikes, 'spikes'],
    [ASTRAL_OBJ.chestOpen, 'chest-open'],
    [ASTRAL_OBJ.crystalCluster, 'crystal-cluster'],
    [ASTRAL_OBJ.relic, 'secret-relic'],
    [ASTRAL_OBJ.pedestal, 'collectible-pedestal'],
    [ASTRAL_OBJ.signMarker, 'sign-marker'],
    [ASTRAL_OBJ.platformMedium, 'platform-medium'],
    [ASTRAL_OBJ.bounce, 'bounce-pad'],
    [ASTRAL_OBJ.chestClosed, 'chest-closed'],
    [ASTRAL_OBJ.platformSmall, 'platform-small'],
    [ASTRAL_OBJ.vegetationPink, 'vegetation-pink'],
    [ASTRAL_OBJ.platformMoving, 'platform-moving'],
    [ASTRAL_OBJ.vegetationGreen, 'vegetation-green'],
    [ASTRAL_OBJ.speed, 'speed-strip'],
  ];

  for (const [key, frameName] of map) {
    createTextureFromFrame(scene, key, objSource, ASTRAL_OBJECT_FRAMES[frameName]);
  }

  // Keep a dedicated spikes key and danger-crystal key distinct.
  createTextureFromFrame(scene, ASTRAL_OBJ.spikes, objSource, ASTRAL_OBJECT_FRAMES['spikes']);

  return true;
}
