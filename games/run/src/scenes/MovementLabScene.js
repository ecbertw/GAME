import { Runner } from '../player/Runner.js';
import { RunnerController } from '../player/RunnerController.js';
import { RunnerAnimator } from '../player/RunnerAnimator.js';
import { RunCamera } from '../camera/RunCamera.js';
import { RUNNER_ATLAS } from '../assets/runner-manifest.js';
import { MOVEMENT } from '../config/movement.js';
import { MovementFx } from '../effects/MovementFx.js';

export class MovementLabScene extends Phaser.Scene {
  constructor() {
    super('MovementLab');
    this.spawn = { x: 220, y: 480 };
    this.respawning = false;
  }

  preload() {
    this.runnerAssetFailed = false;
    this.load.on('loaderror', file => {
      if (file && file.key === RUNNER_ATLAS.key) this.runnerAssetFailed = true;
    });
    this.load.spritesheet(RUNNER_ATLAS.key, RUNNER_ATLAS.file, {
      frameWidth: RUNNER_ATLAS.frameWidth,
      frameHeight: RUNNER_ATLAS.frameHeight,
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, 3600, 900);
    this.cameras.main.setBackgroundColor('#0b1220');

    this.drawLabBackdrop();
    this.platforms = [];
    this.hazards = [];

    this.addPlatform(480, 620, 960, 90, 0x27364f);
    this.addPlatform(1160, 620, 220, 90, 0x32435f);
    this.addPlatform(1460, 550, 180, 48, 0x32435f);
    this.addPlatform(1730, 480, 150, 48, 0x32435f);
    this.addPlatform(2010, 620, 430, 90, 0x27364f);
    this.addPlatform(2420, 540, 180, 48, 0x32435f);
    this.addPlatform(2730, 455, 190, 48, 0x32435f);
    this.addPlatform(3140, 620, 720, 90, 0x27364f);

    this.addHazard(930, 582, 110, 20);
    this.addHazard(2215, 582, 90, 20);
    this.addHazard(2910, 582, 120, 20);

    if (this.runnerAssetFailed || !this.textures.exists(RUNNER_ATLAS.key)) {
      this.add.text(640, 230, 'APPROVED RUNNER ASSET FAILED\nThe approved EIXO RUN atlas did not load.', {
        align: 'center', fontFamily: 'monospace', fontSize: '22px', color: '#ff6d8a',
        backgroundColor: '#220914dd', padding: { x: 18, y: 14 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
    }

    this.fx = new MovementFx(this);
    this.runner = new Runner(this, this.spawn.x, this.spawn.y);
    this.controller = new RunnerController(this, this.runner, event => this.handleMovementEvent(event));
    this.animator = new RunnerAnimator(this.runner);
    this.runCamera = new RunCamera(this, this.runner);

    for (const platform of this.platforms) this.physics.add.collider(this.runner.collider, platform);
    for (const hazard of this.hazards) this.physics.add.overlap(this.runner.collider, hazard, () => this.killRunner());

    this.debugText = this.add.text(18, 18, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d7e7ff',
      backgroundColor: '#07101dcc',
      padding: { x: 12, y: 10 },
      lineSpacing: 5,
    }).setScrollFactor(0).setDepth(1000);

    this.add.text(18, 665, 'A/D or ←/→  MOVE   •   SPACE/W/↑  JUMP   •   R  RESET   •   H  HITBOX', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#91a8c8',
    }).setScrollFactor(0).setDepth(1000);

    this.input.keyboard.on('keydown-R', () => this.respawn(true));
    this.hitboxVisible = false;
    this.input.keyboard.on('keydown-H', () => {
      this.hitboxVisible = !this.hitboxVisible;
      this.runner.collider.setFillStyle(this.hitboxVisible ? 0x62e6ff : 0xffffff, this.hitboxVisible ? 0.18 : 0);
      this.runner.collider.setStrokeStyle(this.hitboxVisible ? 1 : 0, 0x62e6ff, this.hitboxVisible ? 0.9 : 0);
    });
    this.runCamera.reset();
  }

  drawLabBackdrop() {
    const graphics = this.add.graphics().setDepth(-20);
    graphics.fillStyle(0x0b1220, 1).fillRect(0, 0, 3600, 900);
    graphics.lineStyle(1, 0x1a2a43, 0.55);
    for (let x = 0; x <= 3600; x += 80) graphics.lineBetween(x, 0, x, 900);
    for (let y = 0; y <= 900; y += 80) graphics.lineBetween(0, y, 3600, y);
    graphics.lineStyle(2, 0x314869, 0.65).lineBetween(0, 620, 3600, 620);

    this.add.text(210, 360, 'ACCELERATION', { fontSize: '24px', color: '#3e5f88', fontStyle: 'bold' });
    this.add.text(1010, 385, 'SHORT GAP', { fontSize: '20px', color: '#3e5f88', fontStyle: 'bold' });
    this.add.text(1370, 300, 'HEIGHT', { fontSize: '20px', color: '#3e5f88', fontStyle: 'bold' });
    this.add.text(2030, 360, 'SKID / REVERSE', { fontSize: '22px', color: '#3e5f88', fontStyle: 'bold' });
    this.add.text(2650, 265, 'CAMERA', { fontSize: '22px', color: '#3e5f88', fontStyle: 'bold' });
  }

  addPlatform(x, y, width, height, color) {
    const rect = this.add.rectangle(x, y, width, height, color, 1).setDepth(1);
    rect.setStrokeStyle(2, 0x58749b, 0.8);
    this.physics.add.existing(rect, true);
    this.platforms.push(rect);
    return rect;
  }

  addHazard(x, y, width, height) {
    const rect = this.add.rectangle(x, y, width, height, 0xbe2448, 0.92).setDepth(2);
    rect.setStrokeStyle(2, 0xff6d8a, 0.95);
    this.physics.add.existing(rect, true);
    this.hazards.push(rect);
    return rect;
  }

  handleMovementEvent(event) {
    if (event.type === 'jump') this.fx.jump(this.runner);
    if (event.type === 'skid') this.fx.skid(this.runner);
    if (event.type === 'land') this.fx.land(this.runner, false);
    if (event.type === 'hardLand') {
      this.fx.land(this.runner, true);
      this.cameras.main.shake(70, 0.0025);
    }
  }

  killRunner() {
    if (this.respawning || this.runner.dead) return;
    this.respawning = true;
    this.runner.dead = true;
    this.controller.enabled = false;
    this.runner.body.setVelocity(0, 0);
    this.runner.body.enable = false;
    this.animator.update('death', 0);
    this.fx.death(this.runner);
    this.tweens.add({ targets: this.runner.visual, alpha: 0.18, duration: 280, ease: 'Quad.easeOut' });
    this.time.delayedCall(MOVEMENT.respawnMs, () => this.respawn(false));
  }

  respawn(manual = false) {
    this.respawning = false;
    this.runner.body.enable = true;
    this.runner.visual.setAlpha(1);
    this.runner.setPosition(this.spawn.x, this.spawn.y);
    this.controller.reset();
    this.animator.reset();
    if (manual) {
      this.fx.clear();
      this.runCamera.reset();
    }
  }

  update(_time, delta) {
    if (!this.runner) return;
    if (this.runner.y > 850) this.killRunner();

    this.controller.update(delta);
    this.animator.update(this.controller.getState(), delta);
    this.runner.syncVisual();
    this.runCamera.update(delta);
    this.fx.update(delta);

    const velocity = this.runner.body.velocity;
    const grounded = this.runner.body.blocked.down || this.runner.body.touching.down;
    this.debugText.setText([
      'EIXO RUN — MOVEMENT LAB',
      `STATE      ${this.controller.getState().toUpperCase()}`,
      `SPEED X    ${Math.round(velocity.x)} px/s`,
      `SPEED Y    ${Math.round(velocity.y)} px/s`,
      `GROUNDED   ${grounded ? 'YES' : 'NO'}`,
      `COYOTE     ${Math.round(this.controller.coyoteMs)} ms`,
      `BUFFER     ${Math.round(this.controller.jumpBufferMs)} ms`,
      `HITBOX     ${this.hitboxVisible ? 'ON' : 'OFF'}`,
    ]);
  }
}
