# EIXO RUN

RUN now has **900 deterministic, unique hardcore levels**.

## Core loop
- 900 fixed levels: every player receives the exact same Level 001…900.
- Each level has its own timer.
- Clearing a level resets the timer for the next level.
- Dying restarts the current level without resetting that level's timer.
- Deaths remain visible in the HUD but do not affect ranking.
- Ranking stays: highest completed level first, then fastest time on that level.

## Solvability system
The levels are generated from fixed seeds, but generation is constrained by the real RUN physics.

Every mandatory jump is kept inside a conservative 72% movement envelope calculated from:
- gravity;
- jump velocity;
- horizontal run speed;
- the exact height difference between take-off and landing.

The validator checks all 900 levels for spawn support, EXIT support, every mandatory jump, minimum landing width, laser off-windows and saw clearance. It also rejects duplicate geometry or duplicate names.

This makes the 900-level set reproducible and automatically testable. The architecture can be extended beyond 900 later by increasing the configured level count and passing the same validation.

## Controls
- A/D or Left/Right: move
- Space/W/Up: jump / wall jump
- R: restart current level
- H: return to EIXO
