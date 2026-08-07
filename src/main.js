import * as THREE from 'three';

import { SUN_INFO } from './config.js';
import { TimeEngine } from './time.js';
import { createStarfield } from './starfield.js';
import { createSun } from './sun.js';
import { createSolarSystem } from './planets.js';
import { createAsteroidBelt } from './asteroids.js';
import { createLabels } from './labels.js';
import { CameraRig } from './camera.js';
import { createComposer } from './postfx.js';
import { initUI } from './ui.js';

/* ------------------------------------------------------------------ *
 * Tunables
 * ------------------------------------------------------------------ */

const MAX_PIXEL_RATIO = 2;
const DEGRADED_PIXEL_RATIO = 1.25;
const ADAPTIVE_WINDOW_SEC = 4;      // averaging window for the FPS guard
const ADAPTIVE_WARMUP_SEC = 3;      // ignore startup hitches / texture decode
const ADAPTIVE_FPS_FLOOR = 40;
const FPS_READOUT_INTERVAL = 0.5;   // twice per second
const MAX_FRAME_DELTA = 0.1;        // clamp after tab switches
const CLICK_SLOP_PX = 6;            // pointer travel that still counts as a click
const CLICK_MAX_MS = 700;
const PICK_RADIUS_PX = 24;          // screen-space forgiveness for tiny bodies
const HOVER_INTERVAL_MS = 80;       // throttle for the hover hit-test

const BOOT_MIN_DISPLAY_MS = 700;    // never let the loader flash
const BOOT_TIMEOUT_MS = 8000;       // safety net if an asset never settles

const ORBIT_FOCUS_OPACITY = 0.02;   // focused body's own orbit, all but gone
const ORBIT_FADE_RATE = 4;          // exponential approach, per second

/* ------------------------------------------------------------------ *
 * Fatal overlay (context loss / boot failure)
 * ------------------------------------------------------------------ */

let overlayShown = false;

function showFatalOverlay(title, detail) {
    if (overlayShown) return;
    overlayShown = true;

    const overlay = document.createElement('div');
    overlay.id = 'fatal-overlay';
    overlay.setAttribute('role', 'alertdialog');
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:10000',
        'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
        'gap:18px', 'padding:32px', 'text-align:center',
        'background:radial-gradient(circle at 50% 45%,#131722 0%,#05060a 60%,#000 100%)',
        'color:#dbe3f2',
        'font:400 14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
    ].join(';');

    const heading = document.createElement('div');
    heading.textContent = title;
    heading.style.cssText = 'font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:#8ea6cd';

    const message = document.createElement('div');
    message.textContent = detail;
    message.style.cssText = 'max-width:46ch;color:#aeb9cc';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reload';
    button.style.cssText = [
        'margin-top:6px', 'padding:10px 26px', 'cursor:pointer',
        'border:1px solid rgba(150,180,230,.35)', 'border-radius:999px',
        'background:rgba(140,175,235,.10)', 'color:#e6edf9',
        'font:500 11px/1 inherit', 'letter-spacing:.24em', 'text-transform:uppercase'
    ].join(';');
    button.addEventListener('click', () => window.location.reload());

    overlay.append(heading, message, button);
    document.body.appendChild(overlay);

    const boot = document.getElementById('boot-loader');
    if (boot) boot.remove();
}

/* ------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------ */

function boot() {
    const appEl = document.getElementById('app');
    const hudEl = document.getElementById('hud');
    if (!appEl || !hudEl) throw new Error('Missing #app or #hud mount point.');

    /* --- boot loader ------------------------------------------------- *
     * Driven by the texture LoadingManager below: the branded overlay stays up
     * until the 8K maps have decoded, so the first frame the user sees is the
     * textured system rather than untextured spheres on a black sky.
     * ------------------------------------------------------------------ */

    const bootStartedAt = performance.now();
    const bootBarFill = document.querySelector('#boot-loader .boot-bar > i');
    let bootLoaderCleared = false;

    function setBootProgress(fraction) {
        if (!bootBarFill) return;
        const clamped = Math.min(1, Math.max(0, fraction));
        bootBarFill.style.transform = `scaleX(${clamped.toFixed(4)})`;
    }

    function clearBootLoader() {
        if (bootLoaderCleared) return;

        const shownFor = performance.now() - bootStartedAt;
        if (shownFor < BOOT_MIN_DISPLAY_MS) {
            window.setTimeout(clearBootLoader, BOOT_MIN_DISPLAY_MS - shownFor);
            return;
        }

        bootLoaderCleared = true;
        setBootProgress(1);
        appEl.classList.add('is-ready');

        const boot = document.getElementById('boot-loader');
        if (!boot) return;
        boot.classList.add('is-hidden');
        window.setTimeout(() => boot.remove(), 500);
    }

    window.setTimeout(clearBootLoader, BOOT_TIMEOUT_MS);

    /* --- renderer --------------------------------------------------- */

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        logarithmicDepthBuffer: true,
        stencil: false,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.display = 'block';
    appEl.appendChild(renderer.domElement);

    // Every texture created from here on gets max anisotropy for free.
    THREE.Texture.DEFAULT_ANISOTROPY = renderer.capabilities.getMaxAnisotropy();

    /* --- scene & camera --------------------------------------------- */

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        200000
    );
    camera.position.set(420, 780, 1650);
    camera.lookAt(0, 0, 0);

    const clock = new THREE.Clock();

    /* --- asset loading ---------------------------------------------- *
     * One manager behind the single TextureLoader every system is handed, so
     * its counters cover the whole scene. Handlers are installed before any
     * `load()` call so that `onStart` is guaranteed to fire.
     * ------------------------------------------------------------------ */

    const loadingManager = new THREE.LoadingManager();
    let assetsQueued = false;

    loadingManager.onStart = () => { assetsQueued = true; };
    loadingManager.onProgress = (url, loaded, total) => {
        setBootProgress(total > 0 ? loaded / total : 1);
    };
    // Failures still call itemEnd, so a missing texture cannot strand the
    // loader — the owning module swaps in its flat-colour fallback.
    loadingManager.onLoad = clearBootLoader;

    const textureLoader = new THREE.TextureLoader(loadingManager);

    /* --- world ------------------------------------------------------ */

    const starfieldApi = createStarfield(scene, textureLoader);
    const sunApi = createSun(scene, textureLoader);
    const solarSystem = createSolarSystem(scene, textureLoader);
    const beltApi = createAsteroidBelt(scene);

    const bodies = solarSystem.bodies;
    bodies.set('sun', {
        key: 'sun',
        name: 'Sun',
        group: sunApi.group,
        mesh: sunApi.mesh,
        radius: sunApi.radius,
        isStar: true,
        info: SUN_INFO
    });

    // Degenerate case: nothing to wait on (every texture path resolved from
    // cache or none were requested at all).
    if (!assetsQueued) clearBootLoader();

    const labelsApi = createLabels(bodies, hudEl);
    const cameraRig = new CameraRig(camera, renderer.domElement, bodies);
    const timeEngine = new TimeEngine();
    const postfx = createComposer(renderer, scene, camera);

    /* --- orbit-line focus fade --------------------------------------- */

    const orbitFades = [];
    for (const [key, body] of bodies) {
        if (body.orbitLine && body.orbitLine.material) {
            orbitFades.push({
                key,
                material: body.orbitLine.material,
                base: body.orbitLine.material.opacity
            });
        }
    }

    /**
     * Dims the focused body's own orbit so the line does not slice across the
     * close-up; everything else eases back to its authored opacity. Focusing a
     * moon fades its parent's orbit, since that is the line in frame.
     */
    function updateOrbitFade(dt) {
        if (orbitFades.length === 0) return;

        const focusedKey = cameraRig.focusedKey;
        const focusedBody = focusedKey ? bodies.get(focusedKey) : null;
        const fadeKey = (focusedBody && focusedBody.isMoon && focusedBody.parentKey)
            ? focusedBody.parentKey
            : focusedKey;

        const blend = 1 - Math.exp(-ORBIT_FADE_RATE * dt);

        for (let i = 0; i < orbitFades.length; i++) {
            const entry = orbitFades[i];
            const target = entry.key === fadeKey ? ORBIT_FOCUS_OPACITY : entry.base;
            const current = entry.material.opacity;
            if (current === target) continue;

            const next = current + (target - current) * blend;
            entry.material.opacity = Math.abs(target - next) < 0.002 ? target : next;
        }
    }

    /* --- UI --------------------------------------------------------- */

    let labelsVisible = true;

    const toggles = {
        orbits(visible) {
            for (const body of bodies.values()) {
                if (body.orbitLine) body.orbitLine.visible = visible;
            }
        },
        labels(visible) {
            labelsVisible = visible !== false;
            labelsApi.setVisible(visible);
        },
        asteroids(visible) {
            beltApi.setVisible(visible);
        }
    };

    initUI({ bodies, timeEngine, cameraRig, toggles, sunInfo: SUN_INFO });

    let fpsEl = document.getElementById('fps');

    /* --- resize ----------------------------------------------------- */

    function handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h);
        postfx.setSize(w, h);
        labelsApi.setSize(w, h);
        cameraRig.handleResize();
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    /* --- click-to-focus --------------------------------------------- */

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const tmpVec = new THREE.Vector3();

    const pickTargets = [];
    const meshToKey = new Map();
    for (const [key, body] of bodies) {
        if (body.mesh && body.mesh.isMesh) {
            pickTargets.push(body.mesh);
            meshToKey.set(body.mesh, key);
        }
    }

    /**
     * @returns {string|null} key of the body under the pointer, if any.
     */
    function pickKeyAt(clientX, clientY) {
        const rect = renderer.domElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        const hits = raycaster.intersectObjects(pickTargets, false);
        if (hits.length > 0) {
            const key = meshToKey.get(hits[0].object);
            if (key) return key;
        }

        // Planets are a handful of pixels wide from a system view, so fall back
        // to the nearest body whose projected centre is within a small radius.
        let bestKey = null;
        let bestDistance = PICK_RADIUS_PX;

        for (const [key, body] of bodies) {
            const target = body.mesh || body.group;
            if (!target || target.visible === false) continue;

            target.getWorldPosition(tmpVec).project(camera);
            if (tmpVec.z > 1) continue; // behind the camera

            const sx = rect.left + (tmpVec.x * 0.5 + 0.5) * rect.width;
            const sy = rect.top + (-tmpVec.y * 0.5 + 0.5) * rect.height;
            const distance = Math.hypot(sx - clientX, sy - clientY);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestKey = key;
            }
        }

        return bestKey;
    }

    let downX = 0;
    let downY = 0;
    let downTime = 0;
    let dragging = false;
    let pointerDown = false;
    let hoverKey = null;
    let lastHoverTest = -Infinity;

    /* Hover affordance: without it, click-to-focus is invisible. */

    function applyCursor() {
        renderer.domElement.style.cursor = pointerDown
            ? 'grabbing'
            : (hoverKey ? 'pointer' : 'grab');
    }

    function setHoverKey(key) {
        if (key === hoverKey) return;
        hoverKey = key;
        applyCursor();
        // Optional in-world echo; the labels module may not expose it.
        if (typeof labelsApi.setHover === 'function') labelsApi.setHover(key);
    }

    applyCursor();

    renderer.domElement.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        pointerDown = true;
        dragging = false;
        downX = event.clientX;
        downY = event.clientY;
        downTime = event.timeStamp;
        applyCursor();
    });

    renderer.domElement.addEventListener('pointermove', (event) => {
        if (pointerDown) {
            if (Math.abs(event.clientX - downX) > CLICK_SLOP_PX ||
                Math.abs(event.clientY - downY) > CLICK_SLOP_PX) {
                dragging = true;
            }
            return;
        }

        // Touch has no hover state, and the hit-test is too costly to run on
        // every move event.
        if (event.pointerType === 'touch') return;
        if (event.timeStamp - lastHoverTest < HOVER_INTERVAL_MS) return;
        lastHoverTest = event.timeStamp;

        setHoverKey(pickKeyAt(event.clientX, event.clientY));
    });

    renderer.domElement.addEventListener('pointerup', (event) => {
        if (!pointerDown || event.button !== 0) return;
        pointerDown = false;
        applyCursor();
        if (dragging) return;
        if (event.timeStamp - downTime > CLICK_MAX_MS) return;

        const key = pickKeyAt(event.clientX, event.clientY);
        if (key) cameraRig.focus(key);
    });

    renderer.domElement.addEventListener('pointercancel', () => {
        pointerDown = false;
        dragging = false;
        applyCursor();
    });

    renderer.domElement.addEventListener('pointerleave', () => {
        setHoverKey(null);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        cameraRig.focus(null);
    });

    /* --- context loss ----------------------------------------------- */

    let contextLost = false;
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        contextLost = true;
        showFatalOverlay(
            'Graphics context lost',
            'The browser released this page’s WebGL context. Reload to restart the simulation.'
        );
    });

    /* --- frame loop -------------------------------------------------- */

    let elapsed = 0;

    let fpsTimer = 0;
    let fpsFrames = 0;

    let adaptiveTimer = 0;
    let adaptiveFrames = 0;
    let qualityReduced = false;

    function frame() {
        if (contextLost) return;
        requestAnimationFrame(frame);

        const dt = Math.min(clock.getDelta(), MAX_FRAME_DELTA);
        elapsed += dt;

        timeEngine.update(dt);
        const jd = timeEngine.jd;

        // World first: the rig follows a focused body, so it needs this frame's
        // body positions.
        solarSystem.update(jd, elapsed, camera);
        beltApi.update(jd);

        cameraRig.update(dt);
        // OrbitControls just moved the camera; publish the new transform before
        // anything reads it, otherwise camera-relative systems lag a frame and
        // the sky visibly swims during a fly-to.
        camera.updateMatrixWorld();

        starfieldApi.update(camera);
        sunApi.update(elapsed, camera);
        updateOrbitFade(dt);
        labelsApi.update(camera, cameraRig.focusedKey);

        postfx.render(dt);

        // Sole CSS2D pass for the frame: `labelsApi.update` only computes
        // opacities. Skipped entirely while the label layer is toggled off, so
        // hidden labels cost no DOM layout.
        if (labelsVisible && labelsApi.labelRenderer) {
            labelsApi.labelRenderer.render(scene, camera);
        }

        // FPS readout, twice per second.
        fpsFrames++;
        fpsTimer += dt;
        if (fpsTimer >= FPS_READOUT_INTERVAL) {
            if (!fpsEl) fpsEl = document.getElementById('fps');
            if (fpsEl) fpsEl.textContent = String(Math.round(fpsFrames / fpsTimer));
            fpsFrames = 0;
            fpsTimer = 0;
        }

        // One-shot adaptive quality drop when the average frame rate is poor.
        if (!qualityReduced && elapsed > ADAPTIVE_WARMUP_SEC) {
            adaptiveFrames++;
            adaptiveTimer += dt;
            if (adaptiveTimer >= ADAPTIVE_WINDOW_SEC) {
                const averageFps = adaptiveFrames / adaptiveTimer;
                if (averageFps < ADAPTIVE_FPS_FLOOR && renderer.getPixelRatio() > DEGRADED_PIXEL_RATIO) {
                    qualityReduced = true;
                    renderer.setPixelRatio(DEGRADED_PIXEL_RATIO);
                    handleResize();
                }
                adaptiveFrames = 0;
                adaptiveTimer = 0;
            }
        }
    }

    clock.start();
    requestAnimationFrame(frame);
}

try {
    boot();
} catch (error) {
    console.error('[SOLARA] Startup failed:', error);
    showFatalOverlay(
        'Unable to start',
        (error && error.message) ? error.message : 'An unexpected error occurred while initialising the renderer.'
    );
}
