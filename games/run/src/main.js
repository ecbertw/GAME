import { HardcoreRunScene } from './scenes/HardcoreRunScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  width: 1280,
  height: 720,
  backgroundColor: '#08090d',
  pixelArt: false,
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1700 },
      debug: false,
      fps: 120,
      fixedStep: true,
    },
  },
  scene: [HardcoreRunScene],
};

new Phaser.Game(config);
