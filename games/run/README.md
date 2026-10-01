# EIXO RUN

RUN is a self-contained minimal hardcore precision platformer.

## Core loop
- 12 short handcrafted levels.
- Every level has its own timer.
- Finishing a level resets the timer to zero for the next level.
- Dying restarts the current level, but does not reset that level's timer.
- Death counts are not displayed or used in ranking.
- Movement is intentionally simple: left/right, jump, wall jump.
- Hazards are visually consistent: red kills, white is solid, green is the exit.

## Ranking
The public route is `/run`.

The ranking is progression-first:
1. Highest completed level.
2. Fastest completion time for that level.
3. Earlier stored record as the final tie-break.

Example: Level 12 in 30s ranks above Level 12 in 40s, and both rank above Level 10 in 40s.

Each player keeps one ranking record: their highest completed level and the best time they have recorded for that level.

## Controls
- A/D or Left/Right: move
- Space/W/Up: jump / wall jump
- R: restart the current level
- H: return to EIXO
