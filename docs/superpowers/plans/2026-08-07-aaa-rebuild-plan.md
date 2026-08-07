# AAA Rebuild — Implementation Plan

Spec: `docs/superpowers/specs/2026-08-07-aaa-rebuild-design.md` (single source of truth; all module contracts pinned in §8).

## Orchestration model
- **Fable** (this session): planning, integration, browser driving, screenshot capture, loop control, final report.
- **Opus 5 subagents**: all code execution (build wave, fix waves) and screenshot critique.
- Bounded phases (< ~25 min each) so no agent is ever mid-flight near session limits; the app is testable after Phase B.

## Phase A — Foundation (done inline)
- Asset inventory, TIFF→JPEG conversion, spec, this plan, `.claude/launch.json` for the preview server.

## Phase B — Build wave (6 parallel Opus agents, strict file ownership)
| Task | Files owned |
|------|-------------|
| B1 core shell | `index.html`, `src/main.js`, `src/postfx.js` |
| B2 data & math | `src/config.js`, `src/time.js`, `src/orbits.js` |
| B3 shader library | `src/materials.js` |
| B4 sun & stars | `src/sun.js`, `src/starfield.js` |
| B5 world builder | `src/planets.js`, `src/asteroids.js`, `src/labels.js` |
| B6 camera & HUD | `src/camera.js`, `src/ui.js`, `css/app.css` |

Every agent reads the spec first, writes only its files, conforms exactly to §8 contracts, returns files written + deviations.

## Phase C — Integration (Fable + 1 Opus fixer if needed)
Serve on :8000, load in embedded browser, drive to zero console errors and a rendering scene. Interface mismatches fixed directly.

## Phase D — Visual verification loop (repeat 2–4×)
1. Capture screenshot suite (overview / Earth / Saturn / Sun / HUD states) → scratchpad PNGs.
2. Parallel Opus critiques: (a) AAA-realism lens, (b) correctness/UX lens — each returns ranked concrete fixes.
3. Parallel Opus fix agents (disjoint file ownership per fix cluster).
4. Re-capture, re-critique. Exit when no majors remain.

## Phase E — Cleanup & handoff
Remove legacy `js/*` modules, old `css/styles.css` content, stale HTML (git-recoverable; no commits unless asked). Update README run instructions. Final report with before/after screenshots.
