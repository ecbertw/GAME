import { HardcoreRunScene } from './scenes/HardcoreRunScene.js';
import { RUN_PHYSICS } from './run-config.js';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  backgroundColor: '#030711',
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
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
