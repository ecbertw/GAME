import { HardcoreRunScene } from './scenes/HardcoreRunScene.js?v=20261001-platformfix2';
import { RUN_PHYSICS } from './run-config.js?v=20261001-platformfix2';

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
    height: Math.max(360, window.innerHeight - 52),
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
