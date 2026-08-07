/**
 * planets.js — solar system world builder.
 *
 * Builds every planet (and its moons) from the declarative tables in config.js:
 *   outer group   → positioned every frame from Keplerian elements (orbits.js)
 *   tilt group    → static axial tilt, keeps the spin axis inertial in world space
 *   surface mesh  → sidereal rotation about its local +Y
 *
 * Earth gets the custom day/night shader plus a separate cloud shell; Saturn gets
 * its shaded ring plane; every body with an atmosphere entry gets an additive
 * fresnel shell. All shader materials that need lighting direction receive a
 * world-space `sunDirection` uniform each frame (the sun sits at the origin, so
 * that is simply normalize(-worldPosition)).
 *
 * Every body also carries a screen-space *presence marker*: true relative radii
 * mean Earth is a 1.6 px disc from the system overview and Mercury barely half a
 * pixel, so the spheres fall through the rasteriser and the frame reads as an
 * empty sun. Each body therefore gets a small additive sprite with size
 * attenuation off — invisible once the real sphere covers more than a few
 * pixels, and a crisp tinted dot at system scale.
 */

import * as THREE from 'three';
import { AU, AU_KM, PLANET_SCALE, PLANETS, MOONS } from './config.js';
import { keplerPosition, createOrbitLine } from './orbits.js';
import {
  createEarthMaterial,
  createCloudSphere,
  createAtmosphere,
  createSaturnRings,
} from './materials.js';

const J2000 = 2451545.0;
const TWO_PI = Math.PI * 2;

// Clamped down to the hardware maximum by the renderer at upload time.
const MAX_ANISOTROPY = 16;

// Earth's cloud deck gains roughly one extra revolution per month.
const CLOUD_SUPERROTATION_DAYS = 30;

// Moons without a tidal lock get a plausible fast spin relative to their orbit.
const FREE_MOON_SPIN_FACTOR = 2.7;

// Used only when a texture fails to load, so the app never shows a black sphere.
const FALLBACK_COLORS = {
  mercury: 0x8c8479,
  venus: 0xd8b98c,
  earth: 0x3f6fa8,
  mars: 0xb1573a,
  jupiter: 0xc7a582,
  saturn: 0xd6c39c,
  uranus: 0x8fc9d8,
  neptune: 0x4a68c8,
  moon: 0x9a958e,
};
const DEFAULT_FALLBACK_COLOR = 0x9b9690;

// ---------------------------------------------------------------- markers

// Resolution of the shared radial-gradient sprite texture.
const MARKER_TEXTURE_SIZE = 64;

// On-screen diameter of the marker quad, in CSS pixels. The gradient's bright
// core covers roughly the middle third, so this reads as a ~5 px dot.
const MARKER_PIXEL_DIAMETER = 14;

// Marker strength as a function of the body's projected radius in pixels:
// full below MARKER_FULL_PX, gone at MARKER_CUTOFF_PX where the sphere itself
// is comfortably resolved.
const MARKER_FULL_PX = 2.0;
const MARKER_CUTOFF_PX = 6.0;

const MARKER_PLANET_OPACITY = 0.9;
const MARKER_MOON_OPACITY = 0.5;

// Moon markers fade with camera-to-parent distance so a system view does not
// sprout a halo of specks around Jupiter.
const MOON_MARKER_FADE_START = 220;
const MOON_MARKER_FADE_END = 300;

// Markers are tinted toward white by this much so they stay legible.
const MARKER_WHITE_MIX = 0.45;

// Reused every frame — the update loop allocates nothing.
const _sunDir = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();
const _markerPos = new THREE.Vector3();

// Build-time scratch objects.
const _color = new THREE.Color();
const _white = new THREE.Color(0xffffff);

/**
 * Shared additive dot: an opaque core falling off to nothing at the rim.
 * Created once per page, lazily, so a headless import costs nothing.
 * @type {THREE.CanvasTexture|null}
 */
let markerTexture;

function getMarkerTexture() {
  if (markerTexture !== undefined) return markerTexture;
  markerTexture = null;

  if (typeof document === 'undefined') return markerTexture;
  const canvas = document.createElement('canvas');
  canvas.width = MARKER_TEXTURE_SIZE;
  canvas.height = MARKER_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return markerTexture;

  const half = MARKER_TEXTURE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.34, 'rgba(255,255,255,0.34)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.08)');
  gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, MARKER_TEXTURE_SIZE, MARKER_TEXTURE_SIZE);

  markerTexture = new THREE.CanvasTexture(canvas);
  markerTexture.colorSpace = THREE.SRGBColorSpace;
  markerTexture.minFilter = THREE.LinearFilter;
  markerTexture.magFilter = THREE.LinearFilter;
  markerTexture.generateMipmaps = false;
  return markerTexture;
}

/**
 * Builds a body's presence marker. Additive and depth-tested: it glows against
 * the void but is still occluded by anything genuinely in front of it.
 *
 * @param {string} key
 * @param {number} colorHex body albedo colour, brightened toward white
 * @returns {THREE.Sprite|null}
 */
function createBodyMarker(key, colorHex) {
  const map = getMarkerTexture();
  if (!map) return null;

  const material = new THREE.SpriteMaterial({
    map,
    color: _color.setHex(colorHex).lerp(_white, MARKER_WHITE_MIX).getHex(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.name = `${key}-marker`;
  sprite.renderOrder = 5;
  sprite.visible = false;
  sprite.raycast = () => {};
  return sprite;
}

function kmToSceneUnits(km) {
  return (km / AU_KM) * AU * PLANET_SCALE;
}

/** Sphere tessellation scaled to how much screen space a body can occupy. */
function sphereSegments(key, radius) {
  if (key === 'earth') return [160, 80];
  if (radius >= 3) return [128, 64];
  if (radius >= 0.5) return [96, 48];
  if (radius >= 0.15) return [64, 32];
  return [40, 20];
}

/** Subtle spectral ramp: warm amber at Mercury → cool azure at Neptune. */
function orbitColor(index, count) {
  const t = count > 1 ? index / (count - 1) : 0;
  const hue = THREE.MathUtils.lerp(0.085, 0.6, t);
  const sat = THREE.MathUtils.lerp(0.45, 0.62, t);
  const light = THREE.MathUtils.lerp(0.62, 0.56, t);
  return _color.setHSL(hue, sat, light).getHex();
}

/**
 * Sizes and fades one presence marker for this frame.
 *
 * @param {THREE.Sprite|null} marker
 * @param {number} radius body radius in scene units
 * @param {number} distance camera-to-body distance in scene units
 * @param {number} pxPerUnit pixels a one-unit object spans at one unit distance
 * @param {number} markerScale sprite scale that yields MARKER_PIXEL_DIAMETER
 * @param {number} baseOpacity
 * @param {number} extraFade additional multiplier in [0, 1]
 */
function updateMarker(marker, radius, distance, pxPerUnit, markerScale, baseOpacity, extraFade) {
  if (!marker) return;

  if (!(distance > 1e-6) || markerScale <= 0 || extraFade <= 0) {
    marker.visible = false;
    return;
  }

  const pixelRadius = (radius * pxPerUnit) / distance;
  const presence = 1 - THREE.MathUtils.smoothstep(pixelRadius, MARKER_FULL_PX, MARKER_CUTOFF_PX);
  const opacity = baseOpacity * presence * extraFade;

  if (opacity <= 0.01) {
    marker.visible = false;
    return;
  }

  marker.visible = true;
  marker.material.opacity = opacity;
  marker.scale.set(markerScale, markerScale, 1);
}

/** Writes a world-space light direction into a material that asks for one. */
function setSunDirection(material, dir) {
  if (!material) return;
  const uniforms = material.uniforms;
  if (!uniforms || !uniforms.sunDirection) return;
  const value = uniforms.sunDirection.value;
  if (value && value.isVector3) value.copy(dir);
}

/** Sets a numeric uniform if the material declares it. */
function setNumberUniform(material, name, value) {
  if (!material) return;
  const uniforms = material.uniforms;
  if (uniforms && uniforms[name]) uniforms[name].value = value;
}

/**
 * Ring radii may be authored either in kilometres or as multiples of the planet
 * radius; anything above 1000 is unambiguously kilometres.
 */
function resolveRingRadius(value, planetRadius, defaultMultiplier) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value > 1000 ? kmToSceneUnits(value) : value * planetRadius;
  }
  return planetRadius * defaultMultiplier;
}

function formatDays(days) {
  if (!Number.isFinite(days)) return '—';
  return days >= 10 ? days.toFixed(1) : days.toFixed(2);
}

function formatKm(km) {
  return Math.round(km).toLocaleString('en-US');
}

function moonInfo(moon, parentName) {
  if (moon.info) return moon.info;
  return {
    type: `Natural satellite of ${parentName}`,
    diameter: `${formatKm(moon.radiusKm * 2)} km`,
    mass: '—',
    dayLength: moon.tidallyLocked
      ? `${formatDays(moon.periodDays)} days (tidally locked)`
      : '—',
    yearLength: `${formatDays(moon.periodDays)} days around ${parentName}`,
    temperature: '—',
    blurb:
      `${moon.name} orbits ${parentName} at a mean distance of ` +
      `${formatKm(moon.distanceKm)} km, completing one revolution every ` +
      `${formatDays(moon.periodDays)} days.`,
  };
}

/**
 * Builds the whole planetary system and returns the body registry plus the
 * per-frame update entry point.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.TextureLoader} textureLoader
 * @returns {{ bodies: Map<string, object>, update: (jd:number, elapsedSec:number, camera:THREE.Camera) => void }}
 */
export function createSolarSystem(scene, textureLoader) {
  const bodies = new Map();
  const planetRuntime = [];
  const moonRuntime = [];
  const warnedTextures = new Set();

  function loadTexture(url, { srgb = true, wrapS = THREE.RepeatWrapping, onError = null } = {}) {
    const texture = textureLoader.load(url, undefined, undefined, () => {
      if (!warnedTextures.has(url)) {
        warnedTextures.add(url);
        console.warn(`[planets] Texture failed to load: ${url} — using fallback.`);
      }
      if (onError) onError();
    });
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = MAX_ANISOTROPY;
    // Equirectangular maps must wrap so filtering across the u seam is correct.
    texture.wrapS = wrapS;
    return texture;
  }

  function applyFallbackMaterial(mesh, color) {
    const previous = mesh.material;
    mesh.material = new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      metalness: 0,
    });
    if (previous && typeof previous.dispose === 'function') previous.dispose();
  }

  // ---------------------------------------------------------------- planets

  for (let i = 0; i < PLANETS.length; i++) {
    const planet = PLANETS[i];
    const key = planet.key;
    const tex = planet.tex || {};
    const radius = kmToSceneUnits(planet.radiusKm);
    const fallbackColor = FALLBACK_COLORS[key] ?? DEFAULT_FALLBACK_COLOR;
    const sunLitMaterials = [];

    // Outer group carries orbital position only — never rotated, so the axial
    // tilt below stays fixed in world space (seasons behave correctly).
    const group = new THREE.Group();
    group.name = key;
    group.userData.bodyKey = key;
    scene.add(group);

    const tiltGroup = new THREE.Group();
    tiltGroup.name = `${key}-tilt`;
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(planet.axialTiltDeg || 0);
    group.add(tiltGroup);

    const [widthSeg, heightSeg] = sphereSegments(key, radius);
    const geometry = new THREE.SphereGeometry(radius, widthSeg, heightSeg);
    const mesh = new THREE.Mesh(geometry, null);
    mesh.name = `${key}-surface`;
    mesh.userData.bodyKey = key;

    if (key === 'earth' && tex.map) {
      // Colour maps are sRGB; the normal and specular maps carry data, not
      // colour, and stay linear.
      const earthTextures = {
        day: loadTexture(tex.map, {
          srgb: true,
          onError: () => applyFallbackMaterial(mesh, fallbackColor),
        }),
      };
      if (tex.night) earthTextures.night = loadTexture(tex.night, { srgb: true });
      if (tex.normal) earthTextures.normal = loadTexture(tex.normal, { srgb: false });
      if (tex.specular) earthTextures.specular = loadTexture(tex.specular, { srgb: false });
      mesh.material = createEarthMaterial(earthTextures);
      sunLitMaterials.push(mesh.material);
    } else {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1,
        metalness: 0,
      });
      if (tex.map) {
        material.map = loadTexture(tex.map, {
          srgb: true,
          onError: () => applyFallbackMaterial(mesh, fallbackColor),
        });
      } else {
        material.color.setHex(fallbackColor);
      }
      mesh.material = material;
    }
    tiltGroup.add(mesh);

    // Cloud deck (Earth) — separate shell that drifts faster than the surface.
    let clouds = null;
    if (tex.clouds) {
      const cloudTexture = loadTexture(tex.clouds, {
        srgb: true,
        onError: () => {
          if (clouds) clouds.visible = false;
        },
      });
      clouds = createCloudSphere(radius, cloudTexture);
      if (clouds) {
        clouds.name = `${key}-clouds`;
        clouds.userData.bodyKey = key;
        tiltGroup.add(clouds);
        sunLitMaterials.push(clouds.material);
      }
    }

    // Saturn's rings live on the tilt group so they share the planet's obliquity.
    if (tex.ring) {
      let rings = null;
      const ringTexture = loadTexture(tex.ring, {
        srgb: true,
        // The ring strip is sampled radially across its full width — wrapping
        // would fold the C ring back over the outer edge of the A ring.
        wrapS: THREE.ClampToEdgeWrapping,
        onError: () => {
          if (rings) rings.visible = false;
        },
      });
      const innerR = resolveRingRadius(tex.ringInner, radius, 1.24);
      const outerR = resolveRingRadius(tex.ringOuter, radius, 2.27);
      rings = createSaturnRings(innerR, outerR, ringTexture);
      if (rings) {
        rings.name = `${key}-rings`;
        rings.userData.bodyKey = key;
        // The ring disc is authored in the XY plane; lay it into the ecliptic.
        rings.rotation.x = -Math.PI / 2;
        setNumberUniform(rings.material, 'planetRadius', radius);
        tiltGroup.add(rings);
        sunLitMaterials.push(rings.material);
      }
    }

    // Atmosphere shell rides the outer group: no tilt, no spin, purely radial.
    if (planet.atmosphere) {
      const atmosphere = createAtmosphere(radius, planet.atmosphere);
      if (atmosphere) {
        atmosphere.name = `${key}-atmosphere`;
        atmosphere.userData.bodyKey = key;
        // Large additive shells must not steal picking rays from the surface.
        atmosphere.raycast = () => {};
        group.add(atmosphere);
        sunLitMaterials.push(atmosphere.material);
      }
    }

    // Screen-space presence marker — see the module header.
    const marker = createBodyMarker(key, fallbackColor);
    if (marker) group.add(marker);

    let orbitLine = null;
    if (planet.elements) {
      orbitLine = createOrbitLine(planet.elements, orbitColor(i, PLANETS.length));
      if (orbitLine) {
        orbitLine.name = `${key}-orbit`;
        orbitLine.userData.bodyKey = key;
        orbitLine.raycast = () => {};
        scene.add(orbitLine);
      }
    }

    // config.js carries the retrograde sense in the sign of rotationHours
    // (Venus and Uranus are negative), so it passes straight through.
    const rotationHours =
      Number.isFinite(planet.rotationHours) && planet.rotationHours !== 0
        ? planet.rotationHours
        : 24;
    const rotationDays = rotationHours / 24;

    bodies.set(key, {
      key,
      name: planet.name,
      group,
      mesh,
      radius,
      isMoon: false,
      isStar: false,
      parentKey: null,
      orbitLine,
      info: planet.info,
      elements: planet.elements,
    });

    planetRuntime.push({
      key,
      group,
      mesh,
      clouds,
      marker,
      radius,
      elements: planet.elements,
      rotationDays,
      sunLitMaterials,
      // Filled in each frame; moons read their parent's value for their fade.
      cameraDistance: 0,
    });
  }

  // ------------------------------------------------------------------ moons

  const planetByKey = new Map(PLANETS.map((p) => [p.key, p]));
  const runtimeByKey = new Map(planetRuntime.map((entry) => [entry.key, entry]));

  for (const moon of MOONS) {
    const parentBody = bodies.get(moon.parent);
    const parentConfig = planetByKey.get(moon.parent);
    if (!parentBody || !parentConfig) {
      console.warn(`[planets] Moon "${moon.key}" references unknown parent "${moon.parent}".`);
      continue;
    }

    const radius = kmToSceneUnits(moon.radiusKm);
    const ratio = Math.max(2, moon.distanceKm / parentConfig.radiusKm);
    const distance = parentBody.radius * (1.5 + 3.5 * Math.log10(ratio));

    // Child of the parent's *outer* group: inherits orbital position but not
    // the parent's axial tilt or spin.
    const group = new THREE.Group();
    group.name = moon.key;
    group.userData.bodyKey = moon.key;
    parentBody.group.add(group);

    const [widthSeg, heightSeg] = sphereSegments(moon.key, radius);
    const geometry = new THREE.SphereGeometry(radius, widthSeg, heightSeg);
    const material = new THREE.MeshStandardMaterial({
      color: moon.tex ? 0xffffff : (moon.color ?? DEFAULT_FALLBACK_COLOR),
      roughness: 1,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${moon.key}-surface`;
    mesh.userData.bodyKey = moon.key;

    const fallbackColor = FALLBACK_COLORS[moon.key] ?? moon.color ?? DEFAULT_FALLBACK_COLOR;
    if (moon.tex) {
      material.map = loadTexture(moon.tex, {
        srgb: true,
        onError: () => applyFallbackMaterial(mesh, fallbackColor),
      });
    }
    group.add(mesh);

    const marker = createBodyMarker(moon.key, fallbackColor);
    if (marker) group.add(marker);

    bodies.set(moon.key, {
      key: moon.key,
      name: moon.name,
      group,
      mesh,
      radius,
      isMoon: true,
      isStar: false,
      parentKey: moon.parent,
      orbitLine: null,
      info: moonInfo(moon, parentBody.name),
    });

    const periodDays = Math.abs(moon.periodDays) || 1;
    moonRuntime.push({
      group,
      mesh,
      marker,
      radius,
      parentRuntime: runtimeByKey.get(moon.parent) || null,
      distance,
      periodDays,
      tidallyLocked: moon.tidallyLocked !== false,
      spinDays: periodDays / FREE_MOON_SPIN_FACTOR,
    });
  }

  // ----------------------------------------------------------------- update

  // Marker sizing is expressed in CSS pixels, so the viewport height has to be
  // tracked. Cached rather than read per frame to avoid a forced layout.
  let viewportHeight = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      viewportHeight = window.innerHeight || viewportHeight;
    });
  }

  /**
   * Advances the whole system to a Julian Date.
   * `elapsedSec` is part of the module contract; all motion here derives from
   * `jd` so that time scaling stays consistent across systems. `camera` drives
   * the screen-space presence markers.
   */
  function update(jd, elapsedSec, camera) {
    const days = jd - J2000;

    // Pixels spanned by a one-unit object one unit from the camera:
    // projectionMatrix[1][1] is 1/tan(fov/2), so radius × this ÷ distance is the
    // body's projected radius in CSS pixels.
    let pxPerUnit = 0;
    let markerScale = 0;
    const markersActive = Boolean(camera && camera.isPerspectiveCamera && viewportHeight > 0);
    if (markersActive) {
      camera.getWorldPosition(_cameraPos);
      pxPerUnit = 0.5 * viewportHeight * camera.projectionMatrix.elements[5];
      if (pxPerUnit > 0) markerScale = MARKER_PIXEL_DIAMETER / pxPerUnit;
    }

    for (let i = 0; i < planetRuntime.length; i++) {
      const body = planetRuntime[i];

      if (body.elements) keplerPosition(body.elements, jd, body.group.position);

      const spin = ((days / body.rotationDays) % 1) * TWO_PI;
      body.mesh.rotation.y = spin;
      if (body.clouds) {
        body.clouds.rotation.y = spin + ((days / CLOUD_SUPERROTATION_DAYS) % 1) * TWO_PI;
      }

      // Sun sits at the origin, so the light direction is simply -position.
      _sunDir.copy(body.group.position).negate();
      if (_sunDir.lengthSq() > 1e-12) {
        _sunDir.normalize();
      } else {
        _sunDir.set(0, 0, 1);
      }
      for (let m = 0; m < body.sunLitMaterials.length; m++) {
        setSunDirection(body.sunLitMaterials[m], _sunDir);
      }

      if (markersActive) {
        body.group.getWorldPosition(_markerPos);
        body.cameraDistance = _cameraPos.distanceTo(_markerPos);
        updateMarker(
          body.marker,
          body.radius,
          body.cameraDistance,
          pxPerUnit,
          markerScale,
          MARKER_PLANET_OPACITY,
          1,
        );
      } else if (body.marker) {
        body.marker.visible = false;
      }
    }

    for (let i = 0; i < moonRuntime.length; i++) {
      const moon = moonRuntime[i];
      const theta = TWO_PI * ((days / moon.periodDays) % 1);
      // Counter-clockwise seen from +Y (ecliptic north).
      moon.group.position.set(
        Math.cos(theta) * moon.distance,
        0,
        -Math.sin(theta) * moon.distance,
      );
      // Tidal lock keeps one hemisphere aimed at the parent at the origin of
      // the parent's group; free rotators simply spin faster than they orbit.
      moon.mesh.rotation.y = moon.tidallyLocked
        ? theta
        : ((days / moon.spinDays) % 1) * TWO_PI;

      if (!moon.marker) continue;
      if (!markersActive) {
        moon.marker.visible = false;
        continue;
      }

      // Only worth a dot while the parent planet fills part of the frame —
      // otherwise the moons crowd into a halo of specks around it.
      const parentDistance = moon.parentRuntime ? moon.parentRuntime.cameraDistance : 0;
      const parentFade =
        1 - THREE.MathUtils.smoothstep(parentDistance, MOON_MARKER_FADE_START, MOON_MARKER_FADE_END);

      if (parentFade <= 0) {
        moon.marker.visible = false;
        continue;
      }

      moon.group.getWorldPosition(_markerPos);
      updateMarker(
        moon.marker,
        moon.radius,
        _cameraPos.distanceTo(_markerPos),
        pxPerUnit,
        markerScale,
        MARKER_MOON_OPACITY,
        parentFade,
      );
    }
  }

  return { bodies, update };
}
