# JUMP — Motion & Effects V4

## Motion language
The runner keeps the approved EIXO character artwork, but the animation is now treated like a rig instead of a frame swap.

- Natural stride with contact, compression, propulsion, flight and recovery.
- Arms counter-swing from the legs instead of looping independently.
- Pelvis travel, torso rotation and head compensation are coupled to the stride.
- Take-off stretches the silhouette; landing compresses it briefly.
- Feet rotate through recovery and landing instead of staying rigid.
- Cape remains physically attached at the shoulder and reacts to speed, jump and fall.

Gameplay collision and physics are unchanged. This is a presentation-only animation layer.

## Effects V2
Effects use the same visual language as the EIXO site: orbital lines, resonance, short luminous wakes and controlled particles. Full-screen clutter and permanent body glows are intentionally avoided.

| VIP | Effects |
| --- | --- |
| 0 | None |
| 1 | Orbit, Ion Trace |
| 2 | Stardust, Resonance |
| 3 | Comet, Aurora |
| 4 | Quantum, Eclipse |
| 5 | Supernova, Void |
| 6 | Singularity, Prism |

Legacy saved effects map automatically to the nearest V2 effect.

## Design rules
1. Effects stay close to the feet/body and never obscure platforms.
2. Running uses sparse emissions; jumps use short aerial wakes.
3. Landings get one readable ring/burst instead of particle spam.
4. VIP level changes complexity, not only brightness.
5. Effects use additive rendering but conservative alpha for multiplayer readability.
