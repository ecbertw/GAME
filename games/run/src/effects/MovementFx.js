export class MovementFx {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
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
  } = {}) {
    for (let i = 0; i < count; i += 1) {
      const particle = this.scene.add.circle(x, y, size * (0.65 + Math.random() * 0.7), color, 0.72)
        .setDepth(12);
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
      count: 5,
      spreadX: 65,
      speedY: 38,
      life: 190,
      color: 0xa9bdd6,
      size: 3.6,
      gravity: 85,
    });
  }

  land(runner, hard = false) {
    this.burst(runner.x, runner.y + 38, {
      count: hard ? 18 : 8,
      spreadX: hard ? 250 : 130,
      speedY: hard ? 120 : 62,
      life: hard ? 380 : 240,
      color: hard ? 0xe7f2ff : 0xc9d8e9,
      size: hard ? 5.6 : 4.2,
      gravity: hard ? 260 : 150,
    });
  }

  death(runner) {
    this.burst(runner.x, runner.y, {
      count: 18,
      spreadX: 260,
      speedY: 180,
      life: 420,
      color: 0xf02b4f,
      size: 4.8,
      gravity: 240,
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
