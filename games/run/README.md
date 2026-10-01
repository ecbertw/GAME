# EIXO RUN

RUN is a self-contained minimal hardcore precision platformer.

## Core loop
- 12 short handcrafted levels.
- One continuous clock from level 1 to level 12.
- Deaths restart the current level immediately and the clock never stops.
- Movement is intentionally simple: left/right, jump, wall jump.
- Hazards are visually consistent: red kills, white is solid, green is the exit.
- Difficulty comes from spacing, timing, saws and pulsing lasers rather than visual clutter.

## Ranking
The public route is `/run`.

Logged-in players can submit times. The server creates a RUN attempt before the clock starts and validates the completed attempt against server elapsed time before storing a personal best.

Ranking order:
1. Lowest total time.
2. Fewer deaths when times are equal.
3. Earlier stored best.

## Controls
- A/D or Left/Right: move
- Space/W/Up: jump / wall jump
- R: restart current level (counts as a death)
- H: return to EIXO
