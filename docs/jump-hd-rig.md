# JUMP HD component rig

The V7 multi-character sheets are retired from rendering. Nine individually generated PNG files live under `assets/hero-v8/`. Each arm, leg, hand and boot has its own instance in the skeleton; no frame is cut from a neighbouring character.

Source resolution is preserved. Material variants are cached at native image dimensions with a 128 MiB LRU limit. Original colours bypass tinting. Canvas smoothing and higher backing resolution are enabled in the wardrobe and Passport. The small gameplay footprint necessarily displays fewer details than the enlarged view.

`jump-rig.js` drives both legs with a half-cycle offset. Thighs and shins are fixed at 15 and 14 units, with forward-bending knees. Stance travel cancels 112 units per cycle, matching the movement emitter. Airborne targets change continuously with vertical speed and are damped over time. The cape is a separate hanging texture warped along a damped centreline and omitted for the `none` accessory.

Wardrobe defaults come from `jump-server.js`. Reset changes every selector and the preview; Save persists the selection through the existing cosmetics endpoint. Preview uses requestAnimationFrame and ends when its modal closes.

## Asset provenance

Generated with the built-in imagegen tool, using the approved V7 character design as reference. Shared prompt: “Production individual skeletal animation asset. Premium cel-shaded high-resolution matching reference. Exactly one object with generous padding. Genuinely transparent alpha background. No glow, no backdrop, no text, no other body parts.” Component-specific prompts:

- `head.png`: HEAD WITH HAIR AND SHORT NECK only. Right-facing strict side profile. Navy tousled hair, approved young man's face. No shoulders.
- `torso.png`: SLEEVELESS TORSO AND PELVIS only, right-facing side profile. Cream cropped jacket over black shirt, navy waistband and hip garment. No arms, no head, no legs, NO CAPE. Neutral upright vertical posture.
- `upperArm.png`: ONE UPPER ARM SLEEVE only, cream jacket fabric from rounded shoulder at top to elbow at bottom, straight down vertical. No forearm, hand or torso. Right-facing side-view shading.
- `forearm.png`: ONE FOREARM only, bare warm skin with dark leather wrist cuff at bottom. Elbow at top, wrist at bottom, straight down vertically. No hand, no upper arm.
- `hand.png`: ONE HAND only wearing dark fingerless glove, relaxed closed running fist pointed down, wrist at top. Strict side view, thumb towards right. No forearm.
- `thigh.png`: ONE THIGH garment only, navy trouser segment from rounded hip at top to knee at bottom, vertical straight. No pelvis, no shin, no foot.
- `shin.png`: ONE SHIN garment only, navy tapered trouser segment from knee at top to ankle at bottom, vertical straight. No thigh, no foot.
- `boot.png`: ONE COMPLETE BOOT only, brown leather futuristic running boot cyan ankle ring. Strict right-facing side profile, flat horizontal sole, toe pointing right, ankle at upper left. No leg.
- `cape.png`: ONE COPPER RED CAPE only. Hanging DOWN naturally, vertically, narrow neck attachment at top, widening cloth below with gentle folds. No wind, no character, no clasps or other objects. Side-view fabric for skeletal cloth animation.

## Verification

`node --test tests/jump-rig.test.js` checks both legs, constant bone lengths, stance contact, continuity across the apex and original wardrobe defaults. `tests/browser-rig.cjs` loads the actual renderer, checks alpha, records enlarged movement, captures the Astral scene and clicks Reset then Save in the real wardrobe function with a stubbed account API. Output goes to `tmp/jump-qa/rig-v8.png` and `rig-v8.webm`.
