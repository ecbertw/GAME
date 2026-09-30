export class MovementFx {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.lastTrailAt = 0;
  }

  burst(x, y, {
    count = 8,
    spreadX = 90,
    speedY = 90,
    life = 260,
    color = 0xdbe7f8,
    size = 5,
    gravity = 180,
    direction = 0,
    shape = 'circle',
    stretch = 1,
  } = {}) {
    for (let i = 0; i < count; i += 1) {
      const radius = size * (0.65 + Math.random() * 0.7);
      let particle;
      if (shape === 'diamond') {
        particle = this.scene.add.polygon(x, y, [0,-radius*1.6,radius,0,0,radius*1.6,-radius,0], color, 0.84);
      } else if (shape === 'streak') {
        particle = this.scene.add.rectangle(x, y, radius * 3.6 * stretch, Math.max(1.8, radius * 0.55), color, 0.62)
          .setAngle((Math.random() - 0.5) * 8);
      } else {
        particle = this.scene.add.circle(x, y, radius, color, 0.72);
      }
      particle.setDepth(12);
      const vx = (Math.random() - 0.5) * spreadX + direction;
      const vy = -Math.random() * speedY - 18;
      this.pool.push({ particle, vx, vy, gravity, age: 0, life });
    }
  }

  skid(runner) {
    this.burst(runner.x - runner.facing * 12, runner.y + 38, {
      count: 11,
      spreadX: 95,
      speedY: 55,
      life: 250,
      color: 0xd8e1ed,
      size: 4.2,
      gravity: 120,
      direction: -runner.facing * 120,
    });
  }

  jump(runner) {
    this.burst(runner.x, runner.y + 36, {
      count: 6,
      spreadX: 75,
      speedY: 45,
      life: 210,
      color: 0x8feeff,
      size: 3.4,
      gravity: 80,
      shape: 'diamond',
    });
  }

  speedTrail(runner) {
    if (!runner?.body || Math.abs(runner.body.velocity.x) < 430) return;
    if (this.scene.time.now - this.lastTrailAt < 48) return;
    this.lastTrailAt = this.scene.time.now;
    const facing = runner.facing || Math.sign(runner.body.velocity.x) || 1;
    const speed = Math.abs(runner.body.velocity.x);
    this.burst(runner.x - facing * 24, runner.y + 8, {
      count: speed > 560 ? 3 : 2,
      spreadX: 26,
      speedY: 10,
      life: 180,
      color: speed > 560 ? 0x7cf5ff : 0x3bcfff,
      size: 2.8,
      gravity: 0,
      direction: -facing * (180 + speed * 0.28),
      shape: 'streak',
      stretch: speed > 560 ? 2.3 : 1.5,
    });
  }

  land(runner, hard = false) {
    this.burst(runner.x, runner.y + 38, {
      count: hard ? 18 : 8,
      spreadX: hard ? 250 : 130,
      speedY: hard ? 120 : 62,
      life: hard ? 380 : 240,
      color: hard ? 0xa9f7ff : 0xd9e7f4,
      size: hard ? 5.2 : 4.0,
      gravity: hard ? 260 : 150,
      shape: hard ? 'diamond' : 'circle',
    });
  }

  death(runner) {
    this.burst(runner.x, runner.y, {
      count: 18,
      spreadX: 260,
      speedY: 180,
      life: 420,
      color: 0xf02b4f,
      size: 5.0,
      gravity: 240,
      shape: 'diamond',
    });
  }

  update(deltaMs) {
    const dt = Math.min(0.05, deltaMs / 1000);
    for (let i = this.pool.length - 1; i >= 0; i -= 1) {
      const item = this.pool[i];
      item.age += deltaMs;
      item.vy += item.gravity * dt;
      item.particle.x += item.vx * dt;
      item.particle.y += item.vy * dt;
      const t = Math.max(0, 1 - item.age / item.life);
      item.particle.setAlpha(t * 0.72).setScale(0.7 + t * 0.3);
      if (item.age >= item.life) {
        item.particle.destroy();
        this.pool.splice(i, 1);
      }
    }
  }

  clear() {
    for (const item of this.pool) item.particle.destroy();
    this.pool.length = 0;
  }
}
