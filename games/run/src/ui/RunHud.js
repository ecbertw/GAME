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
    const g = this.scene.add.graphics();
    g.fillStyle(0x061225, 0.90).fillRoundedRect(x, y, width, height, 10);
    g.lineStyle(1.5, accent, 0.72).strokeRoundedRect(x, y, width, height, 10);
    g.fillStyle(accent, 0.95).fillRect(x, y + 8, 4, height - 16);
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

    this.shardIcon = this.scene.add.polygon(485, 45, [0,-20,12,0,0,20,-12,0], 0x38dcff, 1).setScrollFactor(0).setDepth(5001);
    this.shardIcon.setStrokeStyle(2, 0xbaf6ff, 1);
    this.shardText = this.scene.add.text(514, 31, `× 0 / ${this.totalShards}`, { fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: '#ffffff' }).setScrollFactor(0).setDepth(5001);
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
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(5100);
    g.fillStyle(0x061225, 0.94).fillRoundedRect(30, 100, 525, 94, 10);
    g.lineStyle(1.4, 0x22ceff, 0.75).strokeRoundedRect(30, 100, 525, 94, 10);
    g.fillStyle(0xf02b4f, 1).fillRect(30, 100, 7, 94);
    const title = this.scene.add.text(55, 118, 'ASTRAL 01 — FIRST LIGHT', { fontFamily: 'Arial Black, sans-serif', fontSize: '24px', color: '#ffffff' }).setScrollFactor(0).setDepth(5101);
    const sub = this.scene.add.text(56, 154, 'RUÍNAS CELESTIAIS · ILHAS FLUTUANTES · SHARDS · ROTAS ALTERNATIVAS', { fontSize: '11px', fontStyle: 'bold', color: '#8de9ff', letterSpacing: 1 }).setScrollFactor(0).setDepth(5101);
    this.scene.tweens.add({ targets: [g, title, sub], alpha: 0, delay: 2800, duration: 650, ease: 'Quad.easeOut' });
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

    const shade = this.scene.add.rectangle(640, 360, 1280, 720, 0x020713, 0.68).setScrollFactor(0).setDepth(9000);
    const card = this.scene.add.graphics().setScrollFactor(0).setDepth(9001);
    card.fillStyle(0x071426, 0.98).fillRoundedRect(285, 145, 710, 430, 18);
    card.lineStyle(2, 0x2ad9ff, 0.85).strokeRoundedRect(285, 145, 710, 430, 18);
    card.fillStyle(0xf02b4f, 1).fillRect(285, 145, 8, 430);

    this.scene.add.text(330, 180, 'RESULTADOS', { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffffff' }).setScrollFactor(0).setDepth(9002);
    this.scene.add.text(330, 235, 'ASTRAL 01 — FIRST LIGHT', { fontFamily: 'Arial Black, sans-serif', fontSize: '17px', color: '#7fe7ff' }).setScrollFactor(0).setDepth(9002);
    this.scene.add.text(330, 292, `TEMPO        ${formatted}\nSHARDS       ${shards} / ${totalShards}\nRELÍQUIA      ${relicFound ? 'DESCOBERTA' : 'NÃO ENCONTRADA'}`, { fontFamily: 'monospace', fontSize: '21px', color: '#eaf5ff', lineSpacing: 16 }).setScrollFactor(0).setDepth(9002);
    this.scene.add.text(760, 276, shards === totalShards && relicFound ? 'S+' : shards >= Math.ceil(totalShards * .75) ? 'S' : 'A', { fontFamily: 'Arial Black, sans-serif', fontSize: '116px', fontStyle: 'italic', color: '#ffd45a', stroke: '#b66b00', strokeThickness: 4 }).setScrollFactor(0).setDepth(9002);
    this.scene.add.text(640, 500, 'ENTER · RECOMEÇAR     |     H · EIXO HOME', { fontFamily: 'Arial Black, sans-serif', fontSize: '14px', color: '#bcd0ea' }).setOrigin(.5).setScrollFactor(0).setDepth(9002);

    this.finishObjects = [shade, card];
  }
}