import { FirstLightScene } from './scenes/FirstLightScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'run-root',
  width: 1280,
  height: 720,
  backgroundColor: '#08152c',
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
  scene: [FirstLightScene],
};

new Phaser.Game(config);