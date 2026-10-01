import { HardcoreRunScene } from './scenes/HardcoreRunScene.js?v=20261001-hard100';
import { RUN_PHYSICS } from './run-config.js?v=20261001-hard100';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  transparent: true,
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: Math.max(360, window.innerHeight - 68),
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
