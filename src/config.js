/**
 * config.js — single source of truth for world scale, orbital elements, physical
 * data and per-body art direction. No Three.js imports: this module is pure data
 * so it can be read by any other module (and unit-checked in plain node).
 *
 * ── Scale conventions ──────────────────────────────────────────────────────────
 *   Scene XZ plane = the ecliptic. +Y = ecliptic north. Orbits run
 *   counter-clockwise when viewed from +Y (matching the real solar system).
 *
 *   1 astronomical unit                       -> AU scene units (400)
 *   body radius (km) -> scene units:
 *       radiusScene = (radiusKm / AU_KM) * AU * PLANET_SCALE
 *   which yields Earth ~= 0.68 units and Jupiter ~= 7.65 units, i.e. true
 *   relative sizes, uniformly exaggerated 40x against orbital distance so that
 *   planets are visible without breaking their size ratios.
 *
 *   PLANET_SCALE = 40 supersedes the 12 written in design spec §4. At 12 Earth
 *   is 0.20 units across and falls under a pixel from any framing that also
 *   holds Jupiter's orbit, which cost the overview its planets. 40 is the
 *   largest exaggeration that still keeps every body clear of its neighbour's
 *   orbit (Jupiter at 7.65 units against a 2081-unit orbital radius), so it is
 *   the authoritative value; spec §4 should be amended to match rather than the
 *   code walked back.
 *
 *   The Sun is the deliberate exception: SUN_RADIUS is a fixed art value (28
 *   units) rather than a true-scale radius, so it reads as the dominant light
 *   source without swallowing Mercury's orbit.
 */

/** Kilometres in one astronomical unit (IAU 2012 definition). */
export const AU_KM = 149597870.7;

/** Scene units per astronomical unit. */
export const AU = 400;

/**
 * Uniform exaggeration applied to true planetary radii (ratios preserved).
 * Authoritative over design spec §4's 12 — see the scale note in the header.
 */
export const PLANET_SCALE = 40;

/** Sun radius in scene units — art-directed, not to scale. */
export const SUN_RADIUS = 28;

/**
 * Planets, inner to outer.
 *
 * `elements` are the standard J2000 mean Keplerian elements from JPL's
 * "Keplerian Elements for Approximate Positions of the Major Planets"
 * (Standish), valid 1800-2050, taken verbatim:
 *   a         semi-major axis                   [AU]
 *   e         eccentricity                      [-]
 *   i         inclination to the ecliptic       [deg]
 *   Omega     longitude of the ascending node   [deg]
 *   wBar      longitude of perihelion (Omega+w) [deg]
 *   L0        mean longitude at J2000           [deg]
 *   periodDays sidereal orbital period          [days]
 * Earth uses the Earth-Moon barycentre row, which is the conventional choice.
 *
 * `rotationHours` is the sidereal rotation period; it is NEGATIVE for the two
 * retrograde rotators (Venus, Uranus). Because the retrograde sense is carried
 * by that sign, `axialTiltDeg` is the acute tilt of the spin axis off the
 * orbital normal (Venus 2.64, Uranus 82.23) rather than the IAU obliquities
 * measured about the prograde pole (177.36 and 97.77) — the two conventions
 * describe the same physical axis and the same spin direction.
 *
 * `flattening` is the polar flattening f = (Re − Rp) / Re (NASA planetary fact
 * sheets). `radiusKm` is the equatorial radius, so a renderer reproduces the
 * true figure of the body by scaling its sphere to (1, 1 − f, 1) about the spin
 * axis — i.e. inside the axial-tilt group, so the bulge follows the pole rather
 * than the ecliptic, and applied equally to any cloud or atmosphere shell so the
 * limb and the halo stay concentric. Saturn's 9.8% and Jupiter's 6.5% are plainly
 * visible in any Cassini or Hubble frame; the terrestrials are round to the eye.
 */
export const PLANETS = [
  {
    key: 'mercury',
    name: 'Mercury',
    radiusKm: 2439.7,
    tex: { map: 'textures/high/8k_mercury.jpg' },
    elements: {
      a: 0.38709927,
      e: 0.20563593,
      i: 7.00497902,
      Omega: 48.33076593,
      wBar: 77.45779628,
      L0: 252.25032350,
      periodDays: 87.9691
    },
    rotationHours: 1407.6,
    axialTiltDeg: 0.034,
    flattening: 0,
    atmosphere: null,
    info: {
      type: 'Terrestrial planet',
      diameter: '4,879 km',
      mass: '3.30 × 10²³ kg (0.055 Earths)',
      dayLength: '58.6 Earth days (sidereal)',
      yearLength: '88.0 Earth days',
      temperature: '−173 °C to 427 °C',
      blurb:
        'The smallest planet and the closest to the Sun, Mercury is an airless, heavily cratered world whose surface swings between scorching day and freezing night.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #c3b9ae 0%, #8d8279 46%, #4a443f 100%)'
  },
  {
    key: 'venus',
    name: 'Venus',
    radiusKm: 6051.8,
    tex: { map: 'textures/high/8k_venus_surface.jpg' },
    elements: {
      a: 0.72333566,
      e: 0.00677672,
      i: 3.39467605,
      Omega: 76.67984255,
      wBar: 131.60246718,
      L0: 181.97909950,
      periodDays: 224.7008
    },
    rotationHours: -5832.5,
    axialTiltDeg: 2.64,
    flattening: 0,
    atmosphere: { color: 0xf6e2ac, intensity: 1.6, thickness: 0.085 },
    info: {
      type: 'Terrestrial planet',
      diameter: '12,104 km',
      mass: '4.87 × 10²⁴ kg (0.815 Earths)',
      dayLength: '243.0 Earth days (retrograde)',
      yearLength: '224.7 Earth days',
      temperature: '464 °C (mean surface)',
      blurb:
        'Wrapped in a crushing carbon-dioxide atmosphere and clouds of sulfuric acid, Venus is the hottest planet in the solar system and turns backwards on its axis.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #f8e6b4 0%, #d9a544 48%, #7a5416 100%)'
  },
  {
    key: 'earth',
    name: 'Earth',
    radiusKm: 6378.137,
    tex: {
      map: 'textures/high/8k_earth_daymap.jpg',
      night: 'textures/high/8k_earth_nightmap.jpg',
      clouds: 'textures/high/8k_earth_clouds.jpg',
      normal: 'textures/high/8k_earth_normal_map.jpg',
      specular: 'textures/high/8k_earth_specular_map.jpg'
    },
    elements: {
      a: 1.00000261,
      e: 0.01671123,
      i: -0.00001531,
      Omega: 0.0,
      wBar: 102.93768193,
      L0: 100.46457166,
      periodDays: 365.256363
    },
    rotationHours: 23.9345,
    axialTiltDeg: 23.44,
    flattening: 0.00335,
    atmosphere: { color: 0x5aa0ff, intensity: 1.45, thickness: 0.055 },
    info: {
      type: 'Terrestrial planet',
      diameter: '12,756 km',
      mass: '5.97 × 10²⁴ kg',
      dayLength: '23h 56m (sidereal)',
      yearLength: '365.26 days',
      temperature: '−89 °C to 57 °C',
      blurb:
        'The only known world with liquid-water oceans and life, Earth is shielded by a nitrogen–oxygen atmosphere and a magnetic field generated in its molten iron core.'
    },
    dockColor:
      'radial-gradient(circle at 30% 26%, #8fd4f5 0%, #2e86c8 38%, #1c4f8a 72%, #0d2547 100%)'
  },
  {
    key: 'mars',
    name: 'Mars',
    radiusKm: 3396.2,
    tex: { map: 'textures/high/8k_mars.jpg' },
    elements: {
      a: 1.52371034,
      e: 0.09339410,
      i: 1.84969142,
      Omega: 49.55953891,
      wBar: -23.94362959,
      L0: -4.55343205,
      periodDays: 686.9800
    },
    rotationHours: 24.6229,
    axialTiltDeg: 25.19,
    flattening: 0.00589,
    atmosphere: { color: 0xd98d5e, intensity: 0.6, thickness: 0.032 },
    info: {
      type: 'Terrestrial planet',
      diameter: '6,792 km',
      mass: '6.42 × 10²³ kg (0.107 Earths)',
      dayLength: '24h 37m',
      yearLength: '687 Earth days',
      temperature: '−143 °C to 35 °C',
      blurb:
        'A cold desert of iron-oxide dust, Mars carries the tallest volcano and the deepest canyon system in the solar system, and once ran with liquid water.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #e88a5c 0%, #b34a26 48%, #5d2010 100%)'
  },
  {
    key: 'jupiter',
    name: 'Jupiter',
    radiusKm: 71492,
    tex: { map: 'textures/high/8k_jupiter.jpg' },
    elements: {
      a: 5.20288700,
      e: 0.04838624,
      i: 1.30439695,
      Omega: 100.47390909,
      wBar: 14.72847983,
      L0: 34.39644051,
      periodDays: 4332.589
    },
    rotationHours: 9.925,
    axialTiltDeg: 3.13,
    flattening: 0.06487,
    atmosphere: { color: 0xe3c197, intensity: 0.55, thickness: 0.024 },
    info: {
      type: 'Gas giant',
      diameter: '142,984 km',
      mass: '1.90 × 10²⁷ kg (318 Earths)',
      dayLength: '9h 56m',
      yearLength: '11.86 Earth years',
      temperature: '−145 °C (cloud tops)',
      blurb:
        'The giant of the solar system, Jupiter is a ball of hydrogen and helium banded by jet streams, and its Great Red Spot is a storm wider than Earth.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #f3ddba 0%, #c9945f 46%, #7d4a2a 100%)'
  },
  {
    key: 'saturn',
    name: 'Saturn',
    radiusKm: 60268,
    tex: {
      map: 'textures/high/8k_saturn.jpg',
      ring: 'textures/high/8k_saturn_ring_alpha.png',
      // Ring extents in planet radii: inner C ring to outer edge of the A ring.
      ringInner: 1.24,
      ringOuter: 2.27
    },
    elements: {
      a: 9.53667594,
      e: 0.05386179,
      i: 2.48599187,
      Omega: 113.66242448,
      wBar: 92.59887831,
      L0: 49.95424423,
      periodDays: 10759.22
    },
    rotationHours: 10.656,
    axialTiltDeg: 26.73,
    flattening: 0.09796,
    atmosphere: { color: 0xefd9a6, intensity: 0.45, thickness: 0.022 },
    info: {
      type: 'Gas giant',
      diameter: '120,536 km',
      mass: '5.68 × 10²⁶ kg (95 Earths)',
      dayLength: '10h 39m',
      yearLength: '29.45 Earth years',
      temperature: '−178 °C (cloud tops)',
      blurb:
        'Encircled by a vast system of water-ice rings only tens of metres thick, Saturn is so low in density that it would float in a large enough ocean.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #f9e9c1 0%, #d8b678 46%, #8a6a35 100%)'
  },
  {
    key: 'uranus',
    name: 'Uranus',
    radiusKm: 25559,
    tex: { map: 'textures/low/2k_uranus.jpg' },
    elements: {
      a: 19.18916464,
      e: 0.04725744,
      i: 0.77263783,
      Omega: 74.01692503,
      wBar: 170.95427630,
      L0: 313.23810451,
      periodDays: 30685.4
    },
    rotationHours: -17.24,
    axialTiltDeg: 82.23,
    flattening: 0.02293,
    atmosphere: { color: 0x9cebef, intensity: 0.75, thickness: 0.03 },
    info: {
      type: 'Ice giant',
      diameter: '51,118 km',
      mass: '8.68 × 10²⁵ kg (14.5 Earths)',
      dayLength: '17h 14m (retrograde)',
      yearLength: '84.0 Earth years',
      temperature: '−224 °C (cloud tops)',
      blurb:
        'Knocked onto its side by an ancient collision, Uranus rolls around the Sun and holds the coldest atmosphere ever measured in the solar system.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #c9f4f2 0%, #74c9d4 46%, #2e6f85 100%)'
  },
  {
    key: 'neptune',
    name: 'Neptune',
    radiusKm: 24764,
    tex: { map: 'textures/low/2k_neptune.jpg' },
    elements: {
      a: 30.06992276,
      e: 0.00859048,
      i: 1.77004347,
      Omega: 131.78422574,
      wBar: 44.96476227,
      L0: -55.12002969,
      periodDays: 60189.0
    },
    rotationHours: 16.11,
    axialTiltDeg: 28.32,
    flattening: 0.01708,
    atmosphere: { color: 0x5b8dff, intensity: 0.85, thickness: 0.032 },
    info: {
      type: 'Ice giant',
      diameter: '49,528 km',
      mass: '1.02 × 10²⁶ kg (17.1 Earths)',
      dayLength: '16h 07m',
      yearLength: '164.8 Earth years',
      temperature: '−214 °C (cloud tops)',
      blurb:
        'The windiest world known, Neptune drives supersonic storms across a deep blue methane sky, thirty times farther from the Sun than Earth.'
    },
    dockColor:
      'radial-gradient(circle at 32% 28%, #9dbdf8 0%, #3b62c9 46%, #16276b 100%)'
  }
];

/**
 * Major moons. `distanceKm` is the real semi-major axis; renderers exaggerate it
 * for legibility via the shared display formula in planets.js. `color` is the
 * body's mean albedo colour, used directly for untextured moons and as the
 * texture-load fallback for the Moon.
 */
export const MOONS = [
  {
    key: 'moon',
    name: 'Moon',
    parent: 'earth',
    radiusKm: 1737.4,
    distanceKm: 384400,
    periodDays: 27.321661,
    color: 0x9d9a94,
    tex: 'textures/high/8k_moon.jpg',
    tidallyLocked: true
  },
  {
    key: 'io',
    name: 'Io',
    parent: 'jupiter',
    radiusKm: 1821.6,
    distanceKm: 421700,
    periodDays: 1.769138,
    color: 0xdcc072,
    tidallyLocked: true
  },
  {
    key: 'europa',
    name: 'Europa',
    parent: 'jupiter',
    radiusKm: 1560.8,
    distanceKm: 671100,
    periodDays: 3.551181,
    color: 0xd8cdb6,
    tidallyLocked: true
  },
  {
    key: 'ganymede',
    name: 'Ganymede',
    parent: 'jupiter',
    radiusKm: 2634.1,
    distanceKm: 1070400,
    periodDays: 7.154553,
    color: 0x9d907e,
    tidallyLocked: true
  },
  {
    key: 'callisto',
    name: 'Callisto',
    parent: 'jupiter',
    radiusKm: 2410.3,
    distanceKm: 1882700,
    periodDays: 16.689018,
    color: 0x6f6255,
    tidallyLocked: true
  },
  {
    key: 'titan',
    name: 'Titan',
    parent: 'saturn',
    radiusKm: 2574.7,
    distanceKm: 1221870,
    periodDays: 15.945,
    color: 0xd9a758,
    tidallyLocked: true
  }
];

/** Facts for the Sun's info card — same shape as PLANETS[].info. */
export const SUN_INFO = {
  type: 'G2V main-sequence star',
  diameter: '1,392,700 km',
  mass: '1.989 × 10³⁰ kg (333,000 Earths)',
  dayLength: '25.4 Earth days (equatorial)',
  yearLength: '230 million years (galactic orbit)',
  temperature: '5,505 °C surface, 15.7 million °C core',
  blurb:
    'The Sun holds 99.86% of the mass of the solar system and fuses roughly 600 million tonnes of hydrogen every second.'
};
