# EIXO RUN — Reboot

This directory is the clean RUN reboot. It does not reuse JUMP or any previous RUN implementation.

Current milestone: **Movement Lab**.

## Rules for this phase
- Phaser is the runtime.
- Runner gameplay collision is independent from visual sprite frames.
- No rankings, Passport XP, Daily, PB Echo or World Echo yet.
- The Movement Lab is admin-only and is not linked from the public EIXO home.
- Movement must be accepted before First Light level production begins.
- ASTRAL production art does not enter the lab until movement is approved.

## Test route

`/run-lab` while signed in as the EIXO admin.

Controls:
- A / D or Left / Right — move
- Space / W / Up — jump
- release jump early — short jump
- R — reset
- H — toggle gameplay hitbox

## Acceptance checklist

The Movement Lab is ready to leave Phase 1 only when all of these feel right in the browser:

- acceleration has weight but reaches useful speed quickly;
- releasing direction stops naturally, without sliding too far;
- full-speed reversal produces a readable skid without stealing control;
- short and full jumps are clearly different;
- late-edge jumps work via coyote time but do not feel excessive;
- slightly early jump presses are buffered on landing;
- airborne steering helps without making movement floaty;
- falling is faster than rising;
- normal landing is responsive and hard landing has extra feedback;
- death to control regain is roughly half a second;
- the camera gives useful space in front of the Runner and does not bob on every jump;
- visual sprite size/position stays consistent while the collider remains stable.

No First Light art pass or online systems should be started until this checklist is accepted.


## Private First Light build

The production-facing RUN prototype is available only to EIXO admins at:

`/run-admin`

It is deliberately separate from `/run-lab`. The admin build currently contains the first playable **ASTRAL 01 — FIRST LIGHT** pass: long-form route, alternate high route, moving platforms, Shards, checkpoints, hazards, breakable blocks, bounce pad, speed strip, secret relic room, finish gate, parallax-style Astral backdrop, HUD, pause and results screen.

The public EIXO site does not expose the build. All `/games/run/*` source/assets remain behind the same admin session gate while RUN is in production.
