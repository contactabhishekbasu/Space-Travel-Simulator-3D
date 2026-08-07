# SOLARA — Solar System Simulator

A cinematic, physically-plausible 3D solar system in the browser, rebuilt from scratch for AAA visual quality (SpaceEngine / NASA Eyes inspired). HDR rendering pipeline, real Keplerian ephemeris, custom shaders for the Sun, Earth, atmospheres and Saturn's rings — all vanilla ES modules with **no build process**.

![Three.js](https://img.shields.io/badge/Three.js-0.180-black?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES_Modules-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

## Highlights

- **HDR pipeline**: ACES filmic tone mapping, UnrealBloom, FXAA, logarithmic depth buffer
- **The Sun**: time-stable boiling granulation (3D noise), sunspots, limb darkening, layered corona, procedural lens flare
- **Earth**: 8K day/night blend across the terminator with city lights, ocean specular, normal mapping, drifting cloud layer, Rayleigh-style atmosphere rim
- **Saturn**: shader rings with Beer–Lambert translucency, analytic planet shadow with soft penumbra, lit/unlit-face physics
- **Real motion**: J2000 Keplerian elements for all 8 planets, major moons (Moon, Galileans, Titan), 7,000-instance asteroid belt
- **Time engine**: ±10⁷× real time, date jump, all motion derived from simulation Julian Date
- **Camera**: sun-anchored fly-to framing (always arrives on the lit face), body tracking, idle cinematic drift
- **Glass HUD**: planet dock with per-planet icons, time cluster, info cards with real NASA data, orbit/label/asteroid toggles

## Quick Start

```bash
# Mac/Linux
./start-server.sh

# Windows
start-server.bat

# Or manually
python3 -m http.server 8000
```

Open http://localhost:8000. Requires a modern WebGL2 browser; Three.js loads from CDN via import map.

## Controls

- **Drag** to orbit · **scroll** to zoom · **click a body** to focus
- **Esc** or the dock's overview button returns to the system view
- **Space** toggles time; speed slider is logarithmic (−10⁷× … +10⁷×)
- Focused bodies show an info card with real physical data

## Architecture

```
index.html        import map + shell (loads src/main.js)
css/app.css       all HUD styling
src/
  main.js         bootstrap, frame loop, picking, adaptive quality
  config.js       scale constants, planet/moon data, J2000 elements
  time.js         TimeEngine (Julian Date, time scaling)
  orbits.js       Kepler solver + orbit line builder
  materials.js    Earth / atmosphere / ring / cloud shaders
  sun.js          photosphere shader, corona, lens flare, lights
  starfield.js    Milky Way sphere + 18k procedural stars
  planets.js      solar system builder + per-frame updates
  asteroids.js    instanced belt
  labels.js       CSS2D labels with distance/occlusion fades
  camera.js       CameraRig: fly-to, follow, idle drift
  postfx.js       EffectComposer chain (bloom, FXAA)
  ui.js           HUD construction and bindings
```

Design spec and build plan live in `docs/superpowers/`.

## Assets

Planet textures (2K/8K) in `textures/low/` and `textures/high/` — courtesy of [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). Earth normal/specular converted to JPEG for browser loading.

## License

MIT — see LICENSE.

## Acknowledgments

- Three.js community
- Solar System Scope for planetary texture resources
- NASA for orbital data and inspiration
