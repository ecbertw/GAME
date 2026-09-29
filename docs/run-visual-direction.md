# EIXO RUN — production direction

RUN is a new game. The previous RUN implementation is not a codebase to patch.

## Locked visual direction

- 2D animated EIXO Runner inside a stylized 2.5D Astral world.
- Runner outfit is fixed: white, dark navy/black and EIXO red.
- The character is deliberately simplified: large head, compact body, mitten-like hands and oversized shoes.
- No runtime 3D character, GLB, skeleton, IK, weight painting, cloth or JavaScript bone corrections.
- Optional cosmetics are lightweight visual overlays only: trail, glow, aura or VIP FX.

## Locked world direction

ASTRAL is vibrant rather than dark-realistic: deep blue sky, violet/cyan atmosphere, giant moon, floating ruins, clouds, crystals and chunky readable gameplay surfaces.

The governing rule is **simple character + rich world**.

## Architecture

- run/core/simulation.js — deterministic 120 Hz gameplay.
- run/levels/astral-first-light.js — hand-authored level data.
- run/player/sprite-runner.mjs — character presentation.
- run/rendering/astral-renderer.mjs — world presentation.
- run/camera/camera.mjs — camera only.
- run/input/input.mjs — keyboard/touch input only.
- run/replay/recorder.mjs — replay recording only.
- run-server.js — validation, rankings, PB/World Echo, Daily and progression.

RUN must not depend on JUMP physics, JUMP rendering, JUMP multiplayer or the old JUMP 3D character.
