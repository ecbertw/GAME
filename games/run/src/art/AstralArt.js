import {
  ASTRAL_BACKGROUND_ATLAS,
  ASTRAL_OBJECT_ATLAS,
  ASTRAL_BACKGROUND_FRAMES,
  ASTRAL_OBJECT_FRAMES,
} from '../assets/astral-data/final-atlases.js';

export const ASTRAL_BG = Object.freeze({
  sky: 'run-bg-sky',
  clouds: 'run-bg-clouds',
  far: 'run-bg-far',
  mid: 'run-bg-mid',
  foreground: 'run-bg-foreground',
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
}

export function installAstralTextures(scene) {
  const bgSource = scene.textures.get(RAW_BG).getSourceImage();
  const objSource = scene.textures.get(RAW_OBJ).getSourceImage();
  if (!bgSource || !objSource) throw new Error('RUN atlas source image unavailable');

  const bgMap = [
    [ASTRAL_BG.sky, 'sky-backdrop'],
    [ASTRAL_BG.clouds, 'far-clouds'],
    [ASTRAL_BG.far, 'far-ruins'],
    [ASTRAL_BG.mid, 'mid-ruins'],
    [ASTRAL_BG.foreground, 'foreground'],
  ];
  for (const [key, frameName] of bgMap) {
    createTextureFromFrame(scene, key, bgSource, ASTRAL_BACKGROUND_FRAMES[frameName]);
  }

  const objectMap = [
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
  for (const [key, frameName] of objectMap) {
    createTextureFromFrame(scene, key, objSource, ASTRAL_OBJECT_FRAMES[frameName]);
  }

  return true;
}
