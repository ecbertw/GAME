# EIXO RUN

RUN contains 900 deterministic hardcore levels.

## Persistence
- Practice / no account: current level is stored in browser localStorage and survives refreshes and normal deploys on the same browser and domain.
- Logged in: the server resumes the latest unfinished PostgreSQL attempt.
- A stale unfinished attempt can never pull a player behind their recorded best: server resume uses the higher of the unfinished current level and best completed level + 1.
- Authenticated server progress takes precedence over local browser progress for ranking integrity.

## Level safety
All 900 levels are automatically regenerated and validated:
- the spawn surface is completely hazard-free;
- the first jump never contains a laser;
- every mandatory jump is inside the actual RUN physics envelope;
- every level contains at least 2 spike zones, 1 saw and 1 laser;
- saws are above their platform;
- lasers have a verified OFF window long enough for the required crossing.

## Variety
There are 24 structural styles and 6 hazard themes. The route can mix narrow precision platforms, medium hazard platforms, wide saw platforms and thick floor islands, with different climb/descent/zig-zag/fractured height patterns. The current 900-level set has hundreds of distinct structural profiles in addition to 900 unique geometries.

Ranking remains highest completed level first, then fastest time for that level.
