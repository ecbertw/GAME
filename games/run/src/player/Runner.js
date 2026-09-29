import { MOVEMENT } from '../config/movement.js';
import { RUNNER_FRAMES, RUNNER_META } from '../assets/runner-manifest.js';

export class Runner {
  constructor(scene, x, y) {
    this.scene = scene;
    this.facing = 1;
    this.dead = false;

    this.collider = scene.add.rectangle(x, y, MOVEMENT.bodyWidth, MOVEMENT.bodyHeight, 0xffffff, 0);
    scene.physics.add.existing(this.collider);
    this.collider.body.setCollideWorldBounds(true);
    this.collider.body.setMaxVelocity(MOVEMENT.maxRunSpeed, MOVEMENT.maxFallSpeed);

    this.visual = scene.add.image(x, y, RUNNER_FRAMES.idle_01.key).setDepth(20);
    this.visual.setScale(MOVEMENT.spriteScale);
    this.visual.setOrigin(RUNNER_META.originX, RUNNER_META.originY);
    this.setFrame('idle_01');
    this.syncVisual();
  }

  get body() { return this.collider.body; }
  get x() { return this.collider.x; }
  get y() { return this.collider.y; }

  setFrame(frameName) {
    const asset = RUNNER_FRAMES[frameName] || RUNNER_FRAMES.idle_01;
    this.visual.setTexture(asset.key);
    this.visual.setOrigin(RUNNER_META.originX, RUNNER_META.originY);
    this.visual.setFlipX(this.facing < 0);
  }

  setFacing(direction) {
    if (direction) this.facing = direction < 0 ? -1 : 1;
    this.visual.setFlipX(this.facing < 0);
  }

  syncVisual() {
    const feetY = this.collider.y + MOVEMENT.bodyHeight / 2 + 2;
    this.visual.setPosition(Math.round(this.collider.x), Math.round(feetY));
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
