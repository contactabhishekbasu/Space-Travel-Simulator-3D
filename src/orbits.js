/**
 * orbits.js — Keplerian propagation and orbit-path geometry.
 *
 * Positions come from classical two-body elements referred to the J2000 ecliptic,
 * propagated by mean motion and solved with Newton–Raphson on Kepler's equation.
 * That is accurate to a few arc-minutes across 1800–2050 for the major planets,
 * which is far beyond what the eye can resolve at these scales, and it costs a
 * handful of trig calls per body per frame.
 *
 * Frame mapping — the ecliptic frame is right-handed with +Z toward ecliptic
 * north; the scene is right-handed with +Y up. The bridge is:
 *
 *     scene.x =  x_ecl        scene.y =  z_ecl        scene.z = -y_ecl
 *
 * which puts the ecliptic on the scene XZ plane and preserves handedness, so
 * orbital angular momentum lands on +Y and planets run counter-clockwise when
 * seen from above.
 */

import * as THREE from 'three';
import { AU } from './config.js';

/** Julian Date of the J2000.0 epoch, 2000-01-01T12:00:00 TT. */
export const J2000 = 2451545.0;

const DEG2RAD = Math.PI / 180;
const TAU = Math.PI * 2;

/** Newton iterations for Kepler's equation — converges well past float precision. */
const KEPLER_ITERATIONS = 8;

/** Samples used to draw a full orbit loop. */
const ORBIT_SEGMENTS = 512;

/**
 * Base opacity of an orbit line at system scale. Deliberately faint: the lines
 * are chrome, and they are drawn with ordinary alpha blending through the same
 * ACES tone map as everything else, so they sit *behind* the starfield in
 * perceived brightness instead of glowing over it.
 *
 * Callers may drive `material.opacity` afterwards (main.js dims the focused
 * body's own loop); this is simply the authored value they start from.
 */
const ORBIT_OPACITY = 0.13;

/**
 * Orbit lines are guides, not subjects. Whatever hue the caller passes is
 * pulled down to a muted, slightly lighter version of itself — the per-planet
 * hue survives, the neon does not. Clamping (rather than scaling) keeps this
 * idempotent: an already-muted palette passes through untouched.
 */
const ORBIT_MAX_SATURATION = 0.26;
const ORBIT_MIN_LIGHTNESS = 0.66;

/**
 * Proximity fade. The metric is the angular size of the orbit's own radius as
 * seen from a given fragment's distance:
 *
 *     ratio = orbitRadius / distanceFromCamera
 *
 * From far away (small ratio) the loop reads as an ellipse and is drawn at full
 * strength. Up close (large ratio) that same line would streak clean across the
 * frame, so it fades out. The metric is scale-free, so one pair of constants
 * covers Mercury's 155-unit loop and Neptune's 12,000-unit one: parked at a
 * body's framing distance (~4.2 radii) every orbit lands far past MAX and
 * vanishes, while from a system view every orbit sits below MIN. Because the
 * distance is evaluated per fragment, the near arc of a loop fades while its
 * far side stays drawn, rather than the whole line switching at once.
 */
const ORBIT_FADE_MIN_RATIO = 0.65;
const ORBIT_FADE_MAX_RATIO = 16.0;

/** Injection points in Three.js' built-in line (basic) shader. */
const FADE_VERTEX_ANCHOR = '#include <project_vertex>';
const FADE_FRAGMENT_ANCHOR = '#include <color_fragment>';

const FADE_VERTEX_PARS = `
uniform float uOrbitRadius;
uniform float uFadeMinRatio;
uniform float uFadeMaxRatio;
varying float vOrbitFade;
`;

const FADE_VERTEX_BODY = `
  float orbitViewDistance = max( length( mvPosition.xyz ), 1e-4 );
  vOrbitFade = 1.0 - smoothstep(
    uFadeMinRatio,
    uFadeMaxRatio,
    uOrbitRadius / orbitViewDistance
  );
`;

const FADE_FRAGMENT_PARS = `
varying float vOrbitFade;
`;

const FADE_FRAGMENT_BODY = `
  diffuseColor.a *= vOrbitFade;
`;

let fadeAnchorWarned = false;

/** Scratch used only at build time. */
const _hsl = { h: 0, s: 0, l: 0 };

/** Pulls a caller-supplied hue into the muted range orbit lines are drawn in. */
function mutedLineColor(colorHex) {
  const color = new THREE.Color(colorHex);
  color.getHSL(_hsl);
  return color.setHSL(
    _hsl.h,
    Math.min(_hsl.s, ORBIT_MAX_SATURATION),
    Math.max(_hsl.l, ORBIT_MIN_LIGHTNESS)
  );
}

/**
 * Adds the per-fragment proximity fade to a line material, leaving every other
 * property (colour, opacity, blending, tone mapping) on Three.js' own code path
 * so external code can still drive `material.opacity` normally.
 *
 * @param {THREE.LineBasicMaterial} material
 * @param {number} orbitRadius semi-major axis in scene units; 0 disables the fade
 */
function applyProximityFade(material, orbitRadius) {
  // Fresh uniform objects per material: the renderer clones built-in uniforms
  // per material, and sharing these would tie every orbit to one radius.
  const fadeUniforms = {
    uOrbitRadius: { value: orbitRadius },
    uFadeMinRatio: { value: ORBIT_FADE_MIN_RATIO },
    uFadeMaxRatio: { value: ORBIT_FADE_MAX_RATIO }
  };
  material.userData.fadeUniforms = fadeUniforms;

  material.onBeforeCompile = (shader) => {
    if (
      !shader.vertexShader.includes(FADE_VERTEX_ANCHOR) ||
      !shader.fragmentShader.includes(FADE_FRAGMENT_ANCHOR)
    ) {
      // A Three.js version that reshuffles the line shader should cost us the
      // fade, not the app: warn once and draw the line unfaded.
      if (!fadeAnchorWarned) {
        fadeAnchorWarned = true;
        console.warn('[orbits] Line shader anchors not found — proximity fade disabled.');
      }
      return;
    }

    Object.assign(shader.uniforms, fadeUniforms);

    shader.vertexShader =
      FADE_VERTEX_PARS +
      shader.vertexShader.replace(
        FADE_VERTEX_ANCHOR,
        `${FADE_VERTEX_ANCHOR}\n${FADE_VERTEX_BODY}`
      );

    shader.fragmentShader =
      FADE_FRAGMENT_PARS +
      shader.fragmentShader.replace(
        FADE_FRAGMENT_ANCHOR,
        `${FADE_FRAGMENT_ANCHOR}\n${FADE_FRAGMENT_BODY}`
      );
  };

  // Keeps the patched program out of the cache slot a plain LineBasicMaterial
  // would claim. Uniform values stay per-material either way.
  material.customProgramCacheKey = () => 'solara-orbit-fade';
}

/** Wrap an angle in radians into [-π, π] for fast, stable Kepler convergence. */
function wrapAngle(angle) {
  let a = angle % TAU;
  if (a > Math.PI) a -= TAU;
  else if (a < -Math.PI) a += TAU;
  return a;
}

/**
 * Solve Kepler's equation M = E − e·sin E for the eccentric anomaly.
 * @param {number} M mean anomaly, radians, ideally wrapped to [-π, π]
 * @param {number} e eccentricity
 * @returns {number} eccentric anomaly in radians
 */
function solveEccentricAnomaly(M, e) {
  // Sensible first guess: exact for e = 0, within a few percent for e < 0.3.
  let E = M + e * Math.sin(M);
  for (let n = 0; n < KEPLER_ITERATIONS; n++) {
    const denom = 1 - e * Math.cos(E);
    // Guard the near-parabolic degenerate case; never hit for e < 0.21.
    if (Math.abs(denom) < 1e-12) break;
    E -= (E - e * Math.sin(E) - M) / denom;
  }
  return E;
}

/**
 * Heliocentric position of a body at a given Julian Date, in scene units.
 *
 * @param {{a:number,e:number,i:number,Omega:number,wBar:number,L0:number,periodDays:number}} elements
 *        J2000 Keplerian elements (a in AU; i, Omega, wBar, L0 in degrees).
 * @param {number} jd Julian Date.
 * @param {THREE.Vector3} [target] Optional vector to write into (avoids allocation).
 * @returns {THREE.Vector3} the target vector, in scene units.
 */
export function keplerPosition(elements, jd, target = new THREE.Vector3()) {
  const { a, e, i, Omega, wBar, L0, periodDays } = elements;

  // Mean anomaly: mean longitude at epoch minus perihelion longitude, advanced
  // by mean motion since J2000.
  const M = wrapAngle(
    (L0 - wBar) * DEG2RAD + (TAU * (jd - J2000)) / periodDays
  );

  const E = solveEccentricAnomaly(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);

  // Radius and true anomaly.
  const r = a * (1 - e * cosE);
  const nu = Math.atan2(Math.sqrt(1 - e * e) * sinE, cosE - e);

  // Perifocal coordinates in the orbital plane.
  const xp = r * Math.cos(nu);
  const yp = r * Math.sin(nu);

  // Argument of perihelion, measured from the ascending node.
  const w = (wBar - Omega) * DEG2RAD;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const om = Omega * DEG2RAD;
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);
  const inc = i * DEG2RAD;
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  // Perifocal -> J2000 ecliptic (rotate by w, then i, then Omega).
  const xEcl =
    xp * (cosOm * cosW - sinOm * sinW * cosI) -
    yp * (cosOm * sinW + sinOm * cosW * cosI);
  const yEcl =
    xp * (sinOm * cosW + cosOm * sinW * cosI) -
    yp * (sinOm * sinW - cosOm * cosW * cosI);
  const zEcl = xp * (sinW * sinI) + yp * (cosW * sinI);

  // Ecliptic -> scene (ecliptic north becomes +Y).
  return target.set(xEcl * AU, zEcl * AU, -yEcl * AU);
}

/**
 * Build a closed line for one full orbit, sampled from the same elements the
 * body itself follows so the path and the planet can never disagree.
 *
 * The line is tone-mapped and alpha-blended like every other surface in the
 * scene, drawn at a low base opacity, and fades out per fragment as the camera
 * closes on it (see ORBIT_FADE_MIN_RATIO) so it never slices across a close-up.
 *
 * @param {object} elements J2000 Keplerian elements (see keplerPosition).
 * @param {number} colorHex Line colour, e.g. 0x5aa0ff.
 * @returns {THREE.LineLoop}
 */
export function createOrbitLine(elements, colorHex) {
  const positions = new Float32Array(ORBIT_SEGMENTS * 3);
  const sample = new THREE.Vector3();

  for (let s = 0; s < ORBIT_SEGMENTS; s++) {
    const jd = J2000 + (s / ORBIT_SEGMENTS) * elements.periodDays;
    keplerPosition(elements, jd, sample);
    positions[s * 3] = sample.x;
    positions[s * 3 + 1] = sample.y;
    positions[s * 3 + 2] = sample.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  // Normal blending (the default) and tone mapping left on: an additive,
  // untone-mapped line sits at raw sRGB while the rest of the frame is graded,
  // which is what made these read as neon.
  const material = new THREE.LineBasicMaterial({
    color: mutedLineColor(colorHex),
    transparent: true,
    opacity: ORBIT_OPACITY,
    depthWrite: false
  });

  // Semi-major axis in scene units — the yardstick the proximity fade uses.
  const orbitRadius = Number.isFinite(elements.a) ? Math.abs(elements.a) * AU : 0;
  applyProximityFade(material, orbitRadius);

  const line = new THREE.LineLoop(geometry, material);
  line.renderOrder = -1;
  return line;
}
