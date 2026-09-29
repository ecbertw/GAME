import { RUNNER_ANIMATIONS } from '../assets/runner-manifest.js';
import { MOVEMENT } from '../config/movement.js';

export class RunnerAnimator {
  constructor(runner) {
    this.runner = runner;
    this.state = '';
    this.elapsedMs = 0;
    this.frameIndex = 0;
    this.runDistance = 0;
  }

  reset() {
    this.state = '';
    this.elapsedMs = 0;
    this.frameIndex = 0;
    this.runDistance = 0;
    this.runner.setFrame('idle_01');
  }

  update(state, deltaMs) {
    const animation = RUNNER_ANIMATIONS[state] || RUNNER_ANIMATIONS.idle;
    const changed = state !== this.state;
    if (changed) {
      this.state = state;
      this.elapsedMs = 0;
      this.frameIndex = 0;
      if (state === 'run') this.runDistance = 0;
    } else {
      this.elapsedMs += deltaMs;
    }

    if (animation.distanceDriven) {
      this.runDistance += Math.abs(this.runner.body.velocity.x) * Math.min(0.04, deltaMs / 1000);
      const phase = (this.runDistance / MOVEMENT.runCycleDistance) % 1;
      this.frameIndex = Math.min(animation.frames.length - 1, Math.floor(phase * animation.frames.length));
    } else if (animation.frames.length > 1) {
      const frameDuration = 1000 / Math.max(1, animation.fps || 1);
      const raw = Math.floor(this.elapsedMs / frameDuration);
      this.frameIndex = animation.loop ? raw % animation.frames.length : Math.min(animation.frames.length - 1, raw);
    } else {
      this.frameIndex = 0;
    }

    this.runner.setFrame(animation.frames[this.frameIndex]);
  }
}
