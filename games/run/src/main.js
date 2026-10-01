import { HardcoreRunScene } from './scenes/HardcoreRunScene.js';
import { RUN_PHYSICS } from './run-config.js';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  width: 1280,
  height: 720,
  backgroundColor: '#030711',
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: RUN_PHYSICS.gravityY },
      debug: false,
      fps: 120,
      fixedStep: true,
    },
  },
  scene: [HardcoreRunScene],
};

new Phaser.Game(config);
