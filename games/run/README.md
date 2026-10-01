# EIXO RUN

RUN now uses a deterministic **challenge-module generator** for 900 hardcore levels.

## Design model
Hazards are no longer sprinkled independently. Every route slot can own one certified challenge:
- spike lane;
- moving saw;
- timed laser gate;
- moving/elevator platform;
- overhead crusher;
- tunnel with a floor hazard and a separate ceiling hazard.

A surface cannot accidentally receive both a saw and spikes. The only top+bottom combination is the dedicated tunnel module, where the two hazards are intentionally offset and validated.

## Variety
- 24 route styles.
- 8 challenge themes.
- Variable challenge counts instead of exactly one of every hazard.
- Static precision platforms, thick floor islands, moving platforms, elevators, crusher corridors and low-ceiling tunnel sections.
- The generator rejects runs with more than two consecutive unchallenged route pieces.

## Solvability
All 900 levels are validated against the actual RUN movement physics. Dynamic modules are constrained so they always pass through a certified route state:
- moving platforms cross their mathematically reachable base position;
- vertical saws have a passable low position;
- lasers have a verified OFF window;
- crushers have safe high clearance and a lethal low position;
- tunnel floor/ceiling hazards never overlap;
- spawn and the first jump remain hazard-free.

Progress persistence and the Level + fastest-time ranking are unchanged.
