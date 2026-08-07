/**
 * asteroids.js — the main belt, drawn as two views of one population.
 *
 * ~7,000 vertex-displaced icosahedrons spread between 2.1 and 3.3 AU on lightly
 * eccentric, lightly inclined orbits. Per-instance orbital elements live in
 * typed arrays and are propagated analytically from the simulation Julian Date,
 * so the belt responds to time scaling exactly like the planets do. Angular
 * rates follow Kepler's third law, calibrated so that a = 2.77 AU (the belt
 * centre) completes one revolution in 1,682 days.
 *
 * Two representations share those arrays:
 *   1. an `InstancedMesh` of lit rocks — correct up close, but a 0.2-unit body
 *      is a hundredth of a pixel from the system overview, so its triangles
 *      fall through the rasteriser and the belt disappears entirely;
 *   2. a `Points` cloud with a floor on `gl_PointSize`, which keeps the belt
 *      reading as a dusty ring at system scale and fades itself out per point
 *      as the camera closes in and the real rocks take over.
 *
 * The belt should read as texture, not confetti: low albedo, small sizes, a
 * density profile that thins at the Kirkwood resonance gaps.
 */

import * as THREE from 'three';
import { AU } from './config.js';

const COUNT = 7000;
const J2000 = 2451545.0;
const TWO_PI = Math.PI * 2;

const A_MIN = 2.1; // AU
const A_MAX = 3.3; // AU
const A_REF = 2.77; // AU — reference semi-major axis for the period calibration
const PERIOD_REF_DAYS = 1682;

const MAX_ECCENTRICITY = 0.12;
const MAX_INCLINATION = THREE.MathUtils.degToRad(8);

const SIZE_MIN = 0.05;
const SIZE_MAX = 0.35;
const LARGE_SIZE = 0.5;
const LARGE_FRACTION = 0.015;

const NOISE_AMPLITUDE = 0.35;
const BASE_COLOR = 0x8a8378;

// ------------------------------------------------------------- dust layer

// View-space depths (scene units) over which a point hands off to its rock.
const POINT_FADE_NEAR = 110;
const POINT_FADE_FAR = 420;

// Peak alpha of a dust point — the belt must never out-shout the planets.
const POINT_OPACITY = 0.45;

const MAX_PIXEL_RATIO = 2;

const POINT_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

uniform float uViewportHeight;
uniform float uPixelRatio;
uniform float uOpacity;
uniform float uFadeNear;
uniform float uFadeFar;

attribute float aSize;
attribute float aShade;

varying float vAlpha;
varying float vShade;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float viewDepth = max(-mvPosition.z, 1.0);

    // The rock's true projected diameter in CSS pixels, floored so it survives
    // the sample grid and capped so a near miss never becomes a blob.
    float projected = aSize * projectionMatrix[1][1] * uViewportHeight / viewDepth;
    gl_PointSize = uPixelRatio * clamp(projected, 0.9, 3.0);

    // Per point, not per camera: each dust mote dissolves exactly as its own
    // instanced rock grows large enough to carry the read.
    vAlpha = uOpacity * smoothstep(uFadeNear, uFadeFar, viewDepth);
    vShade = aShade;

    #include <logdepthbuf_vertex>
}
`;

const POINT_FRAGMENT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 uColor;

varying float vAlpha;
varying float vShade;

void main() {
    if (vAlpha < 0.004) discard;

    vec2 offset = gl_PointCoord - vec2(0.5);
    float r2 = dot(offset, offset);
    if (r2 > 0.25) discard;

    float alpha = vAlpha * vShade * (1.0 - smoothstep(0.02, 0.25, r2));
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(uColor, alpha);

    #include <logdepthbuf_fragment>
}
`;

// Reused every update — the belt allocates nothing per frame.
const _position = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _matrix = new THREE.Matrix4();

/** Deterministic PRNG so the belt is identical on every load. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash used for the baked surface displacement; stable for equal inputs. */
function hash3(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function gapKernel(a, center, width) {
  const x = (a - center) / width;
  return Math.exp(-x * x);
}

/** Relative population density across the belt, in [0, 1]. */
function beltDensity(a) {
  let density = 0.55 + 0.45 * Math.exp(-Math.pow((a - 2.72) / 0.42, 2));
  density *= 1 - 0.85 * gapKernel(a, 2.502, 0.028); // 3:1 Kirkwood gap
  density *= 1 - 0.6 * gapKernel(a, 2.825, 0.022); // 5:2
  density *= 1 - 0.45 * gapKernel(a, 2.958, 0.018); // 7:3
  density *= 1 - 0.5 * gapKernel(a, 3.279, 0.02); // 2:1 outer edge
  return density;
}

function sampleSemiMajor(random) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const a = A_MIN + random() * (A_MAX - A_MIN);
    if (random() < beltDensity(a)) return a;
  }
  return A_MIN + random() * (A_MAX - A_MIN);
}

/** Unit icosahedron with baked radial noise — one shared geometry, flat shaded. */
function createRockGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    // Quantise before hashing so the duplicated corners of this non-indexed
    // geometry displace identically and the surface stays watertight.
    const qx = Math.round(vertex.x * 1000) / 1000;
    const qy = Math.round(vertex.y * 1000) / 1000;
    const qz = Math.round(vertex.z * 1000) / 1000;
    const coarse = hash3(qx, qy, qz);
    const fine = hash3(qx * 2.7 + 11.3, qy * 2.7 + 5.1, qz * 2.7 + 19.7);
    const noise = coarse * 0.65 + fine * 0.35;
    vertex.multiplyScalar(1 + (noise * 2 - 1) * NOISE_AMPLITUDE);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.deleteAttribute('uv');
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Builds the asteroid belt (rocks plus dust layer) and adds it to the scene.
 *
 * @param {THREE.Scene} scene
 * @returns {{ update: (jd:number) => void, setVisible: (visible:boolean) => void }}
 */
export function createAsteroidBelt(scene) {
  const random = mulberry32(0x5ee1);

  const geometry = createRockGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: BASE_COLOR,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.name = 'asteroid-belt';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Purely decorative: never steal a picking ray from a planet.
  mesh.raycast = () => {};

  // Per-instance orbital elements and rotation state.
  const semiMajor = new Float32Array(COUNT); // scene units
  const eccentricity = new Float32Array(COUNT);
  const cosInc = new Float32Array(COUNT);
  const sinInc = new Float32Array(COUNT);
  const cosNode = new Float32Array(COUNT);
  const sinNode = new Float32Array(COUNT);
  const argPeri = new Float32Array(COUNT);
  const meanAnomaly0 = new Float32Array(COUNT);
  const meanMotion = new Float32Array(COUNT); // radians per day
  const size = new Float32Array(COUNT);
  const spinAxisX = new Float32Array(COUNT);
  const spinAxisY = new Float32Array(COUNT);
  const spinAxisZ = new Float32Array(COUNT);
  const spinPhase = new Float32Array(COUNT);
  const spinRate = new Float32Array(COUNT); // radians per day

  // Shared with the dust layer: world positions are rewritten alongside the
  // instance matrices, sizes and shades are static.
  const pointPositions = new Float32Array(COUNT * 3);
  const pointSizes = new Float32Array(COUNT);
  const pointShades = new Float32Array(COUNT);

  const tint = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    const aAU = sampleSemiMajor(random);
    semiMajor[i] = aAU * AU;
    eccentricity[i] = MAX_ECCENTRICITY * Math.pow(random(), 1.6);

    const inclination = MAX_INCLINATION * Math.pow(random(), 2);
    cosInc[i] = Math.cos(inclination);
    sinInc[i] = Math.sin(inclination);

    const node = random() * TWO_PI;
    cosNode[i] = Math.cos(node);
    sinNode[i] = Math.sin(node);

    argPeri[i] = random() * TWO_PI;
    meanAnomaly0[i] = random() * TWO_PI;

    // Kepler's third law, anchored at the belt centre.
    const periodDays = PERIOD_REF_DAYS * Math.pow(aAU / A_REF, 1.5);
    meanMotion[i] = TWO_PI / periodDays;

    size[i] =
      random() < LARGE_FRACTION
        ? SIZE_MAX + random() * (LARGE_SIZE - SIZE_MAX)
        : SIZE_MIN + Math.pow(random(), 3) * (SIZE_MAX - SIZE_MIN);

    // Random unit spin axis via a uniformly distributed direction.
    const z = random() * 2 - 1;
    const phi = random() * TWO_PI;
    const rxy = Math.sqrt(Math.max(0, 1 - z * z));
    spinAxisX[i] = Math.cos(phi) * rxy;
    spinAxisY[i] = z;
    spinAxisZ[i] = Math.sin(phi) * rxy;
    spinPhase[i] = random() * TWO_PI;
    spinRate[i] = (random() * 2 - 1) * 0.9;

    // Subtle albedo scatter so the belt does not read as one flat grey tone.
    const shade = 0.75 + random() * 0.4;
    mesh.setColorAt(i, tint.setRGB(shade, shade * 0.985, shade * 0.95));

    pointSizes[i] = size[i];
    pointShades[i] = Math.min(1, shade);
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  // ------------------------------------------------------------ dust layer

  const pointGeometry = new THREE.BufferGeometry();
  const pointPositionAttribute = new THREE.BufferAttribute(pointPositions, 3);
  pointPositionAttribute.setUsage(THREE.DynamicDrawUsage);
  pointGeometry.setAttribute('position', pointPositionAttribute);
  pointGeometry.setAttribute('aSize', new THREE.BufferAttribute(pointSizes, 1));
  pointGeometry.setAttribute('aShade', new THREE.BufferAttribute(pointShades, 1));
  // The population never leaves this annulus, so pin the bounding volume rather
  // than recomputing it from 7,000 moving points every frame.
  pointGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), A_MAX * AU * 1.2);

  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(BASE_COLOR) },
      uOpacity: { value: POINT_OPACITY },
      uViewportHeight: { value: 900 },
      uPixelRatio: { value: 1 },
      uFadeNear: { value: POINT_FADE_NEAR },
      uFadeFar: { value: POINT_FADE_FAR },
    },
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    transparent: true,
    // Additive keeps the dust adding light: over the void it reads identically
    // to alpha blending, and in front of the corona it never smears grey.
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });

  const points = new THREE.Points(pointGeometry, pointMaterial);
  points.name = 'asteroid-belt-dust';
  points.raycast = () => {};

  function readViewport() {
    if (typeof window === 'undefined') return;
    pointMaterial.uniforms.uViewportHeight.value =
      window.innerHeight || pointMaterial.uniforms.uViewportHeight.value;
    pointMaterial.uniforms.uPixelRatio.value = Math.min(
      window.devicePixelRatio || 1,
      MAX_PIXEL_RATIO,
    );
  }

  readViewport();
  if (typeof window !== 'undefined') window.addEventListener('resize', readViewport);

  let visible = true;
  let frame = 0;

  function writeInstances(days) {
    for (let i = 0; i < COUNT; i++) {
      const e = eccentricity[i];
      const meanAnomaly = meanAnomaly0[i] + meanMotion[i] * days;
      const sinM = Math.sin(meanAnomaly);
      const cosM = Math.cos(meanAnomaly);

      // Equation of the centre — accurate to well under a pixel at e <= 0.12.
      const trueAnomaly = meanAnomaly + e * (2 * sinM) + e * e * 2.5 * sinM * cosM;
      const r = (semiMajor[i] * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));

      const u = trueAnomaly + argPeri[i];
      const cu = Math.cos(u);
      const su = Math.sin(u);
      const ci = cosInc[i];

      // Ecliptic frame mapped to the scene: +Y is ecliptic north, motion is
      // counter-clockwise when seen from +Y.
      const x = r * (cosNode[i] * cu - sinNode[i] * su * ci);
      const yEcl = r * (sinNode[i] * cu + cosNode[i] * su * ci);
      const zUp = r * (su * sinInc[i]);
      _position.set(x, zUp, -yEcl);

      const i3 = i * 3;
      pointPositions[i3 + 0] = _position.x;
      pointPositions[i3 + 1] = _position.y;
      pointPositions[i3 + 2] = _position.z;

      _axis.set(spinAxisX[i], spinAxisY[i], spinAxisZ[i]);
      _quaternion.setFromAxisAngle(_axis, spinPhase[i] + spinRate[i] * days);
      _scale.setScalar(size[i]);

      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    pointPositionAttribute.needsUpdate = true;
  }

  writeInstances(0);
  mesh.computeBoundingSphere();
  scene.add(mesh, points);

  /**
   * Propagates the belt to a Julian Date. Instance matrices and dust positions
   * are rewritten on every second call — at belt distances the difference is
   * imperceptible and it halves the cost of the largest per-frame CPU job in
   * the scene.
   */
  function update(jd) {
    if (!visible) return;
    frame++;
    if ((frame & 1) === 0) return;
    writeInstances(jd - J2000);
  }

  function setVisible(nextVisible) {
    visible = nextVisible !== false;
    mesh.visible = visible;
    points.visible = visible;
  }

  return { update, setVisible };
}
