/**
 * starfield.js — the deep background.
 *
 * Two layers, both re-centred on the camera every frame so they behave like an
 * infinitely distant sky (no parallax as you cross the solar system):
 *
 *   1. An 8k Milky Way sky sphere (BackSide, no depth write) that supplies the
 *      galactic band, dust lanes and overall colour of the void. The plate is
 *      extremely dark — its median luminance is literally 0/255 and its
 *      brightest pixel only 45/255 — so it is lifted with a gamma curve rather
 *      than a linear gain: that raises the band and the faint nebulosity into
 *      visibility while leaving true black at true black.
 *   2. ~18,000 procedural point stars on a slightly smaller sphere, sized by a
 *      power law (many faint, a handful bright), tinted across a blackbody-ish
 *      spectral sequence, drawn as soft round additive points. The brightest 2%
 *      are pushed above 1.0 so UnrealBloom just catches them.
 *
 * Contract: createStarfield(scene, textureLoader) -> { update(camera) }
 */

import * as THREE from 'three';

const MILKY_WAY_URL = 'textures/high/8k_stars_milky_way.jpg';

const SKY_RADIUS = 60000;
const STAR_RADIUS = 55000;
const STAR_COUNT = 18000;

/**
 * Sky plate tone curve. `SKY_GAMMA` < 1 lifts the shadows (dust lanes, diffuse
 * nebulosity) far more than the highlights; `SKY_BRIGHTNESS` is the linear gain
 * applied afterwards. Together they must leave the sky well below the Sun.
 */
const SKY_GAMMA = 0.78;
const SKY_BRIGHTNESS = 1.6;

/** Faint cool cast, matching the blue-shifted scatter of the galactic plane. */
const SKY_TINT = [1.0, 1.04, 1.22];

/** Fraction of stars promoted to HDR so bloom picks them out. */
const HDR_FRACTION = 0.02;
/** Size/brightness exponent of the power law. */
const MAGNITUDE_EXPONENT = 6;

/**
 * Spectral sequence, roughly O/B → A → F → G → K → M.
 * `p` is the cumulative probability boundary for that class.
 */
const SPECTRAL_CLASSES = [
    { p: 0.10, rgb: [0.72, 0.80, 1.00] },
    { p: 0.28, rgb: [0.85, 0.90, 1.00] },
    { p: 0.52, rgb: [1.00, 0.98, 0.95] },
    { p: 0.76, rgb: [1.00, 0.93, 0.78] },
    { p: 0.92, rgb: [1.00, 0.83, 0.62] },
    { p: 1.01, rgb: [1.00, 0.72, 0.55] }
];

const SKY_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    #include <logdepthbuf_vertex>
}
`;

const SKY_FRAGMENT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

uniform sampler2D uMap;
uniform float uGamma;
uniform vec3 uTint;

varying vec2 vUv;

void main() {
    // The sampler decodes sRGB in hardware, so this is already linear light.
    vec3 plate = texture2D(uMap, vUv).rgb;

    // pow() with an exponent below 1 lifts the near-black midtones without
    // touching pure black, which is exactly the range this plate lives in.
    gl_FragColor = vec4(pow(plate, vec3(uGamma)) * uTint, 1.0);

    #include <logdepthbuf_fragment>
}
`;

const STAR_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

uniform float uPixelRatio;

attribute float aSize;
attribute vec3 aColor;

varying vec3 vColor;

void main() {
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Every star sits on the same camera-locked sphere, so distance attenuation
    // would only ever be a constant — size is authored directly in pixels.
    gl_PointSize = aSize * uPixelRatio;

    #include <logdepthbuf_vertex>
}
`;

const STAR_FRAGMENT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

varying vec3 vColor;

void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float r = length(offset) * 2.0;
    if (r > 1.0) discard;

    float halo = pow(1.0 - r, 2.2);
    float core = pow(max(1.0 - r * 2.6, 0.0), 2.0);
    float alpha = saturate(halo * 0.8 + core * 0.9);
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(vColor, alpha);

    #include <logdepthbuf_fragment>
}
`;

/** Small deterministic PRNG so the sky is identical on every reload. */
function createRandom(seed) {
    let state = seed >>> 0;
    return function random() {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function createSkySphere(textureLoader) {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: null },
            uGamma: { value: SKY_GAMMA },
            uTint: { value: new THREE.Vector3(...SKY_TINT).multiplyScalar(SKY_BRIGHTNESS) }
        },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        // Opaque queue (renderOrder -1000 draws it first of all) but it writes
        // no depth, so every other layer is free to draw over it.
        depthWrite: false,
        depthTest: true,
        fog: false
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 64, 40), material);
    mesh.name = 'milkyWay';
    mesh.renderOrder = -1000;
    mesh.frustumCulled = false;
    mesh.raycast = () => {};
    // Stays hidden until the plate actually arrives, so a failed load leaves the
    // point stars on a clean black sky rather than an untextured shell.
    mesh.visible = false;

    textureLoader.load(
        MILKY_WAY_URL,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 4;
            material.uniforms.uMap.value = texture;
            mesh.visible = true;
        },
        undefined,
        () => {
            console.warn(`[starfield] could not load ${MILKY_WAY_URL} — falling back to point stars only`);
        }
    );

    return mesh;
}

function createPointStars() {
    const random = createRandom(0x5eed51a7);

    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);

    // Magnitude threshold above which a star is promoted to HDR: solving
    // 1 - t^(1/exp) = HDR_FRACTION for t.
    const hdrThreshold = Math.pow(1 - HDR_FRACTION, MAGNITUDE_EXPONENT);

    for (let i = 0; i < STAR_COUNT; i++) {
        // Uniform on the sphere.
        const z = 1 - 2 * random();
        const ring = Math.sqrt(Math.max(0, 1 - z * z));
        const phi = 2 * Math.PI * random();

        const i3 = i * 3;
        positions[i3 + 0] = Math.cos(phi) * ring * STAR_RADIUS;
        positions[i3 + 1] = z * STAR_RADIUS;
        positions[i3 + 2] = Math.sin(phi) * ring * STAR_RADIUS;

        // Power-law magnitude: crowded near zero, a thin tail of bright stars.
        const magnitude = Math.pow(random(), MAGNITUDE_EXPONENT);
        sizes[i] = 1.1 + magnitude * 7.5;

        // Spectral tint.
        const pick = random();
        let rgb = SPECTRAL_CLASSES[SPECTRAL_CLASSES.length - 1].rgb;
        for (let c = 0; c < SPECTRAL_CLASSES.length; c++) {
            if (pick < SPECTRAL_CLASSES[c].p) {
                rgb = SPECTRAL_CLASSES[c].rgb;
                break;
            }
        }

        // Steep brightness law: the bulk of the field sits close to the noise
        // floor and only the tail carries real weight, which is what gives the
        // sky a magnitude hierarchy instead of a wall of identical dots.
        const hdr = magnitude > hdrThreshold ? 1.4 : 1.0;
        const luminance = (0.16 + magnitude * 1.55) * hdr;

        // Per-star exposure jitter only. Hue variation comes from the spectral
        // class alone — jittering channels in opposite directions just bleaches
        // the tint back out.
        const jitter = 0.94 + random() * 0.12;
        const scale = luminance * jitter;

        colors[i3 + 0] = rgb[0] * scale;
        colors[i3 + 1] = rgb[1] * scale;
        colors[i3 + 2] = rgb[2] * scale;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
        },
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'stars';
    points.renderOrder = -900;
    points.frustumCulled = false;
    points.raycast = () => {};
    return points;
}

/**
 * Build the background sky and add it to `scene`.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.TextureLoader} textureLoader
 * @returns {{ update: (camera: THREE.Camera) => void }}
 */
export function createStarfield(scene, textureLoader) {
    const sky = createSkySphere(textureLoader);
    const stars = createPointStars();

    scene.add(sky, stars);

    /**
     * Re-centre both layers on the camera so the sky never shifts with travel.
     * @param {THREE.Camera} camera
     */
    function update(camera) {
        if (!camera) return;
        sky.position.copy(camera.position);
        stars.position.copy(camera.position);
    }

    return { update };
}
