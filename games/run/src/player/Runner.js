import { MOVEMENT } from '../config/movement.js';
import { RUNNER_ATLAS, RUNNER_FRAME_INDEX } from '../assets/runner-manifest.js';

export class Runner {
  constructor(scene, x, y) {
    this.scene = scene;
    this.facing = 1;
    this.dead = false;

    this.collider = scene.add.rectangle(x, y, MOVEMENT.bodyWidth, MOVEMENT.bodyHeight, 0xffffff, 0);
    scene.physics.add.existing(this.collider);
    this.collider.body.setCollideWorldBounds(true);
    this.collider.body.setMaxVelocity(MOVEMENT.maxRunSpeed, MOVEMENT.maxFallSpeed);

    this.visual = scene.add.image(x, y, RUNNER_ATLAS.key, RUNNER_FRAME_INDEX.idle_01).setDepth(20);
    this.visual.setScale(MOVEMENT.spriteScale);
    this.setFrame('idle_01');
  }

  get body() {
    return this.collider.body;
  }

  get x() {
    return this.collider.x;
  }

  get y() {
    return this.collider.y;
  }

  setFrame(frameName) {
    const frameIndex = RUNNER_FRAME_INDEX[frameName] ?? RUNNER_FRAME_INDEX.idle_01;
    this.visual.setTexture(RUNNER_ATLAS.key, frameIndex);
    this.visual.setOrigin(RUNNER_ATLAS.originX, RUNNER_ATLAS.originY);
    this.visual.setFlipX(this.facing < 0);
  }

  setFacing(direction) {
    if (direction) this.facing = direction < 0 ? -1 : 1;
    this.visual.setFlipX(this.facing < 0);
  }

  syncVisual() {
    const feetY = this.collider.y + MOVEMENT.bodyHeight / 2 + 4;
    this.visual.setPosition(this.collider.x, feetY);
  }

  setPosition(x, y) {
    this.collider.setPosition(x, y);
    this.body.setVelocity(0, 0);
    this.syncVisual();
  }

  destroy() {
    this.visual.destroy();
    this.collider.destroy();
  }
}
