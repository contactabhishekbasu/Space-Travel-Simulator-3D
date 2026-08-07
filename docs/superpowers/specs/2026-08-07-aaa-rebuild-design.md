# Space Travel Simulator 3D — AAA Visual Rebuild (Design Spec)

**Date:** 2026-08-07
**Status:** Approved for autonomous execution (user directive: rebuild from scratch, AAA/SpaceEngine-level visuals, orchestrated multi-agent build with visual verification loops)

## 1. Vision & Quality Bar

Rebuild the simulator from scratch as a cinematic, physically-plausible solar system in the browser — the reference is [SpaceEngine](https://spaceengine.org/universe/) and NASA Eyes. Success means a first screenshot that looks like a game keyart: HDR sun with bloom and lens flare, Earth with day/night terminator, city lights, ocean specular and rim-scattered atmosphere, Saturn with shadowed translucent rings, a deep Milky Way starfield, and a minimal elegant HUD.

**Non-goals (YAGNI):** spacecraft tracking, quantum dashboard, measurement tools, performance dashboard, settings panel, black hole. These were bolt-ons in the old app; the rebuild optimizes for visual excellence of the core solar system. They can return later as modules.

## 2. Approach Decision

Considered:
- **A. Patch the old app** (r128, script tags) — rejected: the pipeline (no HDR, no post-processing, LDR tone mapping) caps visual quality; user asked for rebuild.
- **B. Vite + framework build** — rejected: violates the project's no-build constraint, adds toolchain without visual gain.
- **C. Chosen: Vanilla ES modules + import map, Three.js 0.180.0 from CDN, no build step.** Modern renderer features (ACES tone mapping, EffectComposer/UnrealBloom, CSS2DRenderer, Lensflare) with zero tooling. Serve with the existing `python3 -m http.server 8000`.

## 3. Rendering Pipeline (the AAA foundation)

- `WebGLRenderer({ antialias: false, logarithmicDepthBuffer: true })` — log depth for solar-system scale range.
- `renderer.toneMapping = THREE.ACESFilmicToneMapping`, `toneMappingExposure ≈ 1.1`, `outputColorSpace = THREE.SRGBColorSpace`. All color textures get `colorSpace = SRGBColorSpace`; data maps (normal/specular) stay linear.
- Post: `EffectComposer` → `RenderPass` → `UnrealBloomPass` (threshold 0.85, strength 0.55, radius 0.6) → `FXAA` (ShaderPass) → `OutputPass`. HDR emissives (sun emissive intensity >> 1) mean bloom naturally selects the sun, stars, and hot highlights — no selective-bloom complexity.
- `renderer.setPixelRatio(min(devicePixelRatio, 2))`, adaptive: drop to 1.25 if FPS < 40 sustained.
- Max anisotropy on all planet textures.

## 4. World Scale & Motion

- `AU = 400` scene units. Planet radii: true ratios × `PLANET_SCALE = 12` (Earth ≈ 0.5 units × 12 = 6 units). Sun radius fixed at 28 units (visually dominant, not to scale). These constants live in `config.js` only.
- Positions from **Keplerian orbital elements** (J2000 epoch: a, e, i, Ω, ϖ, L0, period) with mean-motion propagation and Newton-solved Kepler equation. Standard published J2000 values for the 8 planets. Ecliptic plane = scene XZ plane.
- **TimeEngine**: simulation Julian Date, play/pause, time scale from −10⁷× to +10⁷× real time (log slider), "Now" reset, date jump. All motion (orbits, rotations, moons) derives from simJD so time controls affect everything consistently.
- Axial tilt and sidereal rotation period per planet.

## 5. Visual Feature Spec (per object)

- **Sun**: 8k_sun texture modulated by a 3-octave simplex-noise granulation shader (animated, emissive ≈ 4.0 for bloom); additive fresnel **corona** shells (2 layers, shader-billboarded); **Lensflare** addon with canvas-generated flare/ghost textures (radial gradients — no external assets); a `PointLight` (white, decay 0) + low `AmbientLight` (~0.03) as the only lights.
- **Earth** (hero object, custom ShaderMaterial): 8k day map, 8k night city lights blended across the terminator (smoothstep on N·L, slight orange tint on night side), specular ocean highlight from converted specular map, normal map, separate **cloud sphere** (8k clouds, alpha from luminance, slightly faster rotation, soft shadow tint on surface is out of scope); **atmosphere**: additive BackSide fresnel-scatter shell (Rayleigh-blue rim, warm forward-scatter when camera looks sunward past the limb).
- **Other planets**: `MeshStandardMaterial` (2k/8k textures, roughness ≈ 1, metalness 0) + tuned atmosphere shells: Venus (thick cream), Mars (thin rust), Jupiter/Saturn (subtle limb glow), Uranus/Neptune (cyan/azure rim).
- **Saturn rings**: custom shader on a flat ring geometry sampling `8k_saturn_ring_alpha.png` radially; lit-side/unlit-side brightness difference and **analytic planet shadow** across the rings (project sphere shadow in shader). Subtle backlight boost when camera is on the far side.
- **Moon (Earth's)**: 8k moon texture, correct relative orbit (distance exaggerated consistently), tidally locked. **Galilean moons + Titan**: small textured-noise spheres with distinct albedo colors, correct periods.
- **Starfield**: sky sphere with `8k_stars_milky_way` (dimmed ≈ 0.35 so it never competes with the sun) + ~18,000 procedural point stars (power-law brightness, blackbody color variation, size attenuation) for depth.
- **Asteroid belt**: `InstancedMesh` of ~7,000 vertex-displaced icosahedrons between 2.1–3.3 AU, low albedo, slow Keplerian drift (approximated per-instance angular rates), subtle — texture, not confetti.
- **Orbit lines**: thin `Line` loops sampled from the same Kepler elements, additive, per-planet hue at low opacity, fading near the camera's focused planet.
- **Labels**: CSS2DRenderer sprites — small uppercase tracking-wide type, opacity by distance, hidden for the focused body.

## 6. Camera & Interaction

- OrbitControls with damping; scroll dolly with distance-proportional speed.
- **Focus system**: click a planet (raycast) or its dock button → eased fly-to (cubic in-out, ~1.8 s) into a framing distance ≈ 4× body radius; while focused, the controls target tracks the moving body. `Esc`/overview button returns to a three-quarter system view.
- Idle cinematic drift: when unfocused and idle > 30 s, slow orbital pan (any input cancels).

## 7. UI (minimal glass HUD)

Built entirely by `ui.js` into `#hud` (index.html stays skeletal). Dark glassmorphism, `backdrop-filter: blur`, system-ui type, no external fonts. Layout:
- **Bottom center**: planet dock — small circular gradient icons (CSS, per-planet colors), name on hover, active ring on focus.
- **Top right**: time cluster — date/time readout, play/pause, log time-scale slider with live label (e.g. "1 day/s"), NOW button.
- **Left**: info card on focus — name, type, and 5–6 real facts (diameter, mass, day length, year, temperature, one-line description); slides in/out.
- **Top left**: wordmark "SOLARA — Solar System Simulator" small caps; discreet FPS counter under it.
- Toggles (small icon row near time cluster): orbits, labels, asteroids.

## 8. Module Contracts (exact — all agents conform to these)

```
index.html            #app canvas mount <div id="app">, <div id="hud">, importmap:
                      "three": https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js
                      "three/addons/": https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/
                      <script type="module" src="src/main.js">
css/app.css           ALL UI styling (owned by UI agent)
src/config.js         export const AU, PLANET_SCALE, SUN_RADIUS;
                      export const PLANETS = [{ key, name, radiusKm, tex: {map, night?, clouds?, normal?, specular?, ring?, ringInner?, ringOuter?}, elements: {a, e, i, Omega, wBar, L0, periodDays}, rotationHours, axialTiltDeg, atmosphere: {color:0x…, intensity, thickness} | null, info: {type, diameter, mass, dayLength, yearLength, temperature, blurb}, dockColor: css-gradient-string }];
                      export const MOONS = [{ key, name, parent, radiusKm, distanceKm, periodDays, color|tex, tidallyLocked }];
                      export const SUN_INFO = {…same info shape…}
src/time.js           export class TimeEngine { constructor(); jd; scale; playing;
                      update(dtRealSec); setScale(s); togglePlay(); jumpToDate(Date); resetToNow(); get date(): Date }
src/orbits.js         export function keplerPosition(elements, jd, targetVec3): Vector3 (scene units, uses AU from config);
                      export function createOrbitLine(elements, colorHex): Line
src/starfield.js      export function createStarfield(scene, textureLoader): { update(camera) }
src/sun.js            export function createSun(scene, textureLoader): { group, radius, update(elapsedSec, camera) }
src/materials.js      export function createEarthMaterial(textures): ShaderMaterial (uniform sunDirection: world-space unit Vector3);
                      export function createAtmosphere(radius, {color, intensity, thickness}): Mesh (BackSide additive shell, uniform sunDirection);
                      export function createSaturnRings(innerR, outerR, ringTexture): Mesh (shader, uniforms sunDirection, planetRadius);
                      export function createCloudSphere(radius, cloudTexture): Mesh
src/planets.js        export function createSolarSystem(scene, textureLoader): {
                      bodies: Map<key, { key, name, group, mesh, radius, elements|orbit, isMoon, parent? }>,
                      update(jd, elapsedSec, camera) }   // moves planets+moons, spins, updates material sunDirection uniforms
src/asteroids.js      export function createAsteroidBelt(scene): { update(jd), setVisible(bool) }
src/labels.js         export function createLabels(bodies, hudEl): { labelRenderer, update(camera, focusedKey), setVisible(bool), setSize(w,h) }
src/camera.js         export class CameraRig { constructor(camera, rendererDom, bodies);
                      focus(key|null); focusedKey; update(dt); handleResize() }   // owns OrbitControls + fly-to + follow
src/postfx.js         export function createComposer(renderer, scene, camera): { composer, setSize(w,h), render(dt) }
src/ui.js             export function initUI(app): void   // app = { bodies, timeEngine, cameraRig, toggles: {orbits, labels, asteroids}, sunInfo }
src/main.js           bootstrap: renderer, scene, camera, loaders, all systems, resize, rAF loop with clock,
                      raycast click-to-focus, adaptive pixel ratio, FPS counter hook
```

Rules: no module reads another's internals — only these exports. `sunDirection` uniforms are updated by `planets.js`/`main.js` each frame (sun is at origin, so it's `normalize(worldPos → origin)` per body). Textures load from `textures/high/` for Earth set, Moon, Sun, Saturn ring, Milky Way; `textures/low/` (2k) for the rest. Every texture path used must exist (see inventory below).

## 9. Available Assets (verified on disk)

`textures/high/`: 8k earth day/night/clouds/normal(jpg)/specular(jpg), 8k jupiter, 8k mars, 8k mercury, 8k moon, 8k saturn + 8k ring alpha png, 8k stars_milky_way, 8k sun, 8k venus surface, 4k venus atmosphere, 4k dwarf planets.
`textures/low/`: full 2k set incl. neptune, uranus, saturn ring alpha, stars, plus 2k versions of the above.
(Earth normal/specular were TIFF; JPEG conversions now exist alongside.)

## 10. Error Handling & Performance

- Texture load failures fall back to flat-color material (`onError` → colored `MeshStandardMaterial`), app never black-screens; console.warn once per asset.
- WebGL context loss → overlay message with reload button.
- Target 60 fps @ 1440p on Apple Silicon; adaptive pixel-ratio fallback; single draw call for belt; no per-frame allocations in the loop (reused temp vectors).

## 11. Verification Plan (the loop)

1. Serve on :8000, load in browser, check console for errors (zero tolerance for uncaught).
2. Screenshot suite per iteration: (a) system overview, (b) Earth close-up day/terminator, (c) Saturn rings, (d) Sun with flare, (e) HUD interaction states.
3. Opus critique agents review screenshots against this spec's quality bar (realism, composition, UI polish) + a correctness lens (console errors, broken interactions); concrete fix lists feed parallel fix agents.
4. Loop until critiques converge (no new majors) — expected 2–4 iterations.
5. Final: legacy `js/` modules and old styles removed (recoverable via git), README updated.
