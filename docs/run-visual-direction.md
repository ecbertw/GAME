# EIXO RUN — Visual production rules

This file locks the production direction approved for RUN. It exists to stop the project drifting back toward the JUMP character pipeline.

## Character

- The EIXO Runner is a **2D animated sprite**, not a runtime 3D rig.
- Outfit is fixed: white, dark navy/black and EIXO red.
- No runtime skeleton, IK, weight painting, bone corrections or cloth simulation.
- Character art may look cel-shaded / pre-rendered, but gameplay consumes a sprite atlas through `SpritePlayer`.
- New visual atlases must preserve the manifest contract in `assets/run/character/runner-atlas.json`.
- Cosmetic expansion is limited to lightweight overlays such as aura, glow, trail or VIP FX. Cosmetics never alter collision or physics.

## Animation readability

The production states are idle, run, fast-run, skid, jump-start, jump, apex, fall, landing, death and victory.

Animation is designed for side-view readability at roughly 80–100 px on screen. Big shoes, compact proportions and a clear silhouette take priority over anatomical realism.

## World

ASTRAL is a stylized 2.5D world: vibrant celestial sky, large moon, floating ruins, chunky readable platforms, crystals, clouds, waterfalls, cyan/violet light and restrained EIXO red accents.

The rule is **simple character + rich world**.

Gameplay surfaces must remain immediately readable. Decoration, parallax and foreground art must never obscure platforms, hazards, Shards or the Runner.

## Technical boundary

`physics-core.js` owns gameplay simulation.
`SpritePlayer` owns character presentation.
`Renderer` owns world presentation.

None of these layers should need JUMP rendering, JUMP rigging or the old GLB character to function.
