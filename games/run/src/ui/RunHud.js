import { ASTRAL_BG, ASTRAL_OBJ } from '../art/AstralArt.js';

export class RunHud {
  constructor(scene, { totalShards = 0, worldWidth = 1 } = {}) {
    this.scene = scene;
    this.totalShards = totalShards;
    this.worldWidth = worldWidth;
    this.startedAt = scene.time.now;
    this.shards = 0;
    this.checkpoint = 0;
    this.finished = false;
    this.paused = false;

    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(5000);
    this.createTopPanels();
    this.createProgress();
    this.createTitleCard();
    this.createPauseHint();
  }

  panel(x, y, width, height, accent = 0x20c8ff) {
    const cut = 12;
    const pts = [
      new Phaser.Geom.Point(x + cut, y),
      new Phaser.Geom.Point(x + width - cut, y),
      new Phaser.Geom.Point(x + width, y + cut),
      new Phaser.Geom.Point(x + width, y + height - cut),
      new Phaser.Geom.Point(x + width - cut, y + height),
      new Phaser.Geom.Point(x + cut, y + height),
      new Phaser.Geom.Point(x, y + height - cut),
      new Phaser.Geom.Point(x, y + cut),
    ];
    const g = this.scene.add.graphics();
    g.fillStyle(0x061225, 0.94).fillPoints(pts, true);
    g.lineStyle(1.7, accent, 0.92).strokePoints(pts, true);
    g.fillStyle(accent, 1).fillRect(x + 5, y + 10, 4, height - 20);
    g.lineStyle(1, 0xffffff, 0.08).lineBetween(x + 18, y + 5, x + width - 22, y + 5);
    this.root.add(g);
    return g;
  }

  createTopPanels() {
    this.panel(22, 18, 190, 54, 0x27cfff);
    this.panel(226, 18, 218, 54, 0xf02b4f);
    this.panel(458, 18, 176, 54, 0x27cfff);

    this.scene.add.text(44, 29, '◷', { fontFamily: 'Arial Black, sans-serif', fontSize: '28px', color: '#eef8ff' }).setScrollFactor(0).setDepth(5001);
    this.timerText = this.scene.add.text(82, 29, '00:00.00', { fontFamily: 'Arial Black, sans-serif', fontSize: '23px', color: '#ffffff' }).setScrollFactor(0).setDepth(5001);

    this.scene.add.text(246, 27, 'PB', { fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: '#d9e8ff' }).setScrollFactor(0).setDepth(5001);
    this.pbText = this.scene.add.text(246, 43, '— ADMIN RUN —', { fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ff3159' }).setScrollFactor(0).setDepth(5001);

    this.shardIcon = this.scene.add.image(486, 45, ASTRAL_OBJ.shard)
      .setDisplaySize(40, 54)
      .setScrollFactor(0)
      .setDepth(5001);
    this.shardText = this.scene.add.text(518, 31, `× 0 / ${this.totalShards}`, { fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: '#ffffff' }).setScrollFactor(0).setDepth(5001);
  }

  createProgress() {
    const x = 820, y = 33, width = 420;
    this.scene.add.rectangle(x, y, width, 8, 0x071527, 0.92).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5000).setStrokeStyle(1, 0x2a5379, 0.9);
    this.progressFill = this.scene.add.rectangle(x, y, 0, 5, 0x25d7ff, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5001);
    this.scene.add.text(x, y + 14, 'INÍCIO', { fontSize: '9px', fontStyle: 'bold', color: '#91a9c8' }).setScrollFactor(0).setDepth(5001);
    this.scene.add.text(x + width - 44, y + 14, 'CHEGADA', { fontSize: '9px', fontStyle: 'bold', color: '#91a9c8' }).setScrollFactor(0).setDepth(5001);
    this.progressWidth = width;
  }

  createTitleCard() {
    const x = 30, y = 100, w = 590, h = 104;
    const cut = 12;
    const pts = [
      new Phaser.Geom.Point(x + cut, y),
      new Phaser.Geom.Point(x + w - cut, y),
      new Phaser.Geom.Point(x + w, y + cut),
      new Phaser.Geom.Point(x + w, y + h - cut),
      new Phaser.Geom.Point(x + w - cut, y + h),
      new Phaser.Geom.Point(x + cut, y + h),
      new Phaser.Geom.Point(x, y + h - cut),
      new Phaser.Geom.Point(x, y + cut),
    ];
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(5100);
    g.fillStyle(0x061225, 0.96).fillPoints(pts, true);
    g.lineStyle(1.6, 0x22ceff, 0.84).strokePoints(pts, true);
    g.fillStyle(0xf02b4f, 1).fillRect(x + 6, y + 12, 5, h - 24);

    const preview = this.scene.add.image(x + w - 116, y + h / 2, ASTRAL_BG.world)
      .setDisplaySize(205, 82)
      .setScrollFactor(0)
      .setDepth(5101);
    const veil = this.scene.add.rectangle(x + w - 116, y + h / 2, 205, 82, 0x03101f, 0.18)
      .setScrollFactor(0)
      .setDepth(5102);

    const title = this.scene.add.text(55, 116, 'ASTRAL 01', { fontFamily: 'Arial Black, sans-serif', fontSize: '23px', color: '#ffffff' }).setScrollFactor(0).setDepth(5103);
    const name = this.scene.add.text(55, 145, 'FIRST LIGHT', { fontFamily: 'Arial Black, sans-serif', fontSize: '17px', color: '#8de9ff', letterSpacing: 1 }).setScrollFactor(0).setDepth(5103);
    const sub = this.scene.add.text(56, 174, 'RUÍNAS CELESTIAIS · ILHAS FLUTUANTES · SHARDS', { fontSize: '10px', fontStyle: 'bold', color: '#b6c9df' }).setScrollFactor(0).setDepth(5103);

    this.scene.tweens.add({ targets: [g, preview, veil, title, name, sub], alpha: 0, delay: 3000, duration: 650, ease: 'Quad.easeOut' });
  }

  createPauseHint() {
    this.pauseText = this.scene.add.text(1238, 690, 'ESC · PAUSA', { fontSize: '10px', fontStyle: 'bold', color: '#7894b8' }).setOrigin(1, 1).setScrollFactor(0).setDepth(5001);
  }

  setShards(value) {
    this.shards = value;
    this.shardText.setText(`× ${value} / ${this.totalShards}`);
    this.scene.tweens.add({ targets: [this.shardIcon, this.shardText], scale: 1.16, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  setCheckpoint(index) {
    this.checkpoint = index;
    this.pbText.setText(`CHECKPOINT ${index}`);
    this.scene.time.delayedCall(1100, () => { if (!this.finished) this.pbText.setText('— ADMIN RUN —'); });
  }

  update(runnerX) {
    if (!this.finished) {
      const elapsed = Math.max(0, this.scene.time.now - this.startedAt);
      const seconds = elapsed / 1000;
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const cent = Math.floor((seconds % 1) * 100);
      this.timerText.setText(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cent).padStart(2,'0')}`);
    }
    const p = Phaser.Math.Clamp(runnerX / Math.max(1, this.worldWidth), 0, 1);
    this.progressFill.width = this.progressWidth * p;
  }

  elapsedMs() { return Math.max(0, this.scene.time.now - this.startedAt); }

  showFinish({ elapsedMs, shards, totalShards, relicFound }) {
    this.finished = true;
    const seconds = elapsedMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const cent = Math.floor((seconds % 1) * 100);
    const formatted = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cent).padStart(2,'0')}`;
    const rank = shards === totalShards && relicFound ? 'S+' : shards >= Math.ceil(totalShards * .75) ? 'S' : 'A';

    const shade = this.scene.add.rectangle(640, 360, 1280, 720, 0x020713, 0.72).setScrollFactor(0).setDepth(9000);
    const card = this.scene.add.graphics().setScrollFactor(0).setDepth(9001);
    const x = 250, y = 135, w = 780, h = 450, cut = 20;
    const pts = [
      new Phaser.Geom.Point(x + cut, y),
      new Phaser.Geom.Point(x + w - cut, y),
      new Phaser.Geom.Point(x + w, y + cut),
      new Phaser.Geom.Point(x + w, y + h - cut),
      new Phaser.Geom.Point(x + w - cut, y + h),
      new Phaser.Geom.Point(x + cut, y + h),
      new Phaser.Geom.Point(x, y + h - cut),
      new Phaser.Geom.Point(x, y + cut),
    ];
    card.fillStyle(0x071426, 0.985).fillPoints(pts, true);
    card.lineStyle(2, 0x2ad9ff, 0.88).strokePoints(pts, true);
    card.fillStyle(0xf02b4f, 1).fillRect(x + 7, y + 20, 6, h - 40);

    const preview = this.scene.add.image(390, 322, ASTRAL_BG.world)
      .setDisplaySize(245, 238)
      .setScrollFactor(0)
      .setDepth(9002);
    const previewFrame = this.scene.add.rectangle(390, 322, 249, 242, 0x000000, 0)
      .setStrokeStyle(2, 0x2ad9ff, 0.55)
      .setScrollFactor(0)
      .setDepth(9003);

    this.scene.add.text(300, 170, 'RESULTADOS', { fontFamily: 'Arial Black, sans-serif', fontSize: '31px', color: '#ffffff' }).setScrollFactor(0).setDepth(9004);
    this.scene.add.text(550, 190, 'ASTRAL 01 — FIRST LIGHT', { fontFamily: 'Arial Black, sans-serif', fontSize: '18px', color: '#7fe7ff' }).setScrollFactor(0).setDepth(9004);
    this.scene.add.text(550, 248, `TEMPO        ${formatted}\nSHARDS       ${shards} / ${totalShards}\nRELÍQUIA      ${relicFound ? 'DESCOBERTA' : 'NÃO ENCONTRADA'}`, { fontFamily: 'monospace', fontSize: '20px', color: '#eaf5ff', lineSpacing: 18 }).setScrollFactor(0).setDepth(9004);
    this.scene.add.text(820, 330, rank, { fontFamily: 'Arial Black, sans-serif', fontSize: '110px', fontStyle: 'italic', color: '#ffd45a', stroke: '#b66b00', strokeThickness: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(9004);
    this.scene.add.text(820, 408, 'RANK', { fontFamily: 'Arial Black, sans-serif', fontSize: '14px', color: '#ffd977', letterSpacing: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(9004);

    const button = this.scene.add.graphics().setScrollFactor(0).setDepth(9003);
    button.fillStyle(0x101f34, 1).fillRoundedRect(470, 500, 340, 48, 8);
    button.lineStyle(1.5, 0x37dfff, 0.7).strokeRoundedRect(470, 500, 340, 48, 8);
    this.scene.add.text(640, 524, 'ENTER · RECOMEÇAR   |   H · EIXO HOME', { fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: '#d7e6f7' }).setOrigin(.5).setScrollFactor(0).setDepth(9004);

    this.finishObjects = [shade, card, preview, previewFrame, button];
  }
}