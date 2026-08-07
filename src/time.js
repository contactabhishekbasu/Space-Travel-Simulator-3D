/**
 * time.js — the simulation clock.
 *
 * Everything that moves (orbits, spins, moons, ring shadows) derives from a
 * single simulation Julian Date so that scrubbing time stays consistent across
 * every system. Real elapsed seconds go in, Julian Days come out.
 */

/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const JD_UNIX_EPOCH = 2440587.5;

const MS_PER_DAY = 86400000;
const SEC_PER_DAY = 86400;

/** Largest timestamp a JS Date can represent (±100,000,000 days from epoch). */
const MAX_DATE_MS = 8.64e15;

/** JD bounds that keep `get date` inside the representable Date range. */
const MIN_JD = JD_UNIX_EPOCH - MAX_DATE_MS / MS_PER_DAY;
const MAX_JD = JD_UNIX_EPOCH + MAX_DATE_MS / MS_PER_DAY;

/**
 * Time-scale limits, in simulated seconds per real second (±10⁷×, per spec §4).
 * 86400 is one simulated day per real second.
 */
const MAX_SCALE = 1e7;

/** Date (UTC instant) -> Julian Date. */
function dateToJD(date) {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}

/** Julian Date -> Date (UTC instant), clamped to the representable range. */
function jdToDate(jd) {
  const clamped = Math.min(MAX_JD, Math.max(MIN_JD, jd));
  return new Date(Math.round((clamped - JD_UNIX_EPOCH) * MS_PER_DAY));
}

export class TimeEngine {
  /**
   * @param {Date} [startDate] Simulation start instant; defaults to now.
   */
  constructor(startDate = new Date()) {
    /** @type {number} simulation Julian Date */
    this.jd = dateToJD(startDate);
    /** @type {number} simulated seconds per real second */
    this.scale = SEC_PER_DAY;
    /** @type {boolean} */
    this.playing = true;
  }

  /**
   * Advance the simulation clock.
   * @param {number} dtRealSec Real seconds elapsed since the previous frame.
   */
  update(dtRealSec) {
    if (!this.playing) return;
    if (!Number.isFinite(dtRealSec) || dtRealSec <= 0) return;
    // Guard against tab-restore spikes producing a multi-year jump in one frame.
    const dt = Math.min(dtRealSec, 0.25);
    this.jd = Math.min(
      MAX_JD,
      Math.max(MIN_JD, this.jd + (dt * this.scale) / SEC_PER_DAY)
    );
  }

  /**
   * Set the time scale in simulated seconds per real second. Negative values run
   * time backwards; the magnitude is clamped to ±10⁷.
   * @param {number} s
   * @returns {number} the clamped scale actually applied
   */
  setScale(s) {
    const value = Number.isFinite(s) ? s : SEC_PER_DAY;
    this.scale = Math.min(MAX_SCALE, Math.max(-MAX_SCALE, value));
    return this.scale;
  }

  /**
   * Toggle play/pause.
   * @returns {boolean} the new playing state
   */
  togglePlay() {
    this.playing = !this.playing;
    return this.playing;
  }

  /**
   * Jump the simulation to a specific instant. Invalid dates are ignored so a
   * malformed UI input can never poison the clock.
   * @param {Date|number|string} date
   * @returns {boolean} true if the jump was applied
   */
  jumpToDate(date) {
    const target = date instanceof Date ? date : new Date(date);
    const ms = target.getTime();
    if (!Number.isFinite(ms)) return false;
    this.jd = Math.min(MAX_JD, Math.max(MIN_JD, dateToJD(target)));
    return true;
  }

  /** Snap the simulation back to the current wall-clock instant. */
  resetToNow() {
    this.jd = dateToJD(new Date());
  }

  /** @returns {Date} the simulation instant as a UTC-based Date. */
  get date() {
    return jdToDate(this.jd);
  }
}
