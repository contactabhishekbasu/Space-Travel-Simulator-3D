import { PLANETS } from './config.js';

/**
 * SOLARA HUD — all overlay DOM is built here into #hud (index.html stays skeletal).
 * Vanilla DOM + event delegation, no framework. Styling lives in css/app.css.
 */

const DOCK_FALLBACK = {
    sun: 'radial-gradient(circle at 34% 28%, #fff6d8 0%, #ffcc55 38%, #ff8a1f 72%, #a83f00 100%)',
    mercury: 'radial-gradient(circle at 34% 28%, #cfc9c2 0%, #9a9187 48%, #4a453f 100%)',
    venus: 'radial-gradient(circle at 34% 28%, #ffe9c0 0%, #e3b878 48%, #7d5a2c 100%)',
    earth: 'radial-gradient(circle at 34% 28%, #a8d8ff 0%, #3f86d4 44%, #1c4f2e 74%, #0a2340 100%)',
    mars: 'radial-gradient(circle at 34% 28%, #f0a377 0%, #c05b32 48%, #5e2412 100%)',
    jupiter: 'radial-gradient(circle at 34% 28%, #f3ddc0 0%, #d9a86f 40%, #a56c3c 70%, #5b3a20 100%)',
    saturn: 'radial-gradient(circle at 34% 28%, #f6e6bd 0%, #ddc186 46%, #8d6f3c 100%)',
    uranus: 'radial-gradient(circle at 34% 28%, #d6f4f6 0%, #8fd3dd 46%, #3d7f8f 100%)',
    neptune: 'radial-gradient(circle at 34% 28%, #a9c8ff 0%, #4b6fd6 46%, #1c2f78 100%)'
};

const ICONS = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.6 3.1 13 8l-8.4 4.9z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3.2" width="2.9" height="9.6" rx=".8"/><rect x="9.1" y="3.2" width="2.9" height="9.6" rx=".8"/></svg>',
    // Two concentric tilted ellipses + a sun: an orbit diagram, not an eye.
    orbits: '<svg viewBox="0 0 16 16" aria-hidden="true">' +
        '<ellipse cx="8" cy="8" rx="7" ry="3.2" fill="none" stroke="currentColor" stroke-width="1.05" transform="rotate(-14 8 8)"/>' +
        '<ellipse cx="8" cy="8" rx="4.2" ry="1.9" fill="none" stroke="currentColor" stroke-width="1.05" transform="rotate(-14 8 8)"/>' +
        '<circle cx="8" cy="8" r="1.5"/></svg>',
    // A name plate with a leader line down to the point it names.
    labels: '<svg viewBox="0 0 16 16" aria-hidden="true">' +
        '<rect x="6.2" y="2.7" width="8.4" height="5.8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.05"/>' +
        '<circle cx="8.7" cy="5.6" r=".95"/>' +
        '<path d="M6.4 8.2 4.1 11.1" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '<circle cx="3.1" cy="12.3" r="1.5"/></svg>',
    // Five rocks of varying size strung along an arc: a belt, not confetti.
    asteroids: '<svg viewBox="0 0 16 16" aria-hidden="true">' +
        '<circle cx="2.3" cy="10.1" r="1"/><circle cx="5.3" cy="7.4" r="1.6"/>' +
        '<circle cx="8.4" cy="5.9" r="1.1"/><circle cx="11.6" cy="6.6" r="1.7"/>' +
        '<circle cx="14" cy="8.7" r=".9"/></svg>',
    overview: '<svg viewBox="0 0 16 16" aria-hidden="true">' +
        '<g fill="none" stroke="currentColor" stroke-width="1.1">' +
        '<ellipse cx="8" cy="8" rx="6.7" ry="3" transform="rotate(-18 8 8)"/>' +
        '<ellipse cx="8" cy="8" rx="4.5" ry="2" transform="rotate(-18 8 8)"/>' +
        '<ellipse cx="8" cy="8" rx="2.4" ry="1.05" transform="rotate(-18 8 8)"/></g>' +
        '<circle cx="8" cy="8" r="1.15"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.3 3.3 8 7l3.7-3.7 1 1L9 8l3.7 3.7-1 1L8 9l-3.7 3.7-1-1L7 8 3.3 4.3z"/></svg>'
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FACT_FIELDS = [
    ['diameter', 'Diameter'],
    ['mass', 'Mass'],
    ['dayLength', 'Day'],
    ['yearLength', 'Year'],
    ['temperature', 'Mean temp']
];

const TOGGLE_DEFS = [
    ['orbits', 'Orbits'],
    ['labels', 'Labels'],
    ['asteroids', 'Asteroids']
];

// Log time-scale slider: integer −1000…1000, flat detent at real time in the middle.
const SLIDER_RANGE = 1000;
const SLIDER_DETENT = 30;
const SCALE_EXPONENT = 7; // ±10^7 × real time

function sliderToScale(value) {
    const magnitudeSlider = Math.abs(value);
    if (magnitudeSlider <= SLIDER_DETENT) return 1;
    const n = (magnitudeSlider - SLIDER_DETENT) / (SLIDER_RANGE - SLIDER_DETENT);
    const scale = Math.pow(10, n * SCALE_EXPONENT);
    return value < 0 ? -scale : scale;
}

function scaleToSlider(scale) {
    const magnitude = Math.abs(Number(scale) || 1);
    if (magnitude <= 1.0001) return 0;
    const n = Math.min(1, Math.log10(magnitude) / SCALE_EXPONENT);
    const value = Math.round(SLIDER_DETENT + n * (SLIDER_RANGE - SLIDER_DETENT));
    return scale < 0 ? -value : value;
}

function trim(value) {
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return String(rounded);
}

function rate(value, singular, plural) {
    const text = trim(value);
    return `${text} ${text === '1' ? singular : plural}/s`;
}

function formatScale(scale) {
    const magnitude = Math.abs(scale);
    if (magnitude < 2) return scale < 0 ? 'reverse real time' : 'real time';

    // Cut over to days at 18 h/s so 86,400× reads "1 day/s" rather than "24 hr/s".
    let core;
    if (magnitude < 90) core = rate(magnitude, 'sec', 'sec');
    else if (magnitude < 5400) core = rate(magnitude / 60, 'min', 'min');
    else if (magnitude < 64800) core = rate(magnitude / 3600, 'hr', 'hr');
    else if (magnitude < 31557600) core = rate(magnitude / 86400, 'day', 'days');
    else core = rate(magnitude / 31557600, 'yr', 'yr');

    return (scale < 0 ? '−' : '') + core;
}

function formatDate(date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatClock(date) {
    const h = String(date.getUTCHours()).padStart(2, '0');
    const m = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
}

// The readout advertises UTC, so the jump field round-trips in UTC too.
function toUtcInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
        `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

const PARENTHETICAL = /^(.+?)\s*\(([^()]+)\)$/;

/**
 * Split a fact value into a headline value and a secondary qualifier so long
 * strings stop wrapping into two right-aligned lines beside a centred label.
 * "1.90 × 10²⁷ kg (318 Earths)" → { value: "1.90 × 10²⁷ kg", note: "318 Earths" }
 */
function splitFact(raw) {
    const text = String(raw).trim();

    const parenthetical = PARENTHETICAL.exec(text);
    if (parenthetical) return { value: parenthetical[1], note: parenthetical[2] };

    // Long comma-joined values (the Sun's temperature) split on the separator.
    const comma = text.indexOf(', ');
    if (text.length > 24 && comma > 0) {
        return { value: text.slice(0, comma), note: text.slice(comma + 2) };
    }

    return { value: text, note: '' };
}

function element(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
}

/**
 * @param {{ bodies: Map<string, object>, timeEngine: object, cameraRig: object,
 *           toggles: { orbits: Function, labels: Function, asteroids: Function },
 *           sunInfo: object }} app
 */
export function initUI(app) {
    const hud = document.getElementById('hud');
    if (!hud) return;

    const { bodies, timeEngine, cameraRig, toggles } = app;

    // ------------------------------------------------------------- top left
    const brand = element('div', 'brand');
    brand.appendChild(element('div', 'brand-mark', 'SOLARA'));
    brand.appendChild(element('div', 'brand-sub', 'Solar System Simulator'));
    hud.appendChild(brand);

    // Instrumentation, not identity — its own status slot away from the wordmark.
    const fps = element('div', null, '—');
    fps.id = 'fps';
    hud.appendChild(fps);

    // ------------------------------------------------------------ top right
    const time = element('section', 'panel time-cluster');
    time.innerHTML = `
        <div class="time-readout">
            <div class="time-date" id="time-date"></div>
            <div class="time-clock" id="time-clock"></div>
        </div>
        <div class="time-row">
            <button class="btn btn-icon" id="play-toggle" type="button"
                    data-action="play" aria-label="Play or pause">${ICONS.pause}</button>
            <button class="btn btn-text" type="button" data-action="now">Now</button>
        </div>
        <div class="scale-head">
            <span class="field-label">Speed</span>
            <span class="scale-label" id="scale-label">real time</span>
        </div>
        <div class="scale-row">
            <span class="scale-detent" aria-hidden="true"></span>
            <input type="range" id="time-scale" min="${-SLIDER_RANGE}" max="${SLIDER_RANGE}"
                   step="1" value="0" aria-label="Time scale">
        </div>
        <div class="scale-scale" aria-hidden="true">
            <span>−10⁷×</span><span>Real</span><span>10⁷×</span>
        </div>
        <label class="jump-row">
            <span class="field-label">Jump to · UTC</span>
            <input type="datetime-local" id="date-jump" aria-label="Jump to date and time (UTC)">
        </label>
        <div class="toggle-row" id="toggle-row">
            <span class="field-label">Show</span>
        </div>
    `;
    hud.appendChild(time);

    const toggleRow = time.querySelector('#toggle-row');
    for (const [key, label] of TOGGLE_DEFS) {
        const button = element('button', 'btn btn-toggle is-on', ICONS[key]);
        button.type = 'button';
        button.dataset.action = 'toggle';
        button.dataset.toggle = key;
        button.dataset.name = label;
        button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-label', label);
        toggleRow.appendChild(button);
    }

    const dateEl = time.querySelector('#time-date');
    const clockEl = time.querySelector('#time-clock');
    const playButton = time.querySelector('#play-toggle');
    const scaleSlider = time.querySelector('#time-scale');
    const scaleLabel = time.querySelector('#scale-label');
    const jumpInput = time.querySelector('#date-jump');

    // -------------------------------------------------------- bottom centre
    const planetByKey = new Map(PLANETS.map((planet) => [planet.key, planet]));
    const dock = element('nav', 'panel dock');
    dock.setAttribute('aria-label', 'Focus a body');

    // Leading control: back to the system overview. Deliberately not a sphere.
    const overviewButton = element('button', 'dock-item dock-item--overview', ICONS.overview);
    overviewButton.type = 'button';
    overviewButton.dataset.action = 'focus';
    overviewButton.dataset.key = '';
    overviewButton.dataset.name = 'Overview';
    overviewButton.setAttribute('aria-label', 'Overview');
    dock.appendChild(overviewButton);
    const separator = element('span', 'dock-sep');
    separator.setAttribute('aria-hidden', 'true');
    dock.appendChild(separator);

    const dockKeys = [];
    if (bodies.has('sun')) dockKeys.push('sun');
    for (const planet of PLANETS) {
        if (bodies.has(planet.key)) dockKeys.push(planet.key);
    }
    for (const key of dockKeys) {
        const body = bodies.get(key);
        const planet = planetByKey.get(key);
        const button = element('button', key === 'sun' ? 'dock-item dock-item--sun' : 'dock-item');
        button.type = 'button';
        button.dataset.action = 'focus';
        button.dataset.key = key;
        button.dataset.name = body.name || key;
        if (planet) {
            button.dataset.size = planet.radiusKm > 20000 ? 'giant' : 'terrestrial';
        }
        button.setAttribute('aria-label', body.name || key);
        // Exposed as a custom property so the stylesheet can layer per-planet
        // surface detail (bands, continents, caps) over the base sphere.
        button.style.setProperty('--sphere', (planet && planet.dockColor) || DOCK_FALLBACK[key] ||
            'radial-gradient(circle at 34% 28%, #d8d8d8, #6b6b6b 60%, #2a2a2a)');
        dock.appendChild(button);
    }
    hud.appendChild(dock);

    const dockHint = element('div', 'dock-hint',
        'Click a body · Esc for overview · Space to pause');
    hud.appendChild(dockHint);

    // ------------------------------------------------------------ info card
    const card = element('aside', 'panel info-card');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
        <button class="btn btn-icon info-close" type="button"
                data-action="close-info" aria-label="Close">${ICONS.close}</button>
        <h2 class="info-name" id="info-name"></h2>
        <span class="chip" id="info-type"></span>
        <dl class="facts" id="info-facts"></dl>
        <p class="blurb" id="info-blurb"></p>
    `;
    hud.appendChild(card);

    const infoName = card.querySelector('#info-name');
    const infoType = card.querySelector('#info-type');
    const infoFacts = card.querySelector('#info-facts');
    const infoBlurb = card.querySelector('#info-blurb');

    // --------------------------------------------------------------- wiring
    function callToggle(name, value) {
        const fn = toggles && toggles[name];
        if (typeof fn === 'function') fn(value);
    }

    const toggleState = { orbits: true, labels: true, asteroids: true };

    function syncPlayButton() {
        const playing = timeEngine.playing !== false;
        playButton.innerHTML = playing ? ICONS.pause : ICONS.play;
        playButton.classList.toggle('is-paused', !playing);
        playButton.setAttribute('aria-pressed', String(playing));
    }

    function syncClock() {
        const date = timeEngine.date;
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
        dateEl.textContent = formatDate(date);
        clockEl.textContent = formatClock(date);
        // Keep the jump field on the simulation clock — but never fight the
        // user while they are editing it.
        if (document.activeElement !== jumpInput) {
            jumpInput.value = toUtcInputValue(date);
        }
    }

    function syncScaleLabel() {
        scaleLabel.textContent = formatScale(sliderToScale(Number(scaleSlider.value)));
    }

    /** Centre-out track fill: 0 at full reverse, .5 at real time, 1 at full forward. */
    function syncSliderFill() {
        const progress = (Number(scaleSlider.value) / SLIDER_RANGE + 1) / 2;
        scaleSlider.style.setProperty('--p', String(progress));
    }

    function setDockActive(key) {
        const active = (key === null || key === undefined) ? '' : key;
        for (const item of dock.children) {
            if (item.dataset.action !== 'focus') continue;
            item.classList.toggle('is-active', (item.dataset.key || '') === active);
        }
    }

    function bodyInfo(key) {
        if (key === 'sun') return app.sunInfo || (bodies.get('sun') || {}).info || null;
        const body = bodies.get(key);
        return body ? body.info || null : null;
    }

    function showInfo(key) {
        const body = bodies.get(key);
        if (!body) {
            hideInfo();
            return;
        }
        const info = bodyInfo(key) || {};

        infoName.textContent = body.name || key;

        const type = info.type || (body.isMoon ? 'Moon' : body.isStar ? 'Star' : 'Planet');
        infoType.textContent = type;

        infoFacts.textContent = '';
        for (const [field, label] of FACT_FIELDS) {
            const raw = info[field];
            if (!raw) continue;

            const dt = document.createElement('dt');
            dt.textContent = label;
            infoFacts.appendChild(dt);

            const { value, note } = splitFact(raw);
            const dd = document.createElement('dd');
            dd.textContent = value;
            if (note) {
                const noteEl = document.createElement('span');
                noteEl.className = 'fact-note';
                noteEl.textContent = note;
                dd.appendChild(noteEl);
            }
            infoFacts.appendChild(dd);
        }

        infoBlurb.textContent = info.blurb || '';
        infoBlurb.hidden = !info.blurb;

        card.classList.add('is-open');
    }

    function hideInfo() {
        card.classList.remove('is-open');
    }

    let hintDimmed = false;

    /** The hint has done its job once the user focuses anything (or after 10 s). */
    function dimHint() {
        if (hintDimmed) return;
        hintDimmed = true;
        dockHint.classList.add('is-dim');
    }

    window.setTimeout(dimHint, 10000);

    function handleFocusChange(key) {
        setDockActive(key);
        dimHint();
        if (key === null || key === undefined) hideInfo();
        else showInfo(key);
    }

    const previousFocusHandler = cameraRig.onFocusChange;
    cameraRig.onFocusChange = (key) => {
        if (typeof previousFocusHandler === 'function') previousFocusHandler(key);
        handleFocusChange(key);
    };

    hud.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-action]');
        if (!trigger || !hud.contains(trigger)) return;
        event.stopPropagation();

        switch (trigger.dataset.action) {
            case 'focus': {
                const key = trigger.dataset.key || null;
                if (key === null) cameraRig.focus(null);
                else cameraRig.focus(cameraRig.focusedKey === key ? null : key);
                break;
            }
            case 'play':
                timeEngine.togglePlay();
                syncPlayButton();
                break;
            case 'now':
                timeEngine.resetToNow();
                syncClock();
                break;
            case 'toggle': {
                const name = trigger.dataset.toggle;
                toggleState[name] = !toggleState[name];
                trigger.classList.toggle('is-on', toggleState[name]);
                trigger.setAttribute('aria-pressed', String(toggleState[name]));
                callToggle(name, toggleState[name]);
                break;
            }
            case 'close-info':
                cameraRig.focus(null);
                break;
        }
    });

    hud.addEventListener('input', (event) => {
        if (event.target !== scaleSlider) return;
        timeEngine.setScale(sliderToScale(Number(scaleSlider.value)));
        syncScaleLabel();
        syncSliderFill();
    });

    hud.addEventListener('change', (event) => {
        if (event.target !== jumpInput) return;
        // The field is authored in UTC, so parse it as UTC.
        const parsed = new Date(`${jumpInput.value}Z`);
        if (Number.isNaN(parsed.getTime())) return;
        timeEngine.jumpToDate(parsed);
        syncClock();
    });

    window.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.key !== ' ') return;
        const tag = event.target && event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
        event.preventDefault();
        timeEngine.togglePlay();
        syncPlayButton();
    });

    // ---------------------------------------------------------- initial state
    scaleSlider.value = String(scaleToSlider(timeEngine.scale));
    syncScaleLabel();
    syncSliderFill();
    syncPlayButton();
    syncClock();
    setDockActive(cameraRig.focusedKey);
    for (const [key] of TOGGLE_DEFS) callToggle(key, true);

    setInterval(() => {
        syncClock();
        if ((timeEngine.playing !== false) === playButton.classList.contains('is-paused')) {
            syncPlayButton();
        }
    }, 250);
}
