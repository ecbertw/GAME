import { Runner } from '../player/Runner.js';
import { RunnerController } from '../player/RunnerController.js';
import { RunnerAnimator } from '../player/RunnerAnimator.js';
import { RunCamera } from '../camera/RunCamera.js';
import { RUNNER_ATLAS } from '../assets/runner-manifest.js';
import { MOVEMENT } from '../config/movement.js';
import { MovementFx } from '../effects/MovementFx.js';
import { RunHud } from '../ui/RunHud.js';
import { ASTRAL_KEYS, preloadAstralArt } from '../art/AstralArt.js';

const WORLD_WIDTH = 9800;
const WORLD_HEIGHT = 900;

export class FirstLightScene extends Phaser.Scene {
  constructor() {
    super('FirstLight');
    this.spawn = { x: 250, y: 510 };
    this.checkpointSpawn = { ...this.spawn };
    this.checkpointIndex = 0;
    this.respawning = false;
    this.shardsCollected = 0;
    this.relicFound = false;
    this.finished = false;
  }

  preload() {
    preloadAstralArt(this);
    this.load.spritesheet(RUNNER_ATLAS.key, RUNNER_ATLAS.file, {
      frameWidth: RUNNER_ATLAS.frameWidth,
      frameHeight: RUNNER_ATLAS.frameHeight,
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#0a1a38');
    this.createAstralBackdrop();

    this.platforms = [];
    this.hazards = [];
    this.shards = [];
    this.checkpoints = [];
    this.breakables = [];
    this.decor = [];

    this.buildFirstLight();

    this.fx = new MovementFx(this);
    this.runner = new Runner(this, this.spawn.x, this.spawn.y);
    this.controller = new RunnerController(this, this.runner, event => this.handleMovementEvent(event));
    this.animator = new RunnerAnimator(this.runner);
    this.runCamera = new RunCamera(this, this.runner, { width: WORLD_WIDTH, height: WORLD_HEIGHT });

    for (const platform of this.platforms) this.physics.add.collider(this.runner.collider, platform.bodyObject || platform);
    for (const block of this.breakables) this.physics.add.collider(this.runner.collider, block.bodyObject, () => this.tryBreakBlock(block));
    for (const hazard of this.hazards) this.physics.add.overlap(this.runner.collider, hazard.bodyObject || hazard, () => this.killRunner());
    for (const shard of this.shards) this.physics.add.overlap(this.runner.collider, shard.bodyObject, () => this.collectShard(shard));
    for (const cp of this.checkpoints) this.physics.add.overlap(this.runner.collider, cp.trigger, () => this.activateCheckpoint(cp));
    this.physics.add.overlap(this.runner.collider, this.finishTrigger, () => this.finishRun());
    this.physics.add.overlap(this.runner.collider, this.relic.trigger, () => this.collectRelic());
    this.physics.add.overlap(this.runner.collider, this.bouncePad.trigger, () => this.triggerBounce());
    this.physics.add.overlap(this.runner.collider, this.speedStrip.trigger, () => this.triggerSpeedStrip());

    this.hud = new RunHud(this, { totalShards: this.shards.length, worldWidth: WORLD_WIDTH });

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-ENTER', () => { if (this.finished) this.scene.restart(); });
    this.input.keyboard.on('keydown-H', () => { if (this.finished) window.location.assign('/'); });
    this.input.keyboard.on('keydown-R', () => { if (!this.finished) this.respawn(true); });

    this.add.text(24, 684, 'A/D ou ←/→  CORRER   ·   SPACE/W/↑  SALTAR   ·   R  CHECKPOINT   ·   ESC  PAUSA', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#8ba8cb',
      backgroundColor: '#07101db8', padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(5001);
  }

  createAstralBackdrop() {
    this.add.image(640, 360, ASTRAL_KEYS.sky)
      .setScrollFactor(0)
      .setDepth(-1200)
      .setDisplaySize(1280, 720);

    for (let i = 0; i < 8; i += 1) {
      this.add.image(720 + i * 1450, 405 + (i % 2) * 18, ASTRAL_KEYS.far)
        .setScrollFactor(0.12)
        .setDepth(-980)
        .setAlpha(0.64)
        .setScale(0.92 + (i % 3) * 0.04);
      this.add.image(690 + i * 1390, 505 - (i % 3) * 16, ASTRAL_KEYS.mid)
        .setScrollFactor(0.28)
        .setDepth(-820)
        .setAlpha(0.82)
        .setScale(0.86 + (i % 2) * 0.07);
    }

    for (let i = 0; i < 9; i += 1) {
      this.add.image(650 + i * 1210, 810, ASTRAL_KEYS.foreground)
        .setScrollFactor(1.04)
        .setDepth(86)
        .setAlpha(0.68)
        .setScale(0.9 + (i % 2) * 0.08);
    }

    const beam = this.add.graphics().setScrollFactor(0.2).setDepth(-790);
    beam.fillStyle(0x76f5ff, 0.11).fillTriangle(660, 80, 625, 560, 695, 560);
    beam.lineStyle(3, 0xd8ffff, 0.42).lineBetween(660, 55, 660, 570);

    this.drawForegroundMotes();
  }

  drawCloudBand(depth, scrollFactor, baseY, color, alpha) {
    const layer = this.add.graphics().setScrollFactor(scrollFactor).setDepth(depth);
    for (let i = 0; i < 28; i += 1) {
      const x = i * 240 - 220;
      const y = baseY + (i % 3) * 28;
      layer.fillStyle(color, alpha * (0.72 + (i % 4) * .07));
      layer.fillCircle(x, y, 86 + (i % 4) * 16);
      layer.fillCircle(x + 82, y - 30, 65 + (i % 5) * 11);
      layer.fillCircle(x + 155, y + 10, 80 + (i % 3) * 16);
    }
  }

  drawFarRuins() {
    const g = this.add.graphics().setScrollFactor(.12).setDepth(-850);
    for (let baseX = 260; baseX < WORLD_WIDTH * .18; baseX += 420) {
      const x = baseX * .75;
      const h = 80 + ((baseX / 420) % 4) * 22;
      g.fillStyle(0xa9c1f5, .27).fillRect(x, 360 - h, 22, h);
      g.fillRect(x + 110, 360 - h * .85, 18, h * .85);
      g.lineStyle(8, 0xa9c1f5, .22);
      g.strokeEllipse(x + 64, 350, 92, 110);
      g.lineBetween(x + 18, 300, x + 116, 300);
    }
  }

  drawMidRuins() {
    const g = this.add.graphics().setScrollFactor(.28).setDepth(-700);
    for (let i = 0; i < 22; i += 1) {
      const x = 220 + i * 430;
      const y = 470 - (i % 4) * 24;
      g.fillStyle(0x243f75, .72).fillTriangle(x, y + 20, x + 95, y, x + 44, y + 105);
      g.fillStyle(0x5777a7, .75).fillRect(x + 22, y - 42, 15, 62);
      g.fillRect(x + 70, y - 24, 12, 34);
      g.fillStyle(0x52dfff, .45).fillTriangle(x + 48, y + 42, x + 56, y + 78, x + 64, y + 42);
    }
  }

  drawForegroundMotes() {
    for (let i = 0; i < 45; i += 1) {
      const mote = this.add.circle((i * 281) % WORLD_WIDTH, 250 + ((i * 109) % 480), 2 + (i % 3), i % 5 === 0 ? 0xff8fdf : 0x55ddff, .25).setDepth(90);
      this.tweens.add({ targets: mote, y: mote.y - 34 - (i % 4) * 18, alpha: .04, duration: 1600 + (i % 7) * 330, yoyo: true, repeat: -1, delay: (i % 9) * 170, ease: 'Sine.easeInOut' });
    }
  }

  buildFirstLight() {
    const route = [
      [550,650,1100,110],[1320,620,260,70],[1680,560,260,70],[2050,650,430,100],
      [3020,520,240,62],[3410,650,520,100],[4010,580,260,70],[4410,500,220,62],
      [4800,650,520,100],[5390,560,240,70],[5780,470,220,62],[6210,650,540,100],
      [6800,590,250,70],[7170,520,240,62],[7560,650,480,100],[8110,560,250,62],
      [8520,490,220,62],[9160,650,1080,100],
    ];
    route.forEach((p, i) => this.addAstralPlatform(...p, { large: p[2] > 400, waterfall: [0,3,7,11,17].includes(i) }));

    this.addMovingPlatform(2530, 585, 250, 62, 390, 1900);
    this.addMovingPlatform(2860, 475, 210, 58, 0, 1500, 72);
    this.addMovingPlatform(6560, 495, 220, 58, 330, 1700);
    this.addMovingPlatform(7850, 470, 210, 58, 0, 1450, 88);

    this.addAstralPlatform(3710, 430, 180, 52, { alt: true });
    this.addAstralPlatform(4135, 360, 210, 52, { alt: true });
    this.addAstralPlatform(4555, 330, 185, 52, { alt: true });
    this.addAstralPlatform(5180, 390, 210, 52, { alt: true });
    this.addAstralPlatform(5580, 330, 170, 50, { alt: true });

    this.addDangerCrystals(1130, 600, 120);
    this.addDangerCrystals(2205, 600, 120);
    this.addDangerCrystals(3520, 601, 100);
    this.addDangerCrystals(4930, 601, 105);
    this.addDangerCrystals(6310, 601, 115);
    this.addDangerCrystals(7670, 601, 105);
    this.addDangerCrystals(8920, 601, 120);

    this.addBreakableBlock(4465, 444, 84, 84);
    this.addBreakableBlock(5460, 500, 82, 82);

    this.bouncePad = this.addBouncePad(3290, 592);
    this.speedStrip = this.addSpeedStrip(7400, 596);

    this.addCheckpoint(3385, 563, { x: 3380, y: 530 }, 1);
    this.addCheckpoint(7165, 433, { x: 7160, y: 430 }, 2);

    const shardPositions = [
      [620,530],[780,500],[940,520],[1260,520],[1450,470],[1680,430],[1970,515],[2290,485],
      [2530,470],[2860,365],[3020,405],[3370,500],[3710,330],[4135,260],[4555,235],[4800,520],
      [5180,295],[5390,450],[5580,240],[5780,360],[6150,510],[6490,510],[6800,480],[7170,410],
      [7460,510],[7850,365],[8110,450],[8520,380],[8850,510],[9160,510],[9420,500],
    ];
    shardPositions.forEach((p, i) => this.addShard(p[0], p[1], i));

    this.createSecretCave();
    this.createFinishGate();
    this.addSceneSigns();
    this.decorateAstralWorld();
  }

  addAstralPlatform(x, y, width, height, { large = false, waterfall = false, alt = false } = {}) {
    const container = this.add.container(x, y).setDepth(5);
    const key = width > 430 ? ASTRAL_KEYS.platformLarge : width > 225 ? ASTRAL_KEYS.platformMedium : ASTRAL_KEYS.platformSmall;
    const art = this.add.image(0, -height / 2 + 1, key)
      .setOrigin(0.5, 0.12)
      .setDisplaySize(width + (large ? 70 : 44), Math.max(height * 2.05, width * 0.36))
      .setAlpha(alt ? 0.94 : 1);
    if (alt) art.setTint(0xe5dcff);
    container.add(art);

    if (waterfall) {
      const wfWidth = Math.min(160, Math.max(82, width * 0.22));
      const wf = this.add.image(width * 0.23, -height / 2 + 7, ASTRAL_KEYS.waterfall)
        .setOrigin(0.5, 0.08)
        .setDisplaySize(wfWidth, 225)
        .setAlpha(0.9);
      container.add(wf);
      this.tweens.add({ targets: wf, alpha: 0.68, scaleX: wf.scaleX * 1.035, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    if (large && Math.floor(x / 400) % 2 === 0) {
      const cluster = this.add.image(-width * 0.31, -height / 2 - 20, ASTRAL_KEYS.crystalCluster)
        .setOrigin(0.5, 1)
        .setDisplaySize(116, 90)
        .setAlpha(0.92);
      container.add(cluster);
    }

    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    container.bodyObject = bodyObject;
    container.artMeta = { width, height, moving: false };
    this.platforms.push(container);
    return container;
  }

  addVines(container, width, height) {
    const g = this.add.graphics();
    const count = Math.max(2, Math.floor(width / 180));
    for (let i = 0; i < count; i += 1) {
      const vx = -width/2 + 30 + ((i * 137) % Math.max(40, width - 60));
      const len = 28 + (i % 3) * 23;
      g.lineStyle(5, 0x668f2c, .95).lineBetween(vx, -height/2 + 2, vx - 5, -height/2 + len);
      g.fillStyle(0x9dc343, .9).fillCircle(vx - 6, -height/2 + len * .55, 5);
    }
    container.add(g);
  }

  addWaterfall(container, width, topY) {
    const g = this.add.graphics();
    g.fillStyle(0x42dfff, .22).fillRect(-width/2, topY, width, 125);
    g.fillStyle(0xa4fbff, .33).fillRect(-width*.22, topY, width*.20, 125);
    g.fillStyle(0x1aa6ff, .45).fillRect(width*.12, topY, width*.13, 125);
    container.add(g);
    const mist = this.add.ellipse(0, topY + 126, width * 1.45, 26, 0xcafaff, .28);
    container.add(mist);
    this.tweens.add({ targets: mist, scaleX: 1.25, alpha: .12, duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  addMovingPlatform(x, y, width, height, rangeX = 0, duration = 1700, rangeY = 0) {
    const visual = this.add.container(x, y).setDepth(8);
    const art = this.add.image(0, -height / 2 + 1, ASTRAL_KEYS.movingPlatform)
      .setOrigin(0.5, 0.12)
      .setDisplaySize(width + 54, Math.max(150, width * 0.43));
    visual.add(art);

    const halo = this.add.ellipse(0, height * 0.5 + 30, width * 0.72, 24, 0x33e8ff, 0.12);
    visual.add(halo);
    this.tweens.add({ targets: halo, alpha: 0.03, scaleX: 1.16, duration: 750, yoyo: true, repeat: -1 });

    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    visual.bodyObject = bodyObject;
    visual.artMeta = { width, height, moving: true };
    this.platforms.push(visual);

    this.tweens.add({
      targets: visual,
      x: x + rangeX,
      y: y + rangeY,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        bodyObject.setPosition(visual.x, visual.y);
        bodyObject.body.updateFromGameObject();
      },
    });
    return visual;
  }

  addDangerCrystals(x, y, width) {
    const container = this.add.container(x, y).setDepth(10);
    const art = this.add.image(0, 2, ASTRAL_KEYS.spikes)
      .setOrigin(0.5, 1)
      .setDisplaySize(width + 34, Math.max(70, width * 0.5));
    container.add(art);
    const bodyObject = this.add.rectangle(x, y - 18, width, 42, 0xff0000, 0);
    this.physics.add.existing(bodyObject, true);
    container.bodyObject = bodyObject;
    this.hazards.push(container);
  }

  addBreakableBlock(x, y, width, height) {
    const container = this.add.container(x, y).setDepth(9);
    const art = this.add.image(0, 0, ASTRAL_KEYS.breakable)
      .setDisplaySize(width * 1.32, height * 1.32);
    container.add(art);
    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    const item = { container, bodyObject, art, broken: false };
    this.breakables.push(item);
    return item;
  }

  tryBreakBlock(block) {
    if (block.broken || !this.runner) return;
    const closeAbove = this.runner.y < block.bodyObject.y - 24;
    const hard = this.controller.lastAirDownSpeed > 700 || this.runner.body.velocity.y > 700;
    if (!closeAbove || !hard) return;
    block.broken = true;
    block.bodyObject.body.enable = false;
    this.fx.burst(block.bodyObject.x, block.bodyObject.y, { count: 24, spreadX: 280, speedY: 220, life: 480, color: 0x6fe8ff, size: 6, gravity: 360 });
    this.tweens.add({ targets: block.container, alpha: 0, scale: .6, duration: 180, onComplete: () => block.container.destroy() });
  }

  addShard(x, y, index) {
    const container = this.add.container(x, y).setDepth(16);
    const art = this.add.image(0, 0, ASTRAL_KEYS.shard).setDisplaySize(54, 74);
    container.add(art);
    const bodyObject = this.add.rectangle(x, y, 36, 56, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    const shard = { container, bodyObject, art, index, collected: false };
    this.shards.push(shard);
    this.tweens.add({ targets: container, y: y - 9, duration: 900 + (index % 4) * 110, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: art, angle: 3, duration: 900 + (index % 5) * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return shard;
  }

  collectShard(shard) {
    if (shard.collected || this.finished) return;
    shard.collected = true;
    shard.bodyObject.body.enable = false;
    this.shardsCollected += 1;
    this.hud.setShards(this.shardsCollected);
    this.fx.burst(shard.container.x, shard.container.y, { count: 13, spreadX: 150, speedY: 130, life: 360, color: 0x34e3ff, size: 4, gravity: 80 });
    this.tweens.add({ targets: shard.container, alpha: 0, scale: 1.65, duration: 170, ease: 'Quad.easeOut', onComplete: () => shard.container.destroy() });
  }

  addCheckpoint(x, y, spawn, index) {
    const container = this.add.container(x, y).setDepth(15);
    const art = this.add.image(0, -34, ASTRAL_KEYS.checkpointOff)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(120, 177);
    container.add(art);
    const trigger = this.add.rectangle(x, y, 105, 160, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    const cp = { container, trigger, spawn, index, active: false, art };
    this.checkpoints.push(cp);
    this.tweens.add({ targets: art, y: -38, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return cp;
  }

  activateCheckpoint(cp) {
    if (cp.active || this.finished) return;
    this.checkpoints.forEach(other => {
      if (other !== cp) {
        other.active = false;
        other.art?.setTexture(ASTRAL_KEYS.checkpointOff);
      }
    });
    cp.active = true;
    cp.art.setTexture(ASTRAL_KEYS.checkpointOn);
    this.checkpointSpawn = { ...cp.spawn };
    this.checkpointIndex = cp.index;
    this.hud.setCheckpoint(cp.index);
    this.fx.burst(cp.container.x, cp.container.y + 30, { count: 22, spreadX: 190, speedY: 180, life: 520, color: 0xffc94b, size: 4.5, gravity: 40 });
    this.tweens.add({ targets: cp.art, scaleX: cp.art.scaleX * 1.08, scaleY: cp.art.scaleY * 1.08, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
  }

  addBouncePad(x, y) {
    const container = this.add.container(x, y).setDepth(11);
    const art = this.add.image(0, -12, ASTRAL_KEYS.bounce).setDisplaySize(145, 99);
    container.add(art);
    const trigger = this.add.rectangle(x, y - 16, 100, 36, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    this.tweens.add({ targets: art, scaleX: art.scaleX * 1.035, scaleY: art.scaleY * 1.035, duration: 660, yoyo: true, repeat: -1 });
    return { container, trigger, art, coolUntil: 0 };
  }

  triggerBounce() {
    if (!this.runner || this.finished || this.time.now < this.bouncePad.coolUntil) return;
    this.bouncePad.coolUntil = this.time.now + 500;
    this.runner.body.setVelocityY(-980);
    this.fx.burst(this.runner.x, this.runner.y + 40, { count: 16, spreadX: 160, speedY: 180, life: 320, color: 0x3ee8ff, size: 4, gravity: 60 });
  }

  addSpeedStrip(x, y) {
    const container = this.add.container(x, y).setDepth(11);
    const art = this.add.image(0, -12, ASTRAL_KEYS.speed).setDisplaySize(175, 58);
    container.add(art);
    const trigger = this.add.rectangle(x, y - 20, 165, 54, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    return { container, trigger, art, coolUntil: 0 };
  }

  triggerSpeedStrip() {
    if (!this.runner || this.finished || this.time.now < this.speedStrip.coolUntil) return;
    this.speedStrip.coolUntil = this.time.now + 250;
    this.runner.body.setVelocityX(this.runner.facing * Math.max(690, Math.abs(this.runner.body.velocity.x)));
    this.fx.burst(this.runner.x - this.runner.facing * 20, this.runner.y + 20, { count: 11, spreadX: 90, speedY: 70, life: 220, color: 0x50eaff, size: 3.5, gravity: 0, direction: -this.runner.facing * 220 });
  }

  createSecretCave() {
    const x = 5650, y = 730;
    this.addAstralPlatform(x, 820, 500, 64, { alt: true });

    const shadow = this.add.ellipse(x, y + 4, 470, 285, 0x061020, 0.83).setDepth(2);
    const arch = this.add.image(x, y + 82, ASTRAL_KEYS.arch)
      .setOrigin(0.5, 1)
      .setDisplaySize(430, 370)
      .setDepth(3)
      .setTint(0x8fa7d9);
    const crystals = this.add.image(x - 145, y + 66, ASTRAL_KEYS.crystalCluster)
      .setOrigin(0.5, 1)
      .setDisplaySize(150, 115)
      .setDepth(4);

    this.add.text(x, y - 160, 'SEGREDO', { fontFamily: 'Arial Black', fontSize: '13px', color: '#8feeff', backgroundColor: '#07101ddd', padding: { x: 8, y: 4 } }).setOrigin(.5).setDepth(20);

    const chest = this.add.container(x + 82, y + 38).setDepth(13);
    const chestArt = this.add.image(0, 0, ASTRAL_KEYS.chestClosed).setDisplaySize(126, 105);
    chest.add(chestArt);
    const trigger = this.add.rectangle(x + 82, y + 38, 132, 100, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    this.relic = { chest, chestArt, trigger, found: false, shadow, arch, crystals };
  }

  collectRelic() {
    if (this.relic.found || this.finished) return;
    this.relic.found = true;
    this.relicFound = true;
    this.relic.chestArt?.setTexture(ASTRAL_KEYS.chestOpen);
    const relicArt = this.add.image(this.relic.chest.x, this.relic.chest.y - 78, ASTRAL_KEYS.relic).setDisplaySize(112, 108).setDepth(14).setAlpha(0);
    this.tweens.add({ targets: relicArt, alpha: 1, y: relicArt.y - 18, duration: 320, ease: 'Back.easeOut' });
    this.relic.trigger.body.enable = false;
    this.fx.burst(this.relic.chest.x, this.relic.chest.y - 25, { count: 28, spreadX: 230, speedY: 230, life: 650, color: 0xffd35f, size: 5, gravity: 50 });
    this.tweens.add({ targets: this.relic.chest, y: this.relic.chest.y - 18, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    const msg = this.add.text(640, 610, 'RELÍQUIA SECRETA DESCOBERTA', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd45b', backgroundColor: '#07101de8', padding: { x: 18, y: 10 } }).setOrigin(.5).setScrollFactor(0).setDepth(6000);
    this.tweens.add({ targets: msg, alpha: 0, y: 588, delay: 1200, duration: 500, onComplete: () => msg.destroy() });
  }

  createFinishGate() {
    const x = 9490, y = 520;
    const gate = this.add.image(x, y + 52, ASTRAL_KEYS.finish)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(275, 305)
      .setDepth(14);
    this.finishGateArt = gate;
    this.tweens.add({ targets: gate, scaleX: gate.scaleX * 1.018, scaleY: gate.scaleY * 1.018, duration: 980, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.finishTrigger = this.add.rectangle(x, y, 170, 235, 0xffffff, 0);
    this.physics.add.existing(this.finishTrigger, true);
  }

  addSceneSigns() {
    const signs = [
      [1080, 500, 'SALTA'], [3180, 540, 'BOUNCE'], [3620, 510, 'ROTA ↑'], [5560, 610, 'SEGREDO ↓'], [7330, 535, 'BOOST'], [8850, 540, 'FINAL →'],
    ];
    for (const [x,y,label] of signs) {
      const post = this.add.rectangle(x, y, 7, 70, 0x6a5540, 1).setDepth(7);
      const plate = this.add.rectangle(x + 18, y - 38, 112, 36, 0x13253f, 0.95).setStrokeStyle(2, 0x4de8ff, 0.72).setDepth(7);
      this.add.text(x + 18, y - 39, label, { fontFamily: 'Arial Black', fontSize: '11px', color: '#eaffff' }).setOrigin(.5).setDepth(8);
      this.decor.push(post, plate);
    }
  }

  decorateAstralWorld() {
    const arches = [[1510,585,0.72],[4300,550,0.62],[6880,565,0.7],[8740,545,0.58]];
    for (const [x,y,scale] of arches) {
      this.add.image(x, y, ASTRAL_KEYS.arch).setOrigin(0.5,1).setScale(scale).setDepth(2).setAlpha(0.92);
    }
    const clusters = [[880,606,.62],[1880,610,.55],[3920,534,.52],[6000,605,.58],[8380,522,.5],[9270,603,.6]];
    for (const [x,y,scale] of clusters) {
      const art = this.add.image(x, y, ASTRAL_KEYS.crystalCluster).setOrigin(0.5,1).setScale(scale).setDepth(7);
      this.tweens.add({ targets: art, alpha: 0.72, duration: 1200 + (x % 700), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  handleMovementEvent(event) {
    if (event.type === 'jump') this.fx.jump(this.runner);
    if (event.type === 'skid') this.fx.skid(this.runner);
    if (event.type === 'land') this.fx.land(this.runner, false);
    if (event.type === 'hardLand') {
      this.fx.land(this.runner, true);
      this.cameras.main.shake(65, 0.0022);
    }
  }

  killRunner() {
    if (this.respawning || this.runner.dead || this.finished) return;
    this.respawning = true;
    this.runner.dead = true;
    this.controller.enabled = false;
    this.runner.body.setVelocity(0, 0);
    this.runner.body.enable = false;
    this.animator.update('death', 0);
    this.fx.death(this.runner);
    this.cameras.main.flash(90, 255, 35, 70, false);
    this.tweens.add({ targets: [this.runner.visual, this.runner.runRig.container], alpha: 0.08, duration: 260, ease: 'Quad.easeOut' });
    this.time.delayedCall(MOVEMENT.respawnMs, () => this.respawn(false));
  }

  respawn(manual = false) {
    this.respawning = false;
    this.runner.body.enable = true;
    this.runner.setVisualAlpha(1);
    this.runner.setPosition(this.checkpointSpawn.x, this.checkpointSpawn.y);
    this.controller.reset();
    this.animator.reset();
    if (manual) this.fx.clear();
    this.runCamera.reset();
  }

  togglePause() {
    if (this.finished) return;
    this.hud.paused = !this.hud.paused;
    if (this.hud.paused) this.physics.pause();
    else this.physics.resume();
    this.controller.enabled = !this.hud.paused;
    if (this.hud.paused) {
      this.pauseOverlay = this.add.rectangle(640, 360, 1280, 720, 0x020713, .58).setScrollFactor(0).setDepth(8000);
      this.pauseLabel = this.add.text(640, 340, 'PAUSA', { fontFamily: 'Arial Black', fontSize: '46px', color: '#ffffff' }).setOrigin(.5).setScrollFactor(0).setDepth(8001);
      this.pauseSub = this.add.text(640, 398, 'ESC · CONTINUAR', { fontFamily: 'Arial Black', fontSize: '15px', color: '#7fe9ff' }).setOrigin(.5).setScrollFactor(0).setDepth(8001);
    } else {
      this.pauseOverlay?.destroy(); this.pauseLabel?.destroy(); this.pauseSub?.destroy();
    }
  }

  finishRun() {
    if (this.finished) return;
    this.finished = true;
    this.controller.enabled = false;
    this.runner.body.setVelocity(0, 0);
    this.animator.update('victory', 0);
    this.fx.burst(this.runner.x, this.runner.y, { count: 36, spreadX: 340, speedY: 250, life: 850, color: 0xffcf52, size: 5, gravity: 30 });
    const elapsedMs = this.hud.elapsedMs();
    this.time.delayedCall(420, () => this.hud.showFinish({ elapsedMs, shards: this.shardsCollected, totalShards: this.shards.length, relicFound: this.relicFound }));
  }

  update(_time, delta) {
    if (!this.runner) return;
    if (this.runner.y > 860) this.killRunner();
    if (!this.finished && !this.hud?.paused) {
      this.controller.update(delta);
      this.animator.update(this.controller.getState(), delta);
      this.runner.syncVisual();
      this.runCamera.update(delta);
    }
    this.fx?.update(delta);
    this.hud?.update(this.runner.x);
  }
}