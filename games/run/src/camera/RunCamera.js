import { MOVEMENT, clamp } from '../config/movement.js';

export class RunCamera {
  constructor(scene, runner) {
    this.scene = scene;
    this.runner = runner;
    this.lookAhead = 0;
    this.target = scene.add.zone(runner.x, runner.y, 1, 1);

    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, 3600, 900);
    this.camera.setDeadzone(260, 180);
    this.camera.startFollow(this.target, false, 0.10, 0.08);
  }

  reset() {
    this.lookAhead = 0;
    this.target.setPosition(this.runner.x, this.runner.y);
    this.camera.centerOn(this.runner.x, this.runner.y);
  }

  update(deltaMs) {
    const dt = Math.min(0.033, deltaMs / 1000);
    const velocityRatio = clamp(this.runner.body.velocity.x / MOVEMENT.maxRunSpeed, -1, 1);
    const desiredLookAhead = velocityRatio * MOVEMENT.cameraLookAhead;
    const xBlend = 1 - Math.exp(-MOVEMENT.cameraLookAheadRate * dt);
    const yBlend = 1 - Math.exp(-MOVEMENT.cameraVerticalRate * dt);
    this.lookAhead = Phaser.Math.Linear(this.lookAhead, desiredLookAhead, xBlend);
    this.target.x = Phaser.Math.Linear(this.target.x, this.runner.x + this.lookAhead, xBlend);
    this.target.y = Phaser.Math.Linear(this.target.y, this.runner.y - 30, yBlend);
  }
}
