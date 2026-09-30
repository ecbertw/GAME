import { Runner } from '../player/Runner.js';
import { RunnerController } from '../player/RunnerController.js';
import { RunnerAnimator } from '../player/RunnerAnimator.js';
import { RunCamera } from '../camera/RunCamera.js';
import { RUNNER_ATLAS } from '../assets/runner-manifest.js';
import { MOVEMENT } from '../config/movement.js';
import { MovementFx } from '../effects/MovementFx.js';
import { RunHud } from '../ui/RunHud.js';

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
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-1000);
    sky.fillStyle(0x071b43, 1).fillRect(0, 0, 1280, 720);
    sky.fillStyle(0x0f4f9c, .32).fillRect(0, 0, 1280, 360);
    sky.fillStyle(0x5a8df5, .10).fillRect(0, 220, 1280, 300);

    for (let i = 0; i < 90; i += 1) {
      const x = (i * 137) % 1280;
      const y = 24 + ((i * 79) % 330);
      const radius = i % 9 === 0 ? 2.2 : 1.15;
      this.add.circle(x, y, radius, i % 7 === 0 ? 0xa8eaff : 0xffffff, .62).setScrollFactor(0.015).setDepth(-990);
    }

    const moon = this.add.circle(970, 164, 128, 0xfff1d6, 1).setScrollFactor(.035).setDepth(-970);
    moon.setStrokeStyle(10, 0xdcbfff, .18);
    for (let i = 0; i < 13; i += 1) {
      this.add.circle(930 + ((i * 47) % 115), 115 + ((i * 31) % 100), 11 + (i % 4) * 5, 0xcbb7d4, .18).setScrollFactor(.035).setDepth(-969);
    }
    const rings = this.add.graphics().setScrollFactor(.035).setDepth(-968);
    rings.lineStyle(5, 0xffd3ff, .56).strokeEllipse(998, 165, 360, 58);
    rings.lineStyle(2, 0x8be8ff, .52).strokeEllipse(998, 165, 405, 74);

    this.drawCloudBand(-930, .06, 460, 0xffd6ed, 0.78);
    this.drawCloudBand(-900, .09, 520, 0xe9d8ff, 0.68);
    this.drawFarRuins();
    this.drawMidRuins();
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
  }

  addAstralPlatform(x, y, width, height, { large = false, waterfall = false, alt = false } = {}) {
    const container = this.add.container(x, y).setDepth(5);
    const rock = this.add.graphics();
    rock.fillStyle(alt ? 0x263b67 : 0x22365e, 1).fillRoundedRect(-width/2, -height/2, width, height, 12);
    rock.fillStyle(0x435a82, 1).fillRoundedRect(-width/2 + 8, -height/2 + 7, width - 16, 22, 7);
    rock.fillStyle(0x7d8c96, .28);
    for (let bx = -width/2 + 16; bx < width/2 - 20; bx += 62) rock.fillRoundedRect(bx, -height/2 + 34, 46, Math.max(20, height - 44), 7);
    rock.fillStyle(0x83c83d, 1).fillRoundedRect(-width/2 + 4, -height/2 - 7, width - 8, 15, 8);
    rock.fillStyle(0xd8ed75, .7).fillRoundedRect(-width/2 + 10, -height/2 - 3, width - 20, 5, 3);
    container.add(rock);

    const core = this.add.graphics();
    core.fillStyle(0x0a6cb4, .78).fillCircle(0, height/2 - 8, large ? 28 : 18);
    core.lineStyle(4, 0x38e5ff, .86).strokeCircle(0, height/2 - 8, large ? 18 : 12);
    core.fillStyle(0x59f2ff, .35).fillTriangle(-10, height/2 - 1, 0, height/2 + 35, 10, height/2 - 1);
    container.add(core);

    this.addVines(container, width, height);
    if (waterfall) this.addWaterfall(container, Math.min(115, width * .22), height/2 - 2);

    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    container.bodyObject = bodyObject;
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
    const g = this.add.graphics();
    g.fillStyle(0x263a5c, 1).fillRoundedRect(-width/2, -height/2, width, height, 10);
    g.fillStyle(0x7fbd3b, 1).fillRoundedRect(-width/2 + 4, -height/2 - 5, width - 8, 13, 7);
    g.fillStyle(0x0871b8, .92).fillRoundedRect(-width/2 + 16, height/2 - 18, width - 32, 15, 7);
    g.fillStyle(0x45e9ff, .82);
    for (let px = -width/2 + 34; px < width/2 - 20; px += 62) g.fillTriangle(px, height/2 - 2, px + 11, height/2 + 26, px + 22, height/2 - 2);
    visual.add(g);

    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    visual.bodyObject = bodyObject;
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
    const g = this.add.graphics();
    const count = Math.max(3, Math.floor(width / 30));
    for (let i = 0; i < count; i += 1) {
      const px = -width/2 + 14 + i * (width / count);
      const h = 28 + (i % 3) * 18;
      g.fillStyle(i % 2 ? 0x8a0f2c : 0xec244e, 1).fillTriangle(px - 12, 0, px, -h, px + 12, 0);
      g.lineStyle(2, 0xff5578, .65).lineBetween(px, -h + 5, px, -4);
    }
    container.add(g);
    const bodyObject = this.add.rectangle(x, y - 18, width, 42, 0xff0000, 0);
    this.physics.add.existing(bodyObject, true);
    container.bodyObject = bodyObject;
    this.hazards.push(container);
  }

  addBreakableBlock(x, y, width, height) {
    const container = this.add.container(x, y).setDepth(9);
    const g = this.add.graphics();
    g.fillStyle(0x566079, 1).fillRoundedRect(-width/2, -height/2, width, height, 8);
    g.lineStyle(3, 0x98a5b6, .7).strokeRoundedRect(-width/2, -height/2, width, height, 8);
    g.lineStyle(3, 0x3de0ff, .7);
    g.lineBetween(-10,-height/2+7,5,-8);g.lineBetween(5,-8,-6,13);g.lineBetween(-6,13,18,height/2-7);
    container.add(g);
    const bodyObject = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    const item = { container, bodyObject, broken: false };
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
    const glow = this.add.circle(0, 0, 30, 0x24dfff, .12);
    const diamond = this.add.polygon(0, 0, [0,-24,13,0,0,24,-13,0], 0x2cdfff, 1);
    diamond.setStrokeStyle(2, 0xc7fbff, 1);
    const core = this.add.polygon(0, 0, [0,-15,6,0,0,15,-6,0], 0xbefaff, .78);
    container.add([glow, diamond, core]);
    const bodyObject = this.add.rectangle(x, y, 34, 48, 0xffffff, 0);
    this.physics.add.existing(bodyObject, true);
    const shard = { container, bodyObject, index, collected: false };
    this.shards.push(shard);
    this.tweens.add({ targets: container, y: y - 9, duration: 900 + (index % 4) * 110, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, scale: 1.35, alpha: .03, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
    const base = this.add.rectangle(0, 39, 86, 26, 0x283a58, 1).setStrokeStyle(2, 0x63dfff, .7);
    const poleL = this.add.rectangle(-30, -30, 7, 120, 0xc49a52, 1);
    const poleR = this.add.rectangle(30, -30, 7, 120, 0xc49a52, 1);
    const banner = this.add.rectangle(0, -32, 55, 92, 0x322879, 1).setStrokeStyle(2, 0xe0b55a, .85);
    const emblem = this.add.text(0, -35, '◈', { fontFamily: 'Arial Black', fontSize: '30px', color: '#dffbff' }).setOrigin(.5);
    const glow = this.add.ellipse(0, 49, 96, 20, 0x20dfff, .24);
    container.add([base, poleL, poleR, banner, emblem, glow]);
    const trigger = this.add.rectangle(x, y, 100, 150, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    const cp = { container, trigger, spawn, index, active: false, banner, glow };
    this.checkpoints.push(cp);
    this.tweens.add({ targets: glow, alpha: .08, scaleX: 1.2, duration: 900, yoyo: true, repeat: -1 });
    return cp;
  }

  activateCheckpoint(cp) {
    if (cp.active || this.finished) return;
    this.checkpoints.forEach(other => { if (other !== cp) other.active = false; });
    cp.active = true;
    this.checkpointSpawn = { ...cp.spawn };
    this.checkpointIndex = cp.index;
    cp.banner.setFillStyle(0x45308d, 1);
    cp.glow.setFillStyle(0xffbd44, .55);
    this.hud.setCheckpoint(cp.index);
    this.fx.burst(cp.container.x, cp.container.y + 30, { count: 22, spreadX: 190, speedY: 180, life: 520, color: 0xffc94b, size: 4.5, gravity: 40 });
  }

  addBouncePad(x, y) {
    const container = this.add.container(x, y).setDepth(11);
    const base = this.add.ellipse(0, 0, 106, 32, 0x11375c, 1).setStrokeStyle(2, 0x40e7ff, .9);
    const ring = this.add.ellipse(0, -3, 74, 18, 0x1bdcff, .20).setStrokeStyle(3, 0x8cf4ff, .9);
    const arrows = this.add.text(0, -35, '⌃⌃', { fontFamily: 'Arial Black', fontSize: '30px', color: '#8af4ff' }).setOrigin(.5);
    container.add([base, ring, arrows]);
    const trigger = this.add.rectangle(x, y - 16, 95, 32, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    this.tweens.add({ targets: arrows, y: -44, alpha: .35, duration: 650, yoyo: true, repeat: -1 });
    return { container, trigger, coolUntil: 0 };
  }

  triggerBounce() {
    if (!this.runner || this.finished || this.time.now < this.bouncePad.coolUntil) return;
    this.bouncePad.coolUntil = this.time.now + 500;
    this.runner.body.setVelocityY(-980);
    this.fx.burst(this.runner.x, this.runner.y + 40, { count: 16, spreadX: 160, speedY: 180, life: 320, color: 0x3ee8ff, size: 4, gravity: 60 });
  }

  addSpeedStrip(x, y) {
    const container = this.add.container(x, y).setDepth(11);
    const base = this.add.rectangle(0, 0, 160, 26, 0x173557, 1).setStrokeStyle(2, 0x35dfff, .8);
    const arrows = this.add.text(0, -1, '≫≫', { fontFamily: 'Arial Black', fontSize: '30px', color: '#5cecff' }).setOrigin(.5);
    container.add([base, arrows]);
    const trigger = this.add.rectangle(x, y - 20, 160, 54, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    return { container, trigger, coolUntil: 0 };
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
    const cave = this.add.container(x, y).setDepth(3);
    const g = this.add.graphics();
    g.fillStyle(0x10192c, 1).fillRoundedRect(-210, -120, 420, 180, 70);
    g.lineStyle(13, 0x31415e, 1).strokeRoundedRect(-210, -120, 420, 180, 70);
    g.fillStyle(0x17395e, .8).fillCircle(-125, -32, 28);
    g.fillStyle(0x24dfff, .55).fillTriangle(-140,-12,-125,-70,-110,-12);
    cave.add(g);
    this.add.text(x, y - 155, 'SEGREDO', { fontFamily: 'Arial Black', fontSize: '13px', color: '#8feeff', backgroundColor: '#07101ddd', padding: { x: 8, y: 4 } }).setOrigin(.5).setDepth(20);

    const chest = this.add.container(x + 75, y - 18).setDepth(13);
    const base = this.add.rectangle(0, 0, 92, 52, 0x24365a, 1).setStrokeStyle(5, 0xd7a63c, 1);
    const lid = this.add.arc(0, -24, 46, 180, 360, false, 0x2d4d7c, 1).setStrokeStyle(5, 0xe1b84c, 1);
    const gem = this.add.circle(0, -2, 9, 0x27dfff, 1).setStrokeStyle(3, 0xe6fdff, 1);
    chest.add([base, lid, gem]);
    const trigger = this.add.rectangle(x + 75, y - 18, 120, 90, 0xffffff, 0);
    this.physics.add.existing(trigger, true);
    this.relic = { chest, trigger, found: false };
  }

  collectRelic() {
    if (this.relic.found || this.finished) return;
    this.relic.found = true;
    this.relicFound = true;
    this.relic.trigger.body.enable = false;
    this.fx.burst(this.relic.chest.x, this.relic.chest.y - 25, { count: 28, spreadX: 230, speedY: 230, life: 650, color: 0xffd35f, size: 5, gravity: 50 });
    this.tweens.add({ targets: this.relic.chest, y: this.relic.chest.y - 18, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    const msg = this.add.text(640, 610, 'RELÍQUIA SECRETA DESCOBERTA', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd45b', backgroundColor: '#07101de8', padding: { x: 18, y: 10 } }).setOrigin(.5).setScrollFactor(0).setDepth(6000);
    this.tweens.add({ targets: msg, alpha: 0, y: 588, delay: 1200, duration: 500, onComplete: () => msg.destroy() });
  }

  createFinishGate() {
    const x = 9490, y = 520;
    const gate = this.add.container(x, y).setDepth(14);
    const g = this.add.graphics();
    g.lineStyle(18, 0x7786a4, 1).strokeCircle(0, 0, 94);
    g.lineStyle(5, 0x30e7ff, .85).strokeCircle(0, 0, 72);
    g.fillStyle(0x24ddff, .13).fillCircle(0, 0, 70);
    g.fillStyle(0x8193ab, 1).fillRect(-104, 78, 26, 95);
    g.fillRect(78, 78, 26, 95);
    g.fillStyle(0x91c83f, 1).fillRoundedRect(-110, 158, 220, 20, 8);
    gate.add(g);
    const symbol = this.add.text(0, -3, '⚑', { fontFamily: 'Arial Black', fontSize: '64px', color: '#ffffff' }).setOrigin(.5);
    gate.add(symbol);
    this.tweens.add({ targets: symbol, alpha: .45, duration: 700, yoyo: true, repeat: -1 });
    this.finishTrigger = this.add.rectangle(x, y, 160, 220, 0xffffff, 0);
    this.physics.add.existing(this.finishTrigger, true);
  }

  addSceneSigns() {
    const signs = [
      [1080, 500, 'SALTA'], [3180, 540, 'BOUNCE'], [3620, 510, 'ROTA ↑'], [5560, 610, 'SEGREDO ↓'], [7330, 535, 'BOOST'], [8850, 540, 'FINAL →'],
    ];
    for (const [x,y,label] of signs) {
      const post = this.add.rectangle(x, y, 8, 76, 0x6c5a46, 1).setDepth(7);
      const plate = this.add.rectangle(x + 18, y - 38, 110, 38, 0x162743, 1).setStrokeStyle(2, 0x31dfff, .65).setDepth(7);
      this.add.text(x + 18, y - 39, label, { fontFamily: 'Arial Black', fontSize: '12px', color: '#d9f8ff' }).setOrigin(.5).setDepth(8);
      this.decor.push(post, plate);
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