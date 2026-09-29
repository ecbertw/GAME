import { MOVEMENT, clamp, moveToward } from '../config/movement.js';

export class RunnerController {
  constructor(scene, runner, onEvent = () => {}) {
    this.scene = scene;
    this.runner = runner;
    this.onEvent = onEvent;
    this.enabled = true;
    this.coyoteMs = 0;
    this.jumpBufferMs = 0;
    this.jumpStartMs = 0;
    this.skidMs = 0;
    this.landingMs = 0;
    this.hardLandingMs = 0;
    this.wasGrounded = false;
    this.jumpWasDown = false;
    this.lastAirDownSpeed = 0;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ left: 'A', right: 'D', jump: 'W', reset: 'R' });
  }

  reset() {
    this.enabled = true;
    this.coyoteMs = 0;
    this.jumpBufferMs = 0;
    this.jumpStartMs = 0;
    this.skidMs = 0;
    this.landingMs = 0;
    this.hardLandingMs = 0;
    this.wasGrounded = false;
    this.jumpWasDown = false;
    this.lastAirDownSpeed = 0;
    this.runner.dead = false;
  }

  jumpDown() {
    return this.cursors.up.isDown || this.cursors.space.isDown || this.keys.jump.isDown;
  }

  horizontalDirection() {
    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  update(deltaMs) {
    const dt = Math.min(0.033, deltaMs / 1000);
    const body = this.runner.body;
    const grounded = body.blocked.down || body.touching.down;

    if (!this.enabled || this.runner.dead) {
      body.setAccelerationX(0);
      this.runner.syncVisual();
      return;
    }

    const jumpDown = this.jumpDown();
    const jumpPressed = jumpDown && !this.jumpWasDown;
    const jumpReleased = !jumpDown && this.jumpWasDown;
    this.jumpWasDown = jumpDown;

    if (grounded) this.coyoteMs = MOVEMENT.coyoteMs;
    else this.coyoteMs = Math.max(0, this.coyoteMs - deltaMs);

    if (jumpPressed) this.jumpBufferMs = MOVEMENT.jumpBufferMs;
    else this.jumpBufferMs = Math.max(0, this.jumpBufferMs - deltaMs);

    this.jumpStartMs = Math.max(0, this.jumpStartMs - deltaMs);
    this.skidMs = Math.max(0, this.skidMs - deltaMs);
    this.landingMs = Math.max(0, this.landingMs - deltaMs);
    this.hardLandingMs = Math.max(0, this.hardLandingMs - deltaMs);

    const dir = this.horizontalDirection();

    if (grounded) {
      if (dir) {
        const speed = Math.abs(body.velocity.x);
        const speedSign = Math.sign(body.velocity.x);
        const reversing = speedSign !== 0 && speedSign !== dir;

        if (reversing && speed > MOVEMENT.reverseFacingSpeed) {
          body.setVelocityX(moveToward(body.velocity.x, 0, MOVEMENT.reverseBrake * dt));
          if (speed >= MOVEMENT.skidThreshold && this.skidMs <= 0) {
            this.skidMs = MOVEMENT.skidHoldMs;
            this.onEvent({ type: 'skid' });
          }
        } else {
          this.runner.setFacing(dir);
          body.setVelocityX(moveToward(body.velocity.x, dir * MOVEMENT.maxRunSpeed, MOVEMENT.groundAcceleration * dt));
        }
      } else {
        body.setVelocityX(moveToward(body.velocity.x, 0, MOVEMENT.groundBrake * dt));
      }
    } else if (dir) {
      this.runner.setFacing(dir);
      body.setVelocityX(moveToward(body.velocity.x, dir * MOVEMENT.maxRunSpeed, MOVEMENT.airAcceleration * dt));
    }

    if (this.jumpBufferMs > 0 && this.coyoteMs > 0) {
      body.setVelocityY(-MOVEMENT.jumpVelocity);
      this.jumpBufferMs = 0;
      this.coyoteMs = 0;
      this.jumpStartMs = MOVEMENT.jumpStartMs;
      this.onEvent({ type: 'jump' });
    }

    if (jumpReleased && body.velocity.y < 0) body.setVelocityY(body.velocity.y * MOVEMENT.jumpCut);

    body.setGravityY(body.velocity.y < 0 ? MOVEMENT.gravityRise : MOVEMENT.gravityFall);
    body.setVelocityY(clamp(body.velocity.y, -MOVEMENT.jumpVelocity * 1.2, MOVEMENT.maxFallSpeed));

    if (!grounded && body.velocity.y > 0) this.lastAirDownSpeed = body.velocity.y;
    if (grounded && !this.wasGrounded) {
      const hard = this.lastAirDownSpeed >= MOVEMENT.hardLandingSpeed;
      if (hard) {
        this.hardLandingMs = MOVEMENT.hardLandingHoldMs;
        this.onEvent({ type: 'hardLand', speed: this.lastAirDownSpeed });
      } else if (this.lastAirDownSpeed > 120) {
        this.landingMs = MOVEMENT.landingHoldMs;
        this.onEvent({ type: 'land', speed: this.lastAirDownSpeed });
      }
      this.lastAirDownSpeed = 0;
    }

    this.wasGrounded = grounded;
    this.runner.syncVisual();
  }

  getState() {
    if (this.runner.dead) return 'death';

    const body = this.runner.body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) {
      if (this.hardLandingMs > 0) return 'hardLand';
      if (this.landingMs > 0) return 'land';
      if (this.skidMs > 0) return 'skid';
      return Math.abs(body.velocity.x) > 45 ? 'run' : 'idle';
    }

    if (this.jumpStartMs > 0) return 'jumpStart';
    if (body.velocity.y < -100) return 'jump';
    if (Math.abs(body.velocity.y) <= 110) return 'apex';
    return 'fall';
  }
}
