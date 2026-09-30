import { RUNNER_ATLAS, RUNNER_FRAME_INDEX } from '../assets/runner-manifest.js';
import { MOVEMENT } from '../config/movement.js';

const ROOT = Object.freeze({ x: 64, y: 112 });
const SOURCE_FRAME = 'run_01';

const PARTS = Object.freeze({
  core: {
    polygon: [[38,28],[79,24],[94,38],[91,54],[84,62],[73,70],[72,81],[64,86],[51,84],[46,76],[45,68],[39,58]],
    pivot: [64,112],
  },
  armFar: {
    polygon: [[24,53],[43,50],[53,57],[54,65],[48,72],[33,73],[24,66]],
    pivot: [47,58],
  },
  armNear: {
    polygon: [[61,56],[76,56],[89,65],[88,74],[81,80],[70,79],[62,70]],
    pivot: [66,59],
  },
  legFar: {
    polygon: [[47,75],[59,75],[61,84],[56,91],[55,102],[48,108],[38,106],[34,99],[35,90],[42,82]],
    pivot: [55,78],
  },
  legNear: {
    polygon: [[58,75],[72,76],[77,84],[83,89],[93,90],[97,98],[93,104],[84,111],[67,110],[61,101],[59,90]],
    pivot: [64,78],
  },
});

const deg = value => value * Math.PI / 180;

export function sampleRunPose(phase) {
  const p = ((phase % 1) + 1) % 1;
  const swing = Math.cos(p * Math.PI * 2);
  return Object.freeze({
    phase: p,
    swing,
    legNearDeg: -swing * 38,
    legFarDeg: swing * 38,
    armNearDeg: swing * 26,
    armFarDeg: -swing * 26,
  });
}

function buildMaskedTexture(scene, key, sourceImage, frame, polygon) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, RUNNER_ATLAS.frameWidth, RUNNER_ATLAS.frameHeight);
  const ctx = texture.context;
  ctx.clearRect(0, 0, RUNNER_ATLAS.frameWidth, RUNNER_ATLAS.frameHeight);
  ctx.save();
  ctx.beginPath();
  polygon.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    sourceImage,
    frame.cutX,
    frame.cutY,
    frame.cutWidth,
    frame.cutHeight,
    0,
    0,
    RUNNER_ATLAS.frameWidth,
    RUNNER_ATLAS.frameHeight,
  );
  ctx.restore();
  texture.refresh();
}

function makePart(scene, key, config) {
  const [px, py] = config.pivot;
  return scene.add.image(px - ROOT.x, py - ROOT.y, key)
    .setOrigin(px / RUNNER_ATLAS.frameWidth, py / RUNNER_ATLAS.frameHeight);
}

export class RunnerRig {
  constructor(scene) {
    this.scene = scene;
    this.pose = sampleRunPose(0);

    const atlas = scene.textures.get(RUNNER_ATLAS.key);
    const frame = atlas.get(RUNNER_FRAME_INDEX[SOURCE_FRAME]);
    const sourceImage = atlas.getSourceImage();

    for (const [name, config] of Object.entries(PARTS)) {
      buildMaskedTexture(scene, `runnerRig:${name}`, sourceImage, frame, config.polygon);
    }

    this.armFar = makePart(scene, 'runnerRig:armFar', PARTS.armFar);
    this.legFar = makePart(scene, 'runnerRig:legFar', PARTS.legFar);
    this.core = makePart(scene, 'runnerRig:core', PARTS.core);
    this.legNear = makePart(scene, 'runnerRig:legNear', PARTS.legNear);
    this.armNear = makePart(scene, 'runnerRig:armNear', PARTS.armNear);

    this.container = scene.add.container(0, 0, [
      this.armFar,
      this.legFar,
      this.core,
      this.legNear,
      this.armNear,
    ]).setDepth(20).setVisible(false);

    this.setFacing(1);
    this.applyPhase(0);
  }

  setFacing(direction) {
    const facing = direction < 0 ? -1 : 1;
    this.container.setScale(facing * MOVEMENT.spriteScale, MOVEMENT.spriteScale);
  }

  setPosition(x, feetY) {
    this.container.setPosition(Math.round(x), Math.round(feetY));
  }

  setVisible(visible) {
    this.container.setVisible(visible);
  }

  setAlpha(alpha) {
    this.container.setAlpha(alpha);
  }

  applyPhase(phase) {
    const pose = sampleRunPose(phase);
    this.pose = pose;

    this.legNear.setRotation(deg(pose.legNearDeg));
    this.legFar.setRotation(deg(pose.legFarDeg));
    this.armNear.setRotation(deg(pose.armNearDeg));
    this.armFar.setRotation(deg(pose.armFarDeg));

    // Keep the approved torso/head art intact. Only a tiny counter-lean is applied.
    this.core.setRotation(deg(5 + pose.swing * 1.5));
    this.core.y = PARTS.core.pivot[1] - ROOT.y - Math.abs(Math.sin(phase * Math.PI * 2)) * 1.5;
  }

  destroy() {
    this.container.destroy(true);
  }
}
