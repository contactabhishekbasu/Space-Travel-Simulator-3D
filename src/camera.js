import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Camera rig: owns OrbitControls, the eased fly-to focus system, per-frame
 * follow of a moving body, and the idle cinematic drift.
 *
 * Scene convention: sun at the origin, XZ = ecliptic plane, +Y = ecliptic north.
 */

// Three-quarter system view: radius ≈ 1660 units at ≈ 33° above the ecliptic,
// far enough out that Mercury→belt read as open ellipses instead of the flat,
// nearly edge-on chords a low vantage inside Mars's orbit produces.
const OVERVIEW_POSITION = new THREE.Vector3(760, 900, 1180);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

const FLY_DURATION = 1.8;
const FLY_DURATION_REDUCED = 0.35;
const FRAME_DISTANCE_FACTOR = 4.2;
const FRAME_DISTANCE_PAD = 2;
const FOCUS_MIN_DISTANCE_FACTOR = 1.35;
const OVERVIEW_MIN_DISTANCE = 1.2;
const MAX_DISTANCE = 45000;

// Arrival framing, anchored to the sun and nothing else: the camera parks
// between the sun and the body, 12° above the ecliptic and 16° around it. That
// is a ≈ 20° phase angle — the disc reads ~97% lit with just enough terminator
// near the limb to give it volume. Bodies are lit by a single point light and
// have no earthshine, so a wider phase angle degrades to the black silhouette
// this framing exists to prevent.
const FRAMING_ELEVATION = THREE.MathUtils.degToRad(12);
const FRAMING_YAW = THREE.MathUtils.degToRad(16);
// Substitute sunward axis for a body sitting on the origin (the sun itself),
// where there is no meaningful sun→body direction.
const FALLBACK_SUNWARD = new THREE.Vector3(0, 0, 1);

// Time constant for easing the flight destination toward its live value.
const RETARGET_TAU = 0.18;

const IDLE_DELAY = 30;
const DRIFT_SPEED = 0.012; // rad/s ≈ 0.69°/s
const DRIFT_RAMP = 3;

// Reused scratch vectors — the update loop allocates nothing.
const _bodyPos = new THREE.Vector3();
const _sunward = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _scratch = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _fromDir = new THREE.Vector3();
const _destDir = new THREE.Vector3();
const _swingAxis = new THREE.Vector3();

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Shortest-arc interpolation between two unit vectors, written into `out`
 * (which must not alias either input).
 */
function slerpUnit(a, b, t, out) {
    const dot = Math.min(1, Math.max(-1, a.dot(b)));

    if (dot > 0.9995) return out.copy(a).lerp(b, t).normalize();

    if (dot < -0.9995) {
        // Antipodal: every great circle is a shortest arc, so pick one
        // deterministically instead of letting float noise choose the side the
        // camera swings around.
        _swingAxis.crossVectors(a, WORLD_UP);
        if (_swingAxis.lengthSq() < 1e-8) _swingAxis.set(1, 0, 0);
        return out.copy(a).applyAxisAngle(_swingAxis.normalize(), Math.PI * t);
    }

    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    return out.copy(a)
        .multiplyScalar(Math.sin((1 - t) * theta) / sinTheta)
        .addScaledVector(b, Math.sin(t * theta) / sinTheta);
}

function prefersReducedMotion() {
    return typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export class CameraRig {
    /**
     * @param {THREE.PerspectiveCamera} camera
     * @param {HTMLElement} rendererDom
     * @param {Map<string, object>} bodies  keyed body records from planets.js (+ sun)
     */
    constructor(camera, rendererDom, bodies) {
        this.camera = camera;
        this.domElement = rendererDom;
        this.bodies = bodies;

        /** @type {string|null} */
        this.focusedKey = null;
        /** @type {((key: string|null) => void)|null} assignable by the UI */
        this.onFocusChange = null;

        const controls = new OrbitControls(camera, rendererDom);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.rotateSpeed = 0.55;
        controls.zoomSpeed = 0.85;
        controls.panSpeed = 0.5;
        controls.screenSpacePanning = true;
        controls.minDistance = OVERVIEW_MIN_DISTANCE;
        controls.maxDistance = MAX_DISTANCE;
        controls.target.copy(OVERVIEW_TARGET);
        this.controls = controls;

        camera.position.copy(OVERVIEW_POSITION);
        camera.lookAt(OVERVIEW_TARGET);
        controls.update();

        this._reducedMotion = prefersReducedMotion();

        this._flight = {
            active: false,
            key: null,
            elapsed: 0,
            duration: FLY_DURATION,
            fromPos: new THREE.Vector3(),
            fromTarget: new THREE.Vector3(),
            destPos: new THREE.Vector3(),
            destTarget: new THREE.Vector3()
        };

        this._anchor = new THREE.Vector3();
        this._hasAnchor = false;

        this._idle = 0;
        this._driftBlend = 0;

        // Any deliberate input cancels the idle cinematic drift.
        this._onUserInput = () => {
            this._idle = 0;
            this._driftBlend = 0;
        };

        rendererDom.addEventListener('pointerdown', this._onUserInput);
        rendererDom.addEventListener('wheel', this._onUserInput, { passive: true });
        window.addEventListener('keydown', this._onUserInput);
    }

    /**
     * Fly to a body, or back to the system overview with `null`.
     * @param {string|null} key
     */
    focus(key) {
        const next = key === undefined ? null : key;
        if (next === this.focusedKey) return;
        if (next !== null && !this.bodies.has(next)) return;

        this._beginFlight(next);
        this.focusedKey = next;
        this._idle = 0;
        this._driftBlend = 0;

        if (typeof this.onFocusChange === 'function') this.onFocusChange(next);
    }

    /** @param {number} dt seconds since the last frame */
    update(dt) {
        const step = Math.min(Math.max(dt, 0), 0.1);

        if (this._flight.active) {
            this._advanceFlight(step);
            if (this._flight.active) {
                // OrbitControls stays dormant for the duration of a flight: the
                // rig owns the camera outright, so the arrival can't be nudged
                // off the lit side by leftover damping from an earlier gesture.
                // It is re-synced on the frame the flight lands.
                this.camera.lookAt(this.controls.target);
                return;
            }
        } else if (this.focusedKey !== null) {
            this._trackFocused();
        } else {
            this._updateIdleDrift(step);
        }

        this.controls.update();
    }

    handleResize() {
        const el = this.domElement;
        const width = (el && el.clientWidth) || window.innerWidth;
        const height = (el && el.clientHeight) || window.innerHeight;
        if (height > 0 && this.camera.isPerspectiveCamera) {
            const aspect = width / height;
            if (Math.abs(this.camera.aspect - aspect) > 1e-6) {
                this.camera.aspect = aspect;
                this.camera.updateProjectionMatrix();
            }
        }
        this.controls.update();
    }

    // ---------------------------------------------------------------- internals

    _beginFlight(key) {
        const flight = this._flight;

        // Flush damped rotation/zoom still bleeding out of the user's last
        // gesture before sampling the start state, so a focus change behaves
        // the same whether the camera was resting or mid-swing. The distance
        // clamp is lifted for the flush — both branches below reassign it —
        // so a flight interrupted while still inside the previous body's
        // minimum distance is not shoved outward on the way out.
        const damping = this.controls.enableDamping;
        this.controls.enableDamping = false;
        this.controls.minDistance = 0;
        this.controls.update();
        this.controls.enableDamping = damping;

        flight.active = true;
        flight.key = key;
        flight.elapsed = 0;
        flight.duration = this._reducedMotion ? FLY_DURATION_REDUCED : FLY_DURATION;
        flight.fromPos.copy(this.camera.position);
        flight.fromTarget.copy(this.controls.target);

        this._hasAnchor = false;
        this.controls.enabled = false;

        if (key === null) {
            flight.destTarget.copy(OVERVIEW_TARGET);
            flight.destPos.copy(OVERVIEW_POSITION);
            this.controls.minDistance = OVERVIEW_MIN_DISTANCE;
            this.controls.enablePan = true;
            return;
        }

        const body = this.bodies.get(key);
        this._bodyWorldPosition(body, _bodyPos);
        flight.destTarget.copy(_bodyPos);
        flight.destPos.copy(_bodyPos).add(this._framingOffset(_bodyPos, body.radius, _offset));
        this.controls.minDistance = Math.max(body.radius * FOCUS_MIN_DISTANCE_FACTOR, 0.05);
        this.controls.enablePan = false;
    }

    _advanceFlight(dt) {
        const flight = this._flight;
        flight.elapsed += dt;
        const t = Math.min(1, flight.elapsed / flight.duration);
        const e = easeInOutCubic(t);

        if (flight.key !== null) {
            const body = this.bodies.get(flight.key);
            if (body) {
                // Retarget every frame from where the body is *now*. The
                // destination is derived from the sun-anchored framing only —
                // never from the camera's incoming direction — so arriving from
                // another focused body is identical to arriving from overview.
                // The ease absorbs date jumps and extreme time scales; forcing
                // the blend to `e` locks it to the live value as the flight
                // lands, so a moving body can never strand the camera.
                this._bodyWorldPosition(body, _bodyPos);
                const catchUp = Math.max(1 - Math.exp(-dt / RETARGET_TAU), e);
                flight.destTarget.lerp(_bodyPos, catchUp);
                flight.destPos.copy(flight.destTarget)
                    .add(this._framingOffset(flight.destTarget, body.radius, _offset));
                this._anchor.copy(flight.destTarget);
                this._hasAnchor = true;
            }
        }

        // Interpolate the camera's offset *from the target* — arc for the
        // direction, geometric for the radius — rather than its raw world
        // position. A straight world-space lerp between two bodies collapses
        // that offset through zero mid-flight, which both whips the view and
        // leaves the camera approaching from whatever side it came from.
        _fromDir.subVectors(flight.fromPos, flight.fromTarget);
        _destDir.subVectors(flight.destPos, flight.destTarget);
        const r0 = Math.max(_fromDir.length(), 1e-4);
        const r1 = Math.max(_destDir.length(), 1e-4);
        _fromDir.multiplyScalar(1 / r0);
        _destDir.multiplyScalar(1 / r1);

        this.controls.target.lerpVectors(flight.fromTarget, flight.destTarget, e);
        this.camera.position.copy(this.controls.target)
            .addScaledVector(slerpUnit(_fromDir, _destDir, e, _scratch), r0 * Math.pow(r1 / r0, e));

        if (t >= 1) {
            // Land exactly on the framing point rather than on an accumulated
            // interpolation of it.
            this.controls.target.copy(flight.destTarget);
            this.camera.position.copy(flight.destPos);
            flight.active = false;
            this.controls.enabled = true;
        }
    }

    /** Delta-follow: move target and camera by the body's world-position delta. */
    _trackFocused() {
        const body = this.bodies.get(this.focusedKey);
        if (!body) return;

        this._bodyWorldPosition(body, _bodyPos);
        if (this._hasAnchor) {
            _scratch.subVectors(_bodyPos, this._anchor);
            this.controls.target.add(_scratch);
            this.camera.position.add(_scratch);
        } else {
            this._hasAnchor = true;
        }
        this._anchor.copy(_bodyPos);
    }

    _updateIdleDrift(dt) {
        if (this._reducedMotion) return;

        this._idle += dt;
        if (this._idle < IDLE_DELAY) return;

        this._driftBlend = Math.min(1, this._driftBlend + dt / DRIFT_RAMP);
        const angle = DRIFT_SPEED * this._driftBlend * dt;
        _scratch.subVectors(this.camera.position, this.controls.target)
            .applyAxisAngle(WORLD_UP, angle);
        this.camera.position.copy(this.controls.target).add(_scratch);
    }

    /**
     * Framing offset from the body to the camera, in world space: sunward, so
     * the lit face is the one turned toward the camera, lifted `FRAMING_ELEVATION`
     * above the ecliptic and swung `FRAMING_YAW` around it for a three-quarter
     * read. The sun is at the origin, so the body's own position vector is the
     * sun→body axis — the framing therefore depends on the body alone and is
     * reproducible from any starting vantage.
     */
    _framingOffset(bodyPos, radius, out) {
        const r = radius > 0 ? radius : 1;
        const distance = Math.max(r * FRAME_DISTANCE_FACTOR, r + FRAME_DISTANCE_PAD);

        // Flattened to the ecliptic so the elevation is measured from the
        // ecliptic plane and not from the body's slightly inclined radius.
        _sunward.set(-bodyPos.x, 0, -bodyPos.z);
        if (_sunward.lengthSq() < 1e-8) _sunward.copy(FALLBACK_SUNWARD);
        else _sunward.normalize();

        _tangent.crossVectors(WORLD_UP, _sunward);
        if (_tangent.lengthSq() < 1e-8) _tangent.set(1, 0, 0);
        else _tangent.normalize();

        // Orthonormal basis (sunward ⟂ tangent, both in the ecliptic, ⟂ up), so
        // the composed direction is already unit length.
        const planar = Math.cos(FRAMING_ELEVATION);
        return out.set(0, 0, 0)
            .addScaledVector(_sunward, planar * Math.cos(FRAMING_YAW))
            .addScaledVector(_tangent, planar * Math.sin(FRAMING_YAW))
            .addScaledVector(WORLD_UP, Math.sin(FRAMING_ELEVATION))
            .multiplyScalar(distance);
    }

    _bodyWorldPosition(body, out) {
        const object = body.mesh || body.group;
        object.updateWorldMatrix(true, false);
        return out.setFromMatrixPosition(object.matrixWorld);
    }
}
