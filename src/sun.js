/**
 * sun.js — the star at the centre of the system.
 *
 * Builds:
 *   • a high-resolution core sphere driven by a custom shader (8k photosphere
 *     texture + 3-octave simplex granulation sampled in 3D against the sphere
 *     direction, sparse sunspot pairs, limb darkening, HDR emissive output that
 *     UnrealBloom picks up),
 *   • two additive back-side corona shells whose brightness is computed from the
 *     view ray's impact parameter (so the glow really falls off with distance
 *     from the limb rather than ringing the shell silhouette),
 *   • a modest camera-facing glow sprite from a procedurally generated gradient,
 *   • a restrained procedural Lensflare (soft core, faint diffraction spike, and
 *     round ghosts that fade out entirely as the star approaches screen centre),
 *   • the scene's only two lights: a decay-free PointLight and a faint AmbientLight.
 *
 * Time stability: `elapsedSec` is an unbounded accumulator, so nothing here is
 * allowed to integrate it. Every animated term is an exact integer harmonic of
 * ANIM_PERIOD_SEC and `update()` folds the elapsed time into a single period
 * before it reaches the GPU. The star therefore looks the same after ten million
 * seconds as it does in the first minute, shader inputs stay small enough for
 * float32 to keep its resolution, and — the regression this replaced — no UV or
 * noise offset can grow until neighbouring latitudes sample unrelated longitudes
 * and the photosphere shears into concentric stripes.
 *
 * Contract: createSun(scene, textureLoader) -> { group, mesh, radius, update(elapsedSec, camera) }
 */

import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { SUN_RADIUS } from './config.js';

const SUN_TEXTURE_URL = 'textures/high/8k_sun.jpg';

/** Radii of the two corona shells, as multiples of the photosphere radius. */
const SHELL_A_SCALE = 1.25;
const SHELL_B_SCALE = 2.1;

/** Extent of the soft glow sprite, as a multiple of the photosphere radius. */
const GLOW_SPRITE_SCALE = 3.0;

/**
 * Ghost fade window, in NDC radius from screen centre. three's Lensflare places
 * every ghost by lerping from the light toward the centre of the frame, so a
 * star sitting near the centre collects all of them on top of its own disc.
 * Below GHOST_FADE_MIN the ghosts are gone entirely.
 */
const GHOST_FADE_MIN = 0.15;
const GHOST_FADE_MAX = 0.55;

/**
 * Master period of every animated term on the star, in seconds. The whole
 * surface is a loop of this length: long enough that nobody watches it come
 * round, short enough that the shader never sees a large time value.
 */
const ANIM_PERIOD_SEC = 1440;

/** Base angular frequency of that loop. All rates below are integer multiples. */
const ANIM_BASE_W = (Math.PI * 2) / ANIM_PERIOD_SEC;

/** Corona breathing rates as harmonics — 71 and 53 land on ~0.31 and ~0.23 rad/s. */
const BREATH_A_HARMONIC = 71;
const BREATH_B_HARMONIC = 53;

/**
 * Folds elapsed time into one master period. Because every time-dependent term
 * in this file is an exact harmonic of ANIM_PERIOD_SEC, the fold is invisible:
 * the shader state at `t` and at `t + ANIM_PERIOD_SEC` is the same state.
 *
 * @param {number} seconds elapsed seconds since app start (may be arbitrarily large)
 * @returns {number} equivalent time in [0, ANIM_PERIOD_SEC)
 */
function animTime(seconds) {
    if (!Number.isFinite(seconds)) return 0;
    const wrapped = seconds % ANIM_PERIOD_SEC;
    return wrapped < 0 ? wrapped + ANIM_PERIOD_SEC : wrapped;
}

/* ------------------------------------------------------------------ */
/* GLSL building blocks                                                */
/* ------------------------------------------------------------------ */

/**
 * 3D simplex noise. Names are prefixed so nothing can collide with the
 * three.js ShaderChunk library that gets pulled in via #include <common>.
 */
const SIMPLEX_GLSL = /* glsl */ `
vec3 sn_mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 sn_mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 sn_permute(vec4 x) { return sn_mod289(((x * 34.0) + 1.0) * x); }
vec4 sn_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // first corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // permutations
    i = sn_mod289(i);
    vec4 p = sn_permute(sn_permute(sn_permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // gradients: 7x7 points over a square, mapped onto an octahedron
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // normalise gradients
    vec4 norm = sn_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // mix contributions from the four corners
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/**
 * The shader-side half of the animation clock. Every rate is expressed as an
 * integer harmonic of ANIM_W so that folding `uTime` on the CPU is exact.
 */
const ANIM_GLSL = /* glsl */ `
const float SUN_TAU = 6.283185307179586;
const float ANIM_PERIOD = ${ANIM_PERIOD_SEC.toFixed(1)};
const float ANIM_W = ${ANIM_BASE_W.toFixed(12)};

/**
 * A bounded walk through a noise domain: three sinusoids on different integer
 * harmonics, so the offset traces a closed space curve instead of sliding away
 * to infinity. Two things follow. The field keeps evolving: with coprime
 * harmonics the curve only closes after a full master period, and it never
 * retraces itself on all three axes at once, so the pattern reads as boiling
 * rather than as a texture panning past. And the sampled coordinate stays within
 * a couple of noise cells of the sphere itself, which is what lets float32
 * resolve the same detail on the first frame and the ten-millionth.
 */
vec3 domainLoop(float t, float amp, vec3 harmonics, vec3 phase) {
    return amp * sin(harmonics * (ANIM_W * t) + phase);
}
`;

const SURFACE_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;
varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
    vUv = uv;
    vDir = normalize(position);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosW = worldPosition.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    #include <logdepthbuf_vertex>
}
`;

const SURFACE_FRAGMENT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

uniform sampler2D uMap;
uniform float uTime;
uniform float uEmissive;
uniform vec3 uHotTint;
uniform vec3 uLimbTint;

varying vec2 vUv;
varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;

${SIMPLEX_GLSL}
${ANIM_GLSL}

/** Turns of rigid spin per master period. Integer, so the time fold is seamless. */
const float SPIN_HARMONIC = 3.0;

/**
 * Peak lead of the equator over the poles, in UV. The Sun does rotate
 * differentially, but the instant that difference is integrated over shader time
 * it drags neighbouring latitudes arbitrarily far apart in longitude and the
 * equirectangular plate collapses into concentric stripes. Here it is a bounded
 * oscillation instead: at any instant the entire disc is within this much of a
 * single rigid rotation, and the lead is handed back rather than accumulated.
 */
const float DIFFERENTIAL_SHEAR = 0.006;

/** Granulation frequencies, in noise cells per unit sphere radius. */
const float CELL_FREQ = 22.0;
const float MID_FREQ = CELL_FREQ * 2.03;
const float FINE_FREQ = CELL_FREQ * 4.13;
const float SUPER_FREQ = 5.5;

/** Sunspots: a rare, slow activity mask gating a small-scale core field. */
const float SPOT_REGION_FREQ = 2.4;
const float SPOT_CORE_FREQ = 13.0;

/** Longitude gap between the leading and trailing spot of a group, in radians. */
const float SPOT_PAIR_SEP = 0.16;

/** Umbral light is cooler as well as dimmer. */
const vec3 SPOT_TINT = vec3(0.95, 0.74, 0.55);

vec3 rotateY(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

/**
 * Fades an octave out as its cells shrink towards the size of a pixel, which
 * happens both at the limb, where foreshortening compresses them, and as the
 * camera pulls away. Without it the granulation aliases into crawling moire the
 * moment the disc stops filling the frame.
 */
float bandLimit(float cellsPerPixel) {
    return 1.0 - smoothstep(0.30, 0.90, cellsPerPixel);
}

void main() {
    vec3 dir = normalize(vDir);
    float sinLat = clamp(dir.y, -1.0, 1.0);

    /* --- rotation ------------------------------------------------------ */

    // Rigid spin: a single fract()-wrapped scalar, identical at every latitude,
    // so it can only shift the plate, never shear it. SPIN_HARMONIC turns per
    // master period keeps the wrap aligned with the rest of the animation.
    float spin = fract(uTime * (SPIN_HARMONIC / ANIM_PERIOD));

    float equatorial = 1.0 - sinLat * sinLat;
    float shear = DIFFERENTIAL_SHEAR * (equatorial - 0.5) * sin(ANIM_W * uTime);
    float turns = spin + shear;

    // uv.x leaves [0,1] by at most one turn and wrapS is RepeatWrapping, which
    // resolves that exactly. A fract() on the final coordinate instead would
    // stamp a derivative discontinuity (a blurred seam line) across the disc.
    vec3 base = texture2D(uMap, vec2(vUv.x - turns, vUv.y)).rgb;

    // Everything procedural is sampled in the frame that co-rotates with the
    // plate, so pattern and texture travel together. rotateY is 2*PI-periodic,
    // which makes the wrapped turn count the exact angle, not an approximation.
    vec3 rd = rotateY(dir, -SUN_TAU * turns);

    /* --- granulation ---------------------------------------------------- */

    // 3D noise against the sphere direction: seamless across the UV seam and
    // free of the polar pinch that sampling in UV space would introduce.
    vec3 flowCell = domainLoop(uTime, 1.15, vec3(23.0, 19.0, 29.0), vec3(0.0, 2.1, 4.3));
    vec3 flowMid = domainLoop(uTime, 1.00, vec3(37.0, 41.0, 31.0), vec3(1.3, 5.0, 2.7));
    vec3 flowFine = domainLoop(uTime, 0.85, vec3(53.0, 47.0, 59.0), vec3(3.9, 0.7, 5.6));
    vec3 flowSuper = domainLoop(uTime, 0.80, vec3(5.0, 7.0, 3.0), vec3(2.2, 4.9, 1.1));

    float nCell = snoise(rd * CELL_FREQ + flowCell);
    float nMid = snoise(rd * MID_FREQ + flowMid);
    float nFine = snoise(rd * FINE_FREQ + flowFine);
    float nSuper = snoise(rd * SUPER_FREQ + flowSuper);

    float footprint = length(fwidth(rd));
    float wCell = bandLimit(footprint * CELL_FREQ);
    float wMid = bandLimit(footprint * MID_FREQ);
    float wFine = bandLimit(footprint * FINE_FREQ);

    // Intergranular lanes are the zero set of the cell field, thickened into a
    // dark reticulated network. A domain warp would curdle the cells similarly,
    // but a warp strong enough to do it also drags whole regions into large
    // coherent swirls; a threshold on |noise| stays local by construction.
    // These thresholds were measured against this exact noise (sigma 0.374) to
    // land on ~70% bright cell interiors and ~9% dark lane cores.
    float lanes = smoothstep(0.02, 0.18, abs(nCell + 0.30 * nMid));

    // 0.816 is the measured mean of the lane term. Subtracting it keeps it
    // zero-mean, so the disc holds its average brightness both across the
    // surface and as the band limit above fades the octave out with distance.
    float bright = 1.0
                 + (lanes - 0.816) * 0.42 * wCell
                 + nMid * 0.20 * wMid
                 + nFine * 0.12 * wFine
                 + nSuper * 0.14;

    /* --- sunspots -------------------------------------------------------- */

    // Confined to the activity belts, roughly 4 to 38 degrees either side of the
    // equator, and never at the poles, where the real Sun has none either.
    float absLat = abs(sinLat);
    float belt = smoothstep(0.06, 0.17, absLat) * (1.0 - smoothstep(0.44, 0.62, absLat));

    vec3 flowRegion = domainLoop(uTime, 0.70, vec3(2.0, 1.0, 3.0), vec3(0.9, 3.4, 5.9));
    vec3 flowSpot = domainLoop(uTime, 0.55, vec3(4.0, 3.0, 5.0), vec3(2.6, 1.2, 4.4));

    // Two independent gates, both rare, so their coincidence is rarer still:
    // spots end up covering well under a percent of the surface.
    float region = smoothstep(0.20, 0.60, snoise(rd * SPOT_REGION_FREQ + flowRegion));

    // The same small-scale field sampled a few degrees apart in longitude, so
    // every blob arrives with a companion the way real groups do.
    float coreA = snoise(rd * SPOT_CORE_FREQ + flowSpot);
    float coreB = snoise(rotateY(rd, SPOT_PAIR_SEP) * SPOT_CORE_FREQ + flowSpot);
    float spot = belt * region * smoothstep(0.38, 0.78, max(coreA, coreB));

    float penumbra = smoothstep(0.02, 0.55, spot);
    float umbra = smoothstep(0.45, 0.95, spot);
    bright *= 1.0 - penumbra * 0.45 - umbra * 0.38;
    bright = clamp(bright, 0.22, 1.75);

    vec3 color = base * bright;
    color = mix(color, color * uHotTint, saturate((bright - 1.0) * 1.3));
    color = mix(color, color * SPOT_TINT, penumbra);

    // Limb darkening: two-term law with the measured 550 nm coefficients, so the
    // limb lands near 30% of disc-centre intensity instead of a token 5% dip.
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float mu = saturate(dot(normalize(vNormalW), viewDir));
    float oneMinusMu = 1.0 - mu;
    float limb = 1.0 - 0.93 * oneMinusMu + 0.23 * oneMinusMu * oneMinusMu;
    color *= max(limb, 0.06);
    color = mix(color * uLimbTint, color, smoothstep(0.0, 0.75, mu));

    gl_FragColor = vec4(color * uEmissive, 1.0);

    #include <logdepthbuf_fragment>
}
`;

const CORONA_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

varying vec3 vPosW;
varying vec3 vCenterW;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosW = worldPosition.xyz;
    vCenterW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    #include <logdepthbuf_vertex>
}
`;

const CORONA_FRAGMENT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uCoreRadius;
uniform float uShellRadius;
uniform float uFalloff;
uniform float uIntensity;
uniform float uOpacity;
uniform float uStreaks;
uniform float uTime;

varying vec3 vPosW;
varying vec3 vCenterW;

${SIMPLEX_GLSL}
${ANIM_GLSL}

void main() {
    // Impact parameter of the view ray with respect to the star's centre. The
    // shell is drawn BackSide, so every fragment stands for one ray grazing the
    // star at distance b, exactly the quantity corona brightness depends on.
    vec3 rayDir = normalize(vPosW - cameraPosition);
    vec3 toCenter = vCenterW - cameraPosition;
    float along = dot(toCenter, rayDir);
    float b = length(toCenter - rayDir * along);

    // Rays that pass through the photosphere are behind the star: nothing to add.
    if (b <= uCoreRadius) discard;

    float x = saturate((b - uCoreRadius) / max(uShellRadius - uCoreRadius, 1e-4));
    float falloff = pow(1.0 - x, uFalloff);

    // Slow, low-amplitude angular structure so the halo is not a perfect disc.
    // Same frequencies and weights as ever, but the domain now drifts on a
    // bounded loop instead of a ramp, so the streamers still crawl at ~0.02
    // units/s and go on doing so however long the app has been running.
    vec3 dir = normalize(vPosW - vCenterW);
    vec3 flowNear = domainLoop(uTime, 0.90, vec3(5.0, 3.0, 4.0), vec3(0.0, 1.9, 3.7));
    vec3 flowFar = domainLoop(uTime, 0.70, vec3(7.0, 9.0, 6.0), vec3(2.4, 5.1, 0.8));
    float streamers = snoise(dir * 3.2 + flowNear) * 0.5
                    + snoise(dir * 7.4 + flowFar) * 0.25;
    falloff *= 1.0 + streamers * uStreaks;

    float alpha = saturate(falloff) * uOpacity;
    if (alpha < 0.0015) discard;

    vec3 color = mix(uInnerColor, uOuterColor, x);
    gl_FragColor = vec4(color * uIntensity, alpha);

    #include <logdepthbuf_fragment>
}
`;

/* ------------------------------------------------------------------ */
/* Procedural canvas textures                                          */
/* ------------------------------------------------------------------ */

function textureFromCanvas(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}

/** Stand-in photosphere used until the 8k plate arrives (or if it never does). */
function createFallbackSunTexture() {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffab34';
    ctx.fillRect(0, 0, width, height);

    // Deterministic mottling so the fallback still reads as a star surface.
    let seed = 0x9e3779b9;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    for (let i = 0; i < 900; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const r = 4 + rand() * 16;
        const warm = rand() > 0.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, warm ? 'rgba(255,226,150,0.42)' : 'rgba(214,110,20,0.34)');
        grad.addColorStop(1, 'rgba(255,171,52,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = textureFromCanvas(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
}

/**
 * Soft halo used by the always-facing glow sprite. Deliberately near-white with
 * only a faint warm cast and a fast-falling skirt: a real corona is not orange,
 * and anything wider than this floods the inner system with saturated fog and
 * destroys the black level the starfield needs.
 */
function createGlowTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = size * 0.5;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, 'rgba(255,250,238,0.55)');
    grad.addColorStop(0.20, 'rgba(255,240,214,0.40)');
    grad.addColorStop(0.38, 'rgba(255,214,164,0.17)');
    grad.addColorStop(0.56, 'rgba(255,188,128,0.055)');
    grad.addColorStop(0.75, 'rgba(255,172,108,0.016)');
    grad.addColorStop(1.0, 'rgba(255,164,96,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return textureFromCanvas(canvas);
}

/** Lens flare main element: hot core with a wide warm skirt. */
function createFlareCoreTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = size * 0.5;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.05, 'rgba(255,248,230,0.94)');
    grad.addColorStop(0.14, 'rgba(255,214,150,0.46)');
    grad.addColorStop(0.30, 'rgba(255,162,80,0.17)');
    grad.addColorStop(0.55, 'rgba(255,124,42,0.055)');
    grad.addColorStop(1.0, 'rgba(255,104,24,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return textureFromCanvas(canvas);
}

/**
 * Ghost reflection. Strictly a soft radial disc — an aperture polygon reads as a
 * game-engine decal rather than astrophotography, and because three's Lensflare
 * lerps ghosts toward the centre of the frame, a hexagon would end up stamped on
 * the star itself whenever the Sun is near screen centre.
 */
function createFlareGhostTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = size * 0.5;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.11)');
    grad.addColorStop(0.78, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return textureFromCanvas(canvas);
}

/**
 * Faint diffraction spike, baked into a square plate so the flare quad keeps it
 * thin. Kept low-amplitude and narrow so it reads as a spike, not an anamorphic
 * bar dragged across the frame.
 */
function createFlareStreakTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0.0, 'rgba(255,150,60,0)');
    grad.addColorStop(0.18, 'rgba(255,178,96,0.32)');
    grad.addColorStop(0.42, 'rgba(255,234,200,0.88)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(0.58, 'rgba(255,234,200,0.88)');
    grad.addColorStop(0.82, 'rgba(255,178,96,0.32)');
    grad.addColorStop(1.0, 'rgba(255,150,60,0)');
    ctx.fillStyle = grad;

    const cy = size * 0.5;
    const core = size * 0.008;
    const wing = size * 0.022;
    for (let y = 0; y < size; y++) {
        const d = y + 0.5 - cy;
        const alpha = 0.42 * Math.exp(-(d * d) / (2 * core * core))
                    + 0.12 * Math.exp(-(d * d) / (2 * wing * wing));
        if (alpha < 0.004) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, y, size, 1);
    }
    ctx.globalAlpha = 1;

    return textureFromCanvas(canvas);
}

/* ------------------------------------------------------------------ */
/* Corona shells                                                       */
/* ------------------------------------------------------------------ */

function createCoronaShell(radius, options) {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uInnerColor: { value: new THREE.Color(options.innerColor) },
            uOuterColor: { value: new THREE.Color(options.outerColor) },
            uCoreRadius: { value: SUN_RADIUS * 0.995 },
            uShellRadius: { value: radius },
            uFalloff: { value: options.falloff },
            uIntensity: { value: options.intensity },
            uOpacity: { value: options.opacity },
            uStreaks: { value: options.streaks },
            uTime: { value: 0 }
        },
        vertexShader: CORONA_VERTEX,
        fragmentShader: CORONA_FRAGMENT,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: true
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material);
    mesh.name = options.name;
    // Additive, so blend order is irrelevant against other additive shells; a
    // low renderOrder keeps it underneath any alpha-blended scene geometry.
    mesh.renderOrder = options.renderOrder;
    mesh.frustumCulled = false;
    mesh.raycast = () => {};
    return mesh;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Build the Sun and add it (plus the scene's lighting) to `scene`.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.TextureLoader} textureLoader
 * @returns {{ group: THREE.Group, mesh: THREE.Mesh, radius: number,
 *             update: (elapsedSec: number, camera: THREE.Camera) => void }}
 */
export function createSun(scene, textureLoader) {
    const group = new THREE.Group();
    group.name = 'sun';

    /* --- photosphere ------------------------------------------------ */

    const fallbackMap = createFallbackSunTexture();

    const surfaceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: fallbackMap },
            uTime: { value: 0 },
            // Just under the ACES shoulder: hot granules and the flare still
            // clip to white, but the limb and the spots keep their detail.
            uEmissive: { value: 1.7 },
            uHotTint: { value: new THREE.Color(1.22, 1.12, 0.98) },
            uLimbTint: { value: new THREE.Color(1.0, 0.50, 0.22) }
        },
        vertexShader: SURFACE_VERTEX,
        fragmentShader: SURFACE_FRAGMENT,
        // The Sun deliberately does not write depth: the lens flare's occlusion
        // probe writes a non-logarithmic clip-space z, so against this scene's
        // logarithmicDepthBuffer it would read the star's own disc as a total
        // occluder and kill the flare outright.
        //
        // To stop transparent geometry *behind* the star (orbit lines, point
        // stars, the halo sprite) from painting over the photosphere, the disc
        // instead joins the transparent queue with a high renderOrder so it is
        // drawn last. Alpha is a constant 1.0 with normal blending, so the
        // result is byte-identical to an opaque draw; depth testing still lets
        // bodies genuinely in front of the Sun occlude it.
        transparent: true,
        depthWrite: false,
        depthTest: true
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 128, 128), surfaceMaterial);
    mesh.name = 'sunSurface';
    mesh.renderOrder = 100;
    group.add(mesh);

    textureLoader.load(
        SUN_TEXTURE_URL,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.anisotropy = 8;
            surfaceMaterial.uniforms.uMap.value = texture;
        },
        undefined,
        () => {
            console.warn(`[sun] could not load ${SUN_TEXTURE_URL} — using procedural photosphere`);
        }
    );

    /* --- corona ------------------------------------------------------ */

    const shellARadius = SUN_RADIUS * SHELL_A_SCALE;
    const shellBRadius = SUN_RADIUS * SHELL_B_SCALE;

    // An eclipse corona is near-white with only a faint warm cast; the outer
    // layer is wide but very faint rather than a saturated orange skirt.
    const shellA = createCoronaShell(shellARadius, {
        name: 'sunCoronaInner',
        innerColor: 0xffeccd,
        outerColor: 0xffce9a,
        falloff: 2.2,
        intensity: 0.55,
        opacity: 0.42,
        streaks: 0.22,
        renderOrder: -90
    });
    const shellB = createCoronaShell(shellBRadius, {
        name: 'sunCoronaOuter',
        innerColor: 0xffd7ae,
        outerColor: 0xd9a878,
        falloff: 2.4,
        intensity: 0.28,
        opacity: 0.20,
        streaks: 0.45,
        renderOrder: -95
    });
    group.add(shellA, shellB);

    /* --- soft glow sprite -------------------------------------------- */

    const glowMaterial = new THREE.SpriteMaterial({
        map: createGlowTexture(),
        color: new THREE.Color(0xfff0dc),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.name = 'sunGlow';
    glow.scale.setScalar(SUN_RADIUS * GLOW_SPRITE_SCALE);
    glow.renderOrder = -100;
    glow.frustumCulled = false;
    glow.raycast = () => {};
    group.add(glow);

    /* --- lighting ----------------------------------------------------- */

    const sunLight = new THREE.PointLight(0xfff4e6, 2.4, 0, 0);
    sunLight.name = 'sunLight';
    group.add(sunLight);

    const ambient = new THREE.AmbientLight(0x334455, 0.06);
    ambient.name = 'ambient';
    group.add(ambient);

    /* --- lens flare ---------------------------------------------------- */

    // The star's halo comes almost entirely from UnrealBloom picking up the HDR
    // photosphere; these sprites only add the camera-artifact seasoning on top.
    const flareCore = createFlareCoreTexture(512);
    const flareStreak = createFlareStreakTexture(512);
    const flareGhost = createFlareGhostTexture(128);

    const lensflare = new Lensflare();
    lensflare.raycast = () => {};
    // Above the photosphere's renderOrder so the flare still sits on top of the
    // disc now that the disc draws in the transparent queue.
    lensflare.renderOrder = 200;
    lensflare.addElement(new LensflareElement(flareCore, 300, 0.0, new THREE.Color(0xfff4e2)));
    lensflare.addElement(new LensflareElement(flareStreak, 220, 0.0, new THREE.Color(0xffd9a0)));

    // Ghosts live off-axis only; `update()` fades them out as the Sun nears the
    // centre of the frame, where three's Lensflare would stack them on the disc.
    const flareGhosts = [
        new LensflareElement(flareGhost, 40, 0.30, new THREE.Color(0x6fa8e8)),
        new LensflareElement(flareGhost, 64, 0.52, new THREE.Color(0xe8b784)),
        new LensflareElement(flareGhost, 90, 0.72, new THREE.Color(0x8fe6c4)),
        new LensflareElement(flareGhost, 54, 0.92, new THREE.Color(0xe08fb8))
    ];
    const ghostSizes = flareGhosts.map((element) => element.size);
    const ghostColors = flareGhosts.map((element) => element.color.clone());
    for (const element of flareGhosts) lensflare.addElement(element);

    sunLight.add(lensflare);

    scene.add(group);

    /* --- per-frame ----------------------------------------------------- */

    const sunWorldPosition = new THREE.Vector3();
    const sunNdc = new THREE.Vector3();

    /**
     * @param {number} elapsedSec seconds since app start (real time, not sim time)
     * @param {THREE.Camera} camera active camera
     */
    function update(elapsedSec, camera) {
        // The shaders never see raw elapsed time. Folding it here is what keeps
        // the star's appearance a stationary loop rather than something that
        // drifts, and keeps every float the GPU handles small.
        const animSec = animTime(elapsedSec);

        surfaceMaterial.uniforms.uTime.value = animSec;
        shellA.material.uniforms.uTime.value = animSec;
        shellB.material.uniforms.uTime.value = animSec;

        // Corona breathing — two slightly detuned sines so the layers never
        // pulse in lockstep. Both are harmonics of the master period, so they
        // pass through the fold without a jump.
        const breathA = 1.0 + Math.sin(animSec * ANIM_BASE_W * BREATH_A_HARMONIC) * 0.015;
        const breathB = 1.0 + Math.sin(animSec * ANIM_BASE_W * BREATH_B_HARMONIC + 1.7) * 0.015;
        shellA.scale.setScalar(breathA);
        shellB.scale.setScalar(breathB);
        shellA.material.uniforms.uShellRadius.value = shellARadius * breathA;
        shellB.material.uniforms.uShellRadius.value = shellBRadius * breathB;

        if (!camera) return;

        sunWorldPosition.setFromMatrixPosition(group.matrixWorld);

        // Pull the halo back as the camera closes in. The ramp has to be wide:
        // a close framing sits only ~4 radii out, so anything tighter than this
        // leaves the sprite at full strength and floods the frame with a single
        // flat gradient. Full halo only once the star is small on screen.
        const distance = camera.position.distanceTo(sunWorldPosition);
        const t = THREE.MathUtils.smoothstep(distance, SUN_RADIUS * 3.0, SUN_RADIUS * 18.0);
        glowMaterial.opacity = 0.05 + 0.60 * t;

        // Ghost fade — see GHOST_FADE_MIN/MAX. `project()` flips the sign of x/y
        // for points behind the camera, so gate on z as well.
        sunNdc.copy(sunWorldPosition).project(camera);
        const ghostFade = sunNdc.z > 1
            ? 0
            : THREE.MathUtils.smoothstep(Math.hypot(sunNdc.x, sunNdc.y), GHOST_FADE_MIN, GHOST_FADE_MAX);

        for (let i = 0; i < flareGhosts.length; i++) {
            flareGhosts[i].size = ghostSizes[i] * ghostFade;
            flareGhosts[i].color.copy(ghostColors[i]).multiplyScalar(ghostFade);
        }
    }

    return { group, mesh, radius: SUN_RADIUS, update };
}
