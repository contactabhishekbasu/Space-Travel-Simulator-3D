/**
 * labels.js — CSS2D name plates for every body in the registry.
 *
 * One `<div class="body-label">` per body (moons additionally carry
 * `body-label--moon`), parented to the body's group so it tracks the object for
 * free. The renderer's DOM layer is mounted inside the HUD and never receives
 * pointer events.
 *
 * A plate is only drawn when it earns its place. Opacity is gated by, in order:
 *   • focus            — the focused body names itself in the info card
 *   • camera proximity — plates fade as the camera closes on the surface
 *   • parent proximity — moon plates fade once the camera leaves their planet
 *   • relative range   — bodies far behind the focused one are dropped, so an
 *                        Earth close-up is not littered with NEPTUNE
 *   • screen position  — plates that would land on HUD chrome or be clipped by
 *                        the viewport edge are suppressed outright (the glass
 *                        panels are translucent, so a plate underneath still
 *                        shows through and collides with the controls)
 *   • sun glare        — a plate for a body beyond the sun that lands on the
 *                        photosphere or in the corona is faded to a whisper;
 *                        white type on the blown-out disc reads as a defect
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SUN_RADIUS } from './config.js';

// Label sits this many body radii above the centre.
const LABEL_OFFSET_FACTOR = 1.6;

// Moon labels fade between these camera-to-parent distances (scene units).
const MOON_FADE_START = 220;
const MOON_FADE_END = 300;

// Any label fades out as the camera approaches the body it names.
const NEAR_FADE_INNER = 1.6; // × radius — fully hidden
const NEAR_FADE_OUTER = 4.0; // × radius — fully visible

// While focused, a body more than this many times farther from the camera than
// the focused body is out of the shot entirely — drop its plate.
const FAR_FOCUS_FACTOR = 40;

// HUD chrome the plates must stay clear of, and the slack around each rect.
const HUD_KEEP_OUT_SELECTOR = '.panel, .dock, .brand';
const HUD_KEEP_OUT_PADDING = 12;

// Panels open and close at runtime (the info card), so the keep-out rects are
// re-read on a slow timer rather than only on resize.
const HUD_RECT_REFRESH_MS = 250;

// Minimum clearance between a plate's anchor and the viewport border.
const EDGE_MARGIN_PX = 24;

const MIN_VISIBLE_OPACITY = 0.02;

// The sun blows out everything drawn over it, so a plate whose body lies beyond
// the sun and whose anchor lands on the disc is faded rather than cut — the
// falloff runs from the limb out through the corona, so a body swinging past
// conjunction eases back in instead of popping.
const SUN_GLARE_CORE = 1.0; // × apparent sun radius — full suppression
const SUN_GLARE_HALO = 2.5; // × apparent sun radius — no suppression
const SUN_GLARE_FLOOR = 0.05; // opacity multiplier at full suppression

// The apparent radius diverges as the camera reaches the photosphere; cap it so
// the term stays finite (well past screen-filling either way).
const SUN_NDC_RADIUS_MAX = 8;

// Reused every frame.
const _cameraPos = new THREE.Vector3();
const _bodyPos = new THREE.Vector3();
const _parentPos = new THREE.Vector3();
const _focusPos = new THREE.Vector3();
const _screenPos = new THREE.Vector3();
const _sunPos = new THREE.Vector3();

/**
 * @param {Map<string, object>} bodies registry from createSolarSystem (plus the sun)
 * @param {HTMLElement} hudEl HUD container the label layer mounts into
 * @returns {{ labelRenderer: CSS2DRenderer, update: (camera:THREE.Camera, focusedKey:string|null) => void,
 *             setVisible: (visible:boolean) => void, setSize: (w:number, h:number) => void }}
 */
export function createLabels(bodies, hudEl) {
  const labelRenderer = new CSS2DRenderer();
  const layer = labelRenderer.domElement;
  layer.className = 'label-layer';
  layer.style.position = 'absolute';
  layer.style.top = '0';
  layer.style.left = '0';
  layer.style.pointerEvents = 'none';

  let viewWidth = hudEl.clientWidth || window.innerWidth;
  let viewHeight = hudEl.clientHeight || window.innerHeight;
  labelRenderer.setSize(viewWidth, viewHeight);
  // Mounted before ui.js builds the panels, so the HUD chrome always paints on
  // top of the label layer in DOM order.
  hudEl.appendChild(layer);

  const entries = [];

  // Anchors the glare gate below. It is also the one body the gate must never
  // touch: the sun names itself from inside its own glow.
  let star = null;

  bodies.forEach((body) => {
    if (!body || !body.group) {
      console.warn(`[labels] Skipping body without a group: ${body && body.key}`);
      return;
    }

    if (body.isStar && !star) star = body;

    const element = document.createElement('div');
    element.className = body.isMoon ? 'body-label body-label--moon' : 'body-label';
    element.textContent = body.name;
    element.dataset.bodyKey = body.key;

    const offsetY = (body.radius || 0) * LABEL_OFFSET_FACTOR;

    const object = new CSS2DObject(element);
    object.position.set(0, offsetY, 0);
    object.center.set(0.5, 0.5);
    body.group.add(object);

    entries.push({
      key: body.key,
      body,
      element,
      object,
      // Body groups carry position only (never rotation or scale), so the plate
      // anchor in world space is simply the body centre lifted along +Y.
      offsetY,
      nearInner: (body.radius || 0) * NEAR_FADE_INNER,
      nearOuter: (body.radius || 0) * NEAR_FADE_OUTER,
      halfWidth: 0,
      halfHeight: 0,
      lastOpacity: -1,
    });
  });

  // The CSS2D pass needs the scene root; groups are already parented by the
  // time this module runs, but resolve lazily so ordering never matters.
  let root = null;
  function ensureRoot() {
    if (root && root.isScene) return root;
    for (let i = 0; i < entries.length; i++) {
      let node = entries[i].body.group;
      while (node.parent) node = node.parent;
      if (node.isScene) {
        root = node;
        return root;
      }
      if (!root) root = node;
    }
    return root;
  }

  let visible = true;

  /** Screen rects the plates must avoid, refreshed on a slow timer. */
  const keepOut = [];
  let keepOutStamp = -Infinity;

  /**
   * Re-reads the HUD chrome geometry. Elements that are hidden or mid-fade (the
   * info card lives in the DOM permanently and only toggles visibility) are
   * skipped so they do not reserve space they are not using.
   */
  function refreshKeepOut(now) {
    keepOutStamp = now;
    keepOut.length = 0;

    const nodes = hudEl.querySelectorAll(HUD_KEEP_OUT_SELECTOR);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (parseFloat(style.opacity) < 0.08) continue;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      keepOut.push({
        left: rect.left - HUD_KEEP_OUT_PADDING,
        top: rect.top - HUD_KEEP_OUT_PADDING,
        right: rect.right + HUD_KEEP_OUT_PADDING,
        bottom: rect.bottom + HUD_KEEP_OUT_PADDING,
      });
    }

    // Plate sizes are fixed by their text; measure once, whenever one happens
    // to be on screen (a hidden element reports zero).
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.halfWidth > 0) continue;
      const width = entry.element.offsetWidth;
      if (width > 0) {
        entry.halfWidth = width / 2;
        entry.halfHeight = entry.element.offsetHeight / 2;
      }
    }
  }

  function insideKeepOut(x, y) {
    for (let i = 0; i < keepOut.length; i++) {
      const rect = keepOut[i];
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return true;
    }
    return false;
  }

  function update(camera, focusedKey) {
    if (!visible || entries.length === 0) return;
    const scene = ensureRoot();
    if (!scene) return;

    // Projection below runs before the renderer has refreshed the camera, so
    // bring its inverse world matrix up to date first.
    camera.updateMatrixWorld();
    camera.getWorldPosition(_cameraPos);

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - keepOutStamp >= HUD_RECT_REFRESH_MS) refreshKeepOut(now);

    // Apparent sun geometry, solved once per frame. A radius of 0 means the
    // gate is off for this frame — the sun is behind the camera, or the camera
    // is not a perspective one and the angular maths does not apply.
    let sunNdcRadius = 0;
    let sunNdcX = 0;
    let sunNdcY = 0;
    let sunDistance = 0;
    let ndcAspect = 1;

    if (camera.isPerspectiveCamera) {
      if (star && star.group) star.group.getWorldPosition(_sunPos);
      else _sunPos.set(0, 0, 0);

      sunDistance = _cameraPos.distanceTo(_sunPos);
      _sunPos.project(camera); // world position is spent; NDC from here on

      if (sunDistance > 0 && _sunPos.z <= 1) {
        // Half-angle to the limb, expressed in vertical NDC units. Using the
        // tangent ray rather than the centre ray keeps it honest as the camera
        // closes in, where the small-angle form would badly under-read.
        const tangent = Math.sqrt(
          Math.max(sunDistance * sunDistance - SUN_RADIUS * SUN_RADIUS, 1e-4)
        );
        const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
        if (halfFovTan > 0) {
          sunNdcRadius = Math.min(SUN_RADIUS / tangent / halfFovTan, SUN_NDC_RADIUS_MAX);
          sunNdcX = _sunPos.x;
          sunNdcY = _sunPos.y;
          // NDC x is stretched by the aspect ratio; undo it so the gate stays
          // circular on screen instead of an ellipse.
          ndcAspect = camera.aspect > 0 ? camera.aspect : viewWidth / Math.max(viewHeight, 1);
        }
      }
    }

    // Anything far behind the focused body is a speck in the wrong shot.
    let farCull = Infinity;
    if (focusedKey) {
      const focusBody = bodies.get(focusedKey);
      if (focusBody && focusBody.group) {
        focusBody.group.getWorldPosition(_focusPos);
        farCull = _cameraPos.distanceTo(_focusPos) * FAR_FOCUS_FACTOR;
      }
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const body = entry.body;

      let opacity;
      if (entry.key === focusedKey) {
        opacity = 0;
      } else {
        body.group.getWorldPosition(_bodyPos);
        const distance = _cameraPos.distanceTo(_bodyPos);
        opacity = THREE.MathUtils.smoothstep(distance, entry.nearInner, entry.nearOuter);

        if (opacity > 0 && distance > farCull) opacity = 0;

        if (body.isMoon && opacity > 0) {
          const parent = body.parentKey ? bodies.get(body.parentKey) : null;
          if (parent && parent.group) {
            parent.group.getWorldPosition(_parentPos);
            const parentDistance = _cameraPos.distanceTo(_parentPos);
            opacity *=
              1 - THREE.MathUtils.smoothstep(parentDistance, MOON_FADE_START, MOON_FADE_END);
          }
        }

        if (opacity > MIN_VISIBLE_OPACITY) {
          _screenPos.copy(_bodyPos);
          _screenPos.y += entry.offsetY;
          _screenPos.project(camera);

          if (_screenPos.z > 1) {
            opacity = 0; // behind the camera
          } else {
            const x = (_screenPos.x * 0.5 + 0.5) * viewWidth;
            const y = (-_screenPos.y * 0.5 + 0.5) * viewHeight;
            const marginX = Math.max(EDGE_MARGIN_PX, entry.halfWidth + 6);
            const marginY = Math.max(EDGE_MARGIN_PX, entry.halfHeight + 6);

            if (
              x < marginX ||
              x > viewWidth - marginX ||
              y < marginY ||
              y > viewHeight - marginY ||
              insideKeepOut(x, y)
            ) {
              opacity = 0;
            } else if (sunNdcRadius > 0 && body !== star) {
              // Ramp across the sun's own depth so a body crossing the disc
              // hands off smoothly between transit (unaffected) and occultation.
              const beyond = THREE.MathUtils.smoothstep(
                distance,
                sunDistance - SUN_RADIUS,
                sunDistance + SUN_RADIUS
              );
              if (beyond > 0) {
                const dx = (_screenPos.x - sunNdcX) * ndcAspect;
                const dy = _screenPos.y - sunNdcY;
                const spread = Math.sqrt(dx * dx + dy * dy) / sunNdcRadius;
                const glare =
                  beyond * (1 - THREE.MathUtils.smoothstep(spread, SUN_GLARE_CORE, SUN_GLARE_HALO));
                if (glare > 0) opacity *= 1 - glare * (1 - SUN_GLARE_FLOOR);
              }
            }
          }
        }
      }

      const shown = opacity > MIN_VISIBLE_OPACITY;
      entry.object.visible = shown;
      if (shown && Math.abs(opacity - entry.lastOpacity) > 0.004) {
        entry.element.style.opacity = opacity.toFixed(3);
        entry.lastOpacity = opacity;
      }
    }

    labelRenderer.render(scene, camera);
  }

  function setVisible(nextVisible) {
    visible = nextVisible !== false;
    layer.style.display = visible ? '' : 'none';
  }

  function setSize(width, height) {
    viewWidth = width;
    viewHeight = height;
    labelRenderer.setSize(width, height);
    keepOutStamp = -Infinity; // panels have moved — re-read on the next frame
  }

  return { labelRenderer, update, setVisible, setSize };
}
