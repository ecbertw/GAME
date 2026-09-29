import { RUNNER_ANIMATIONS } from '../assets/runner-manifest.js';

export class RunnerAnimator {
  constructor(runner) {
    this.runner = runner;
    this.state = '';
    this.elapsedMs = 0;
    this.frameIndex = 0;
  }

  reset() {
    this.state = '';
    this.elapsedMs = 0;
    this.frameIndex = 0;
    this.runner.setFrame('idle_01');
  }

  update(state, deltaMs) {
    const animation = RUNNER_ANIMATIONS[state] || RUNNER_ANIMATIONS.idle;
    if (state !== this.state) {
      this.state = state;
      this.elapsedMs = 0;
      this.frameIndex = 0;
    } else {
      this.elapsedMs += deltaMs;
    }

    const frameDuration = 1000 / Math.max(1, animation.fps);
    if (animation.frames.length > 1) {
      this.frameIndex = Math.floor(this.elapsedMs / frameDuration) % animation.frames.length;
    } else {
      this.frameIndex = 0;
    }
    this.runner.setFrame(animation.frames[this.frameIndex]);
  }
}
