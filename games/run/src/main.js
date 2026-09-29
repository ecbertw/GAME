import { MovementLabScene } from './scenes/MovementLabScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  width: 1280,
  height: 720,
  backgroundColor: '#0b1220',
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
      gravity: { y: 0 },
      debug: false,
      fps: 120,
      fixedStep: true,
    },
  },
  scene: [MovementLabScene],
};

new Phaser.Game(config);
