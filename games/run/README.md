# EIXO RUN

RUN has **900 deterministic hardcore levels** and a validator designed around the actual movement physics.

## Level design
Every level is difficult from Level 001 onward. The generator combines:
- narrow precision jumps and height changes;
- wide challenge platforms with moving saws above the walking surface;
- spike strips with explicit landing/take-off safety zones;
- pulsing laser gates placed directly in mandatory gaps;
- increasingly dense combinations of the three hazard families.

Saws are never generated below platforms. Lasers must actually cross the mandatory route. Decorative route platforms are avoided: the generated platform chain is the route itself.

## Solvability
The 900-level set is deterministic, so all players see the same Level 001…900.

Automated validation checks:
- every consecutive mandatory jump against real gravity, run speed, jump speed and height difference;
- minimum landing-platform width;
- spike clearances and safe take-off/landing zones;
- saw height and safe waiting zones;
- laser placement and a sufficiently long OFF window for a human crossing;
- at least 2 spike challenges, 1 saw and 1 laser in every single level;
- unique geometry across all 900 levels.

The player object is also destroyed on every reload/level change, preventing the old white player rectangles from remaining behind.

## Ranking
Ranking remains:
1. highest completed level;
2. fastest time on that level;
3. earlier stored record as the final tie-break.

## Controls
- A/D or Left/Right: move
- Space/W/Up: jump / wall jump
- R: restart current level
- H: return to EIXO
