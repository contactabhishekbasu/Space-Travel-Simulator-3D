# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**SOLARA** is a cinematic browser-based 3D solar system simulator (SpaceEngine / NASA Eyes inspired), rebuilt from scratch in August 2026. Vanilla ES modules + Three.js 0.180 from CDN via import map — **no build process, no npm**. Serve statically and open in a browser.

The full design spec (quality bar, visual feature spec, module contracts) is at
`docs/superpowers/specs/2026-08-07-aaa-rebuild-design.md` — read it before structural changes. §8 module contracts are binding: modules interact only through those exports.

## Running

```bash
./start-server.sh        # Mac/Linux
start-server.bat         # Windows
python3 -m http.server 8000   # manual
```

http://localhost:8000 — needs WebGL2 and network access for the Three.js CDN.

## Architecture

- `index.html` — minimal shell: import map (`three`, `three/addons/`), `#app`, `#hud`, boots `src/main.js`
- `src/main.js` — renderer (ACES filmic, sRGB, log depth, `antialias:false` + FXAA in post), frame loop, click-to-focus raycasting with screen-space fallback, adaptive pixel ratio
- `src/config.js` — **all scale constants** (`AU = 400` scene units, `PLANET_SCALE = 40`, `SUN_RADIUS = 28`), planet/moon data, J2000 Keplerian elements, info-card facts
- `src/time.js` — `TimeEngine`: simulation Julian Date, scale ±10⁷×, all motion derives from `jd`
- `src/orbits.js` — Kepler solver (`keplerPosition`), orbit line builder; ecliptic = scene XZ plane, +Y north
- `src/materials.js` — custom shaders: Earth day/night/specular/normal, atmosphere shells (sun-modulated rim), Saturn rings (Beer–Lambert alpha, analytic planet shadow, lit/unlit translucency), cloud sphere. All custom shaders MUST include Three's logdepthbuf shader chunks or they z-fight everything
- `src/sun.js` — photosphere shader (3D-noise granulation; **all animation folded through bounded harmonics — never integrate raw time**, that caused a banding regression), corona shells, canvas-generated lens flare, scene lights (PointLight at origin + faint ambient — the only lights)
- `src/starfield.js` — Milky Way sphere (dimmed) + ~18k procedural point stars, both re-centered on camera each frame
- `src/planets.js` — builds bodies from config, per-frame: Kepler positions, spins, `sunDirection` uniforms (= `normalize(-worldPos)`, sun at origin)
- `src/asteroids.js` — single InstancedMesh belt (~7k)
- `src/labels.js` — CSS2DRenderer labels (`.body-label`), distance + sun-occlusion fades
- `src/camera.js` — `CameraRig`: sun-anchored fly-to (arrival = `bodyPos − normalize(bodyPos)·framingDist`, so the camera always lands on the **lit** face; retargets the moving body every tween frame), follow mode, idle drift
- `src/postfx.js` — RenderPass → UnrealBloom (0.55/0.6/0.85) → FXAA → OutputPass
- `src/ui.js` + `css/app.css` — entire glass HUD built into `#hud` at runtime

## Hard-won invariants (violating these caused real regressions)

1. **Transparent + depth**: anything transparent that must occlude the additive starfield uses `depthWrite: true` with an early `discard` for near-zero alpha — never a separate depth-only occluder mesh (its stock vertex transform z-fights the custom shader's under log depth).
2. **Time-stable shaders**: no shader term may accumulate unbounded time; wrap with `fract`/sin harmonics. The sim can idle at high time-scale for hours.
3. **Custom ShaderMaterials** need `#include <logdepthbuf_*>` chunks (and `<common>` in the vertex stage).
4. **No per-frame allocations** in update paths — reuse temp vectors.
5. Color textures get `SRGBColorSpace`; data maps (normal/specular) stay linear.

## Verification

No test suite — verify visually. Serve on :8000, then use Playwright/browser screenshots of: system overview, Earth close-up (day + night side for city lights), Saturn rings from both a lit and unlit approach, Sun close-up (check granulation isn't banded after long sim time), a focus-from-focus camera transition (must arrive lit-side). Console must be error-free; expect 60 FPS.

## Assets

`textures/low/` (2K) and `textures/high/` (8K): Solar System Scope planet maps, Saturn ring alpha PNG, 8K Milky Way panorama. Earth normal/specular exist as browser-loadable JPEG conversions alongside the original TIFFs. Reference only files that exist — texture load failures fall back to flat-color materials by design.
