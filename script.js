/* ================================================================
   PACK PRINT PROJECT — Valko Paw Wall
   script.js

   Architecture
   ------------
   All data reads/writes go through StorageLayer.
   To connect Supabase: fill in SUPABASE_URL + SUPABASE_ANON_KEY
   and the async methods will automatically switch to the real API.
   ================================================================ */

'use strict';

/* ================================================================
   SUPABASE CONFIG
   Fill in your project URL and anon key to enable the real backend.
   Leave blank to use localStorage demo mode.
   ================================================================ */
const SUPABASE_URL      = 'https://tatnoxwdmiktiydmrmky.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yhoJ43tgGU8wl2N27k3fkw_jQS_3Mh0';

const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/* ================================================================
   STORAGE LAYER
   Async-first. Falls back to localStorage when Supabase is not
   configured. Swap only this object to change the backend.
   ================================================================ */
const StorageLayer = {
  STORAGE_KEY: 'packPrintProject_paws_v3',

  /** Return all visible paw entries, oldest first */
  async getAll() {
    // Fetches minimal fields — used by world map + counter (not for wall rendering)
    if (USE_SUPABASE) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/paw_entries?order=created_at.asc&limit=100000&select=id,created_at,country_code,country_name`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        const rows = await res.json();
        return rows.map(r => this._normaliseRow(r));
      } catch (err) {
        console.warn('Supabase read failed, using localStorage:', err);
      }
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  /** Paginated full paw data — used by the wall renderer */
  async getPaws(offset = 0, limit = 100) {
    if (USE_SUPABASE) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/paw_entries?order=created_at.asc&limit=${limit}&offset=${offset}&select=*`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        const rows = await res.json();
        return rows.map(r => this._normaliseRow(r));
      } catch (err) {
        console.warn('Supabase getPaws failed:', err);
        return [];
      }
    }
    const all = await this.getAll();
    return all.slice(offset, offset + limit);
  },

  /** Total entry count — efficient single query */
  async getCount() {
    if (USE_SUPABASE) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/paw_entries?select=id&limit=1`,
          { headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'count=exact',
          }}
        );
        const range = res.headers.get('Content-Range'); // e.g. "0-0/2000"
        return parseInt(range?.split('/')[1] ?? '0', 10) || 0;
      } catch { return 0; }
    }
    return (await this.getAll()).length;
  },

  /** Persist a new entry and return the saved object */
  async add(entry) {
    if (USE_SUPABASE) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/paw_entries`,
          {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              name:          entry.hunterName,
              country_code:  entry.countryCode  || null,
              country_name:  entry.countryName  || null,
              message:       entry.message      || null,
            }),
          }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        const [row] = await res.json();
        return this._normaliseRow(row);
      } catch (err) {
        console.warn('Supabase write failed:', err);
        throw new Error('CONNECTION_ERROR');
      }
    }

    // localStorage fallback (only used when Supabase is not configured)
    const all = await this.getAll();
    const saved = {
      id:          `paw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp:   Date.now(),
      hunterName:  entry.hunterName,
      hunterNumber: entry.hunterNumber || '',
      countryCode: entry.countryCode   || '',
      countryName: entry.countryName   || '',
      message:     entry.message       || '',
      origin:      entry.origin        || '',
    };
    all.push(saved);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    return saved;
  },

  /** Normalise a Supabase row to match the local schema */
  _normaliseRow(row) {
    return {
      id:           row.id,
      timestamp:    Date.parse(row.created_at),
      hunterName:   row.name,
      hunterNumber: row.id ? `#${String(row.id).padStart(5, '0')}` : '',
      countryCode:  row.country_code || '',
      countryName:  row.country_name || '',
      message:      row.message      || '',
      origin:       '',
    };
  },

  /** Seed the wall with the founding entry if empty (localStorage only) */
  async seedIfEmpty() {
    if (USE_SUPABASE) return;
    const all = await this.getAll();
    if (all.length > 0) return;

    const demo = [
      { hunterName: 'Wishy ✦', hunterNumber: '#00001', countryCode: 'DE', countryName: 'Germany', message: 'We only had a few glimpses but somehow, we saw an entire YOU, Valko. Every glance, gesture and tiny detail gave us another piece of you to carry into our art and stories. For us, you never left. And I\'m confident, you\'ll come back. <3', origin: 'Gamescom' },
    ];

    demo.forEach((d, i) => {
      const saved = { id: `seed_${i}`, timestamp: Date.now(), ...d };
      const all2 = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      all2.push(saved);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all2));
    });
  },
};


/* ================================================================
   COUNTRY DATA
   Compact list of countries with ISO-3166-1 alpha-2 codes.
   ================================================================ */
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' }, { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' }, { code: 'KW', name: 'Kuwait' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MY', name: 'Malaysia' }, { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' }, { code: 'MD', name: 'Moldova' }, { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' },
  { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' }, { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' }, { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
];

/** Returns an emoji flag for an ISO 3166-1 alpha-2 country code */
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}


/* ================================================================
   PAW WALL RENDERER — horizontal flex scroll + mosaic wall modes
   ================================================================ */
const PawWallRenderer = {
  track: null,
  mosaic: null,
  mosaicViewport: null,
  mode: 'scroll', // 'scroll' | 'mosaic'

  // Pagination state
  _pawOffset: 0,
  _allLoaded: false,
  _loadingMore: false,
  PAW_BATCH: 100,

  // Pan state for mosaic
  _panX: 0,
  _panY: 0,
  _canvasW: 0,
  _canvasH: 0,

  init() {
    this.track         = document.getElementById('paw-wall-track');
    this.mosaic        = document.getElementById('paw-wall-mosaic');
    this.mosaicViewport = document.getElementById('paw-wall-mosaic-viewport');
    this.render();
    this.initDragScroll();
    this.initArrows();
    this.initModeSwitcher();
    this.initSearch();
    this.initMosaicPan();
  },

  async render() {
    if (!this.track) return;

    // Reset pagination
    this._pawOffset = 0;
    this._allLoaded = false;

    const [entries, total] = await Promise.all([
      StorageLayer.getPaws(0, this.PAW_BATCH),
      StorageLayer.getCount(),
    ]);

    this._pawOffset = entries.length;
    if (entries.length < this.PAW_BATCH) this._allLoaded = true;

    this.track.innerHTML  = '';
    if (this.mosaic) this.mosaic.innerHTML = '';

    entries.forEach((entry, i) => {
      const scrollEl  = this.createPawElement(entry, i);
      this.track.appendChild(scrollEl);

      if (this.mosaic) {
        const mosaicEl = this.createPawElement(entry, i);
        this.mosaic.appendChild(mosaicEl);
      }
    });

    this.updateCounter(total);
    requestAnimationFrame(() => this.layoutMosaic());
  },

  async loadMore() {
    if (this._allLoaded || this._loadingMore || !this.track) return;
    this._loadingMore = true;

    const entries = await StorageLayer.getPaws(this._pawOffset, this.PAW_BATCH);
    if (entries.length < this.PAW_BATCH) this._allLoaded = true;

    const base = this._pawOffset;
    entries.forEach((entry, i) => {
      const scrollEl = this.createPawElement(entry, base + i);
      this.track.appendChild(scrollEl);
      if (this.mosaic) {
        const mosaicEl = this.createPawElement(entry, base + i);
        this.mosaic.appendChild(mosaicEl);
      }
    });

    this._pawOffset += entries.length;
    this._loadingMore = false;

    if (this.mode === 'mosaic') requestAnimationFrame(() => this.layoutMosaic());
  },

  /**
   * Randomly positions every paw entry in the fixed mosaic container.
   * Uses a seeded pseudo-random approach (index-based) so positions are
   * stable across re-renders.  Packs paws loosely: each one is placed at
   * a random spot, nudged slightly so they cluster naturally.
   */
  layoutMosaic() {
    if (!this.mosaic || !this.mosaicViewport) return;
    const items = this.mosaic.querySelectorAll('.paw-entry');
    if (!items.length) return;

    const VW = this.mosaicViewport.clientWidth  || 900;
    const VH = this.mosaicViewport.clientHeight || 520;

    // Canvas is bigger than the viewport — grows with entry count
    // ~6 cols of 130px, rows of 130px, minimum = 2× viewport
    const CARD_W = 100, CARD_H = 120, PAD = 24;
    const cols   = Math.max(6, Math.ceil(Math.sqrt(items.length * 1.6)));
    const rows   = Math.ceil(items.length / cols) + 1;
    const CW     = Math.max(VW * 2, cols * (CARD_W + PAD) + PAD);
    const CH     = Math.max(VH * 2, rows * (CARD_H + PAD) + PAD);

    this._canvasW = CW;
    this._canvasH = CH;
    this.mosaic.style.width  = `${CW}px`;
    this.mosaic.style.height = `${CH}px`;

    // Start pan centred
    this._panX = -(CW - VW) / 2;
    this._panY = -(CH - VH) / 2;
    this._applyPan();

    items.forEach((el, i) => {
      // Deterministic "random" using two prime multipliers on the index
      const rx  = ((i * 2357 + 431)  % 1000) / 1000;
      const ry  = ((i * 1753 + 877)  % 1000) / 1000;
      const rdx = ((i * 3001 + 199)  % 1000) / 1000;
      const rdy = ((i * 1301 + 761)  % 1000) / 1000;
      const rdd = ((i * 1117 + 503)  % 1000) / 1000;

      const x = PAD + rx * (CW - CARD_W - PAD * 2);
      const y = PAD + ry * (CH - CARD_H - PAD * 2);

      const driftX = (rdx - 0.5) * 14;
      const driftY = (rdy - 0.5) * 16;
      const dur    = 10 + rdd * 8;

      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.setProperty('--drift-x',     `${driftX}px`);
      el.style.setProperty('--drift-y',     `${driftY}px`);
      el.style.setProperty('--drift-dur',   `${dur}s`);
      el.style.setProperty('--drift-delay', `${-(rdd * dur).toFixed(1)}s`);
    });
  },

  _applyPan() {
    if (!this.mosaic || !this.mosaicViewport) return;
    const VW = this.mosaicViewport.clientWidth;
    const VH = this.mosaicViewport.clientHeight;
    // Clamp so canvas never leaves viewport edge
    const minX = -(this._canvasW - VW);
    const minY = -(this._canvasH - VH);
    this._panX = Math.min(0, Math.max(minX, this._panX));
    this._panY = Math.min(0, Math.max(minY, this._panY));
    this.mosaic.style.transform = `translate(${this._panX}px, ${this._panY}px)`;
  },

  /* ---- Mosaic pan (drag in all directions like a map) ---- */
  initMosaicPan() {
    const vp = this.mosaicViewport;
    if (!vp) return;

    let isDown = false, lastX = 0, lastY = 0;

    const start = (x, y) => {
      isDown = true; lastX = x; lastY = y;
      vp.classList.add('panning');
    };
    const move = (x, y) => {
      if (!isDown) return;
      this._panX += x - lastX;
      this._panY += y - lastY;
      lastX = x; lastY = y;
      this._applyPan();
    };
    const end = () => { isDown = false; vp.classList.remove('panning'); };

    vp.addEventListener('mousedown',  (e) => { e.preventDefault(); start(e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    window.addEventListener('mouseup',   end);

    vp.addEventListener('touchstart', (e) => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    vp.addEventListener('touchmove',  (e) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    vp.addEventListener('touchend',   end);
  },

  /** Add a newly submitted entry at the right end without full re-render */
  async addEntry(entry) {
    if (!this.track) return;

    const index = this._pawOffset;
    this._pawOffset++;

    // Add to scroll wall
    const scrollEl = this.createPawElement(entry, index);
    scrollEl.style.animationDelay = '0ms';
    this.track.appendChild(scrollEl);

    // Add to mosaic wall
    if (this.mosaic) {
      const mosaicEl = this.createPawElement(entry, index);
      mosaicEl.style.animationDelay = '0ms';
      this.mosaic.appendChild(mosaicEl);
      requestAnimationFrame(() => this.layoutMosaic());
    }

    // Update counter with real total from DB
    const total = await StorageLayer.getCount();
    this.updateCounter(total);

    // Smooth scroll to reveal the new paw (scroll mode only)
    if (this.mode === 'scroll') {
      setTimeout(() => {
        this.track.scrollTo({ left: this.track.scrollWidth, behavior: 'smooth' });
      }, 400);
    }
  },

  createPawElement(entry, index) {
    const PAW_SIZES = [44, 50, 56, 48, 52, 46];
    const size = PAW_SIZES[index % PAW_SIZES.length];

    // Deterministic gentle tilt per entry
    const tiltSeed = ((index * 137 + 42) % 100) / 100; // 0–1
    const rotation = (tiltSeed - 0.5) * 12; // ±6 degrees

    const el = document.createElement('div');
    el.className = `paw-entry${entry.origin === 'Gamescom' ? ' origin-gamescom' : ' origin-afar'}`;
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', `Paw entry by ${entry.hunterName}`);
    el.setAttribute('tabindex', '0');
    el.setAttribute('data-name', (entry.hunterName || '').toLowerCase());
    el.setAttribute('data-number', (entry.hunterNumber || '').toLowerCase());
    el.style.setProperty('--rotation', `${rotation}deg`);
    el.style.setProperty('--stamp-delay', `${Math.min(index * 30, 600)}ms`);
    el.style.setProperty('--bob-delay',   `${Math.min(index * 30, 600) + 500 + (index * 317 % 2000)}ms`);

    const flag = entry.countryCode ? countryFlag(entry.countryCode) : '';

    el.innerHTML = `
      <div class="paw-img-wrap">
        <img src="assets/images/paw.png" alt="" width="${size}" height="${size}" loading="lazy" />
      </div>
      <span class="paw-entry-name">${escapeHtml(entry.hunterName)}</span>
      ${flag ? `<span class="paw-entry-flag" aria-label="${escapeHtml(entry.countryName || '')}">${flag}</span>` : ''}
      ${entry.hunterNumber ? `<span class="paw-entry-number">${escapeHtml(entry.hunterNumber)}</span>` : ''}
    `;

    const openDetail = (e) => {
      e.stopPropagation();
      PawDetail.open(entry);
    };
    el.addEventListener('click', openDetail);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(e); }
    });

    return el;
  },

  updateCounter(count) {
    const el = document.getElementById('paw-count');
    if (!el) return;
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent = count;
    if (count !== prev) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 400);
    }
  },

  /* ---- Drag-scroll ---- */
  initDragScroll() {
    const track = this.track;
    if (!track) return;
    let isDown = false, startX = 0, scrollStart = 0;

    const onDown = (x) => { isDown = true; startX = x; scrollStart = track.scrollLeft; this._autoScrollPaused = true; };
    const onMove = (x) => {
      if (!isDown) return;
      track.scrollLeft = scrollStart - (x - startX);
    };
    const onUp = () => { isDown = false; this._autoScrollPaused = false; };

    // Mouse
    track.addEventListener('mousedown',  (e) => onDown(e.pageX));
    track.addEventListener('mousemove',  (e) => onMove(e.pageX));
    track.addEventListener('mouseup',    onUp);
    track.addEventListener('mouseleave', onUp);

    // Touch
    track.addEventListener('touchstart', (e) => onDown(e.touches[0].pageX), { passive: true });
    track.addEventListener('touchmove',  (e) => onMove(e.touches[0].pageX), { passive: true });
    track.addEventListener('touchend',   onUp);

    // Infinite scroll: load more paws when near the right end
    track.addEventListener('scroll', () => {
      if (this._allLoaded || this._loadingMore) return;
      if (track.scrollLeft + track.clientWidth > track.scrollWidth - 600) {
        this.loadMore();
      }
    }, { passive: true });
  },

  /* ---- Arrow buttons ---- */
  initArrows() {
    const track = this.track;
    document.getElementById('wall-left')?.addEventListener('click', () => {
      track?.scrollBy({ left: -340, behavior: 'smooth' });
    });
    document.getElementById('wall-right')?.addEventListener('click', () => {
      track?.scrollBy({ left: 340, behavior: 'smooth' });
    });
  },

  /* ---- Auto-scroll (slow drift in scroll mode) ---- */
  _autoScrollRAF: null,
  _autoScrollPaused: false,

  startAutoScroll() {
    this.stopAutoScroll(); // clear any existing loop
    const track = this.track;
    if (!track) return;

    // Pause on hover or active drag
    const pause  = () => { this._autoScrollPaused = true;  };
    const resume = () => { this._autoScrollPaused = false; };
    track.addEventListener('mouseenter',  pause,  { passive: true });
    track.addEventListener('mouseleave',  resume, { passive: true });
    track.addEventListener('touchstart',  pause,  { passive: true });
    track.addEventListener('touchend',    resume, { passive: true });

    // Start at right end so paws immediately flow right → left
    track.scrollLeft = track.scrollWidth;

    const SPEED = 0.7; // px per frame
    const tick = () => {
      if (!this._autoScrollPaused && this.mode === 'scroll') {
        track.scrollLeft -= SPEED;
        // Seamless loop: when we reach the start, jump back to end
        if (track.scrollLeft <= 1) {
          track.scrollLeft = track.scrollWidth - track.clientWidth;
        }
      }
      this._autoScrollRAF = requestAnimationFrame(tick);
    };
    this._autoScrollRAF = requestAnimationFrame(tick);
  },

  stopAutoScroll() {
    if (this._autoScrollRAF) {
      cancelAnimationFrame(this._autoScrollRAF);
      this._autoScrollRAF = null;
    }
  },

  /* ---- Mode switcher ---- */
  initModeSwitcher() {
    const section    = document.getElementById('paw-wall');
    const btnScroll  = document.getElementById('mode-scroll');
    const btnMosaic  = document.getElementById('mode-mosaic');
    const zoomWrap   = document.getElementById('wall-zoom-controls');
    const btnZoomIn  = document.getElementById('zoom-in');
    const btnZoomOut = document.getElementById('zoom-out');
    const btnZoomRst = document.getElementById('zoom-reset');
    if (!section || !btnScroll || !btnMosaic) return;

    // Zoom state
    let zoomLevel = 1.0;
    const ZOOM_STEP = 0.15;
    const ZOOM_MIN  = 0.4;
    const ZOOM_MAX  = 2.5;

    const applyZoom = () => {
      if (this.mosaic) this.mosaic.style.transform = `scale(${zoomLevel})`;
      if (btnZoomRst) btnZoomRst.textContent = `${Math.round(zoomLevel * 100)}%`;
    };

    if (btnZoomIn)  btnZoomIn.addEventListener('click',  () => { zoomLevel = Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2)); applyZoom(); });
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => { zoomLevel = Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2)); applyZoom(); });
    if (btnZoomRst) btnZoomRst.addEventListener('click', () => { zoomLevel = 1.0; applyZoom(); });

    const activate = (mode) => {
      this.mode = mode;
      // Update button states
      btnScroll.classList.toggle('active', mode === 'scroll');
      btnMosaic.classList.toggle('active', mode === 'mosaic');
      btnScroll.setAttribute('aria-pressed', String(mode === 'scroll'));
      btnMosaic.setAttribute('aria-pressed', String(mode === 'mosaic'));
      // Show/hide via data attribute (CSS uses [data-wall-mode])
      section.setAttribute('data-wall-mode', mode);
      // Zoom controls only in mosaic mode
      if (zoomWrap) zoomWrap.hidden = (mode !== 'mosaic');
      // Accessibility
      const scrollWrap = document.getElementById('paw-wall-scroll-wrap');
      const mosaicWrap = document.getElementById('paw-wall-mosaic-wrap');
      if (scrollWrap) scrollWrap.setAttribute('aria-hidden', String(mode !== 'scroll'));
      if (mosaicWrap) mosaicWrap.setAttribute('aria-hidden', String(mode !== 'mosaic'));
      // Auto-scroll: run in scroll mode, layout mosaic when switching to mosaic
      if (mode === 'scroll') {
        this.startAutoScroll();
      } else {
        this.stopAutoScroll();
        // Re-layout now that the container is visible and has real dimensions
        requestAnimationFrame(() => this.layoutMosaic());
      }
    };

    // Default: scroll mode
    activate('scroll');

    btnScroll.addEventListener('click', () => activate('scroll'));
    btnMosaic.addEventListener('click', () => activate('mosaic'));
  },

  initSearch() {
    const input = document.getElementById('paw-search');
    const dropdown = document.getElementById('paw-search-results');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => this.updateSearchDropdown(input.value, dropdown));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { input.value = ''; this.closeDropdown(dropdown); }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.paw-search-inner')) this.closeDropdown(dropdown);
    });
  },

  updateSearchDropdown(query, dropdown) {
    const q = query.trim().toLowerCase();
    if (!q) { this.closeDropdown(dropdown); return; }

    // Collect unique entries from scroll track (source of truth)
    const entries = Array.from(this.track.querySelectorAll('.paw-entry'));
    const matches = entries.filter(el =>
      el.dataset.name.includes(q) || el.dataset.number.includes(q)
    );

    if (!matches.length) {
      dropdown.innerHTML = '<div class="paw-search-empty">No paws found</div>';
      dropdown.hidden = false;
      return;
    }

    dropdown.innerHTML = matches.slice(0, 8).map((el, i) => {
      const name = el.querySelector('.paw-entry-name')?.textContent || '';
      const flag = el.querySelector('.paw-entry-flag')?.textContent || '';
      const num  = el.querySelector('.paw-entry-number')?.textContent || '';
      return `<button class="paw-search-result" data-index="${entries.indexOf(el)}" tabindex="0">
        <span class="psr-flag">${flag}</span>
        <span class="psr-name">${name}</span>
        ${num ? `<span class="psr-num">${num}</span>` : ''}
      </button>`;
    }).join('');

    dropdown.querySelectorAll('.paw-search-result').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.jumpToEntry(entries[idx]);
        document.getElementById('paw-search').value = '';
        this.closeDropdown(dropdown);
      });
    });

    dropdown.hidden = false;
  },

  jumpToEntry(el) {
    // Find the same paw in the mosaic by name+number
    const name   = el.dataset.name;
    const number = el.dataset.number;
    const mosaicEl = this.mosaic
      ? this.mosaic.querySelector(`.paw-entry[data-name="${name}"][data-number="${number}"]`)
      : null;

    // Highlight in both containers
    const highlight = (target) => {
      if (!target) return;
      target.classList.remove('paw-entry--found');
      void target.offsetWidth; // force reflow to restart animation
      target.classList.add('paw-entry--found');
      setTimeout(() => target.classList.remove('paw-entry--found'), 3000);
    };

    if (this.mode === 'scroll') {
      // Scroll to entry in track
      const track = this.track;
      this._autoScrollPaused = true;
      track.scrollTo({ left: el.offsetLeft - track.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
      setTimeout(() => { highlight(el); this._autoScrollPaused = false; }, 300);
    } else {
      // Mosaic mode — pan canvas so the paw is centred in the viewport
      if (mosaicEl && this.mosaicViewport) {
        const VW = this.mosaicViewport.clientWidth;
        const VH = this.mosaicViewport.clientHeight;
        const targetX = parseFloat(mosaicEl.style.left) || 0;
        const targetY = parseFloat(mosaicEl.style.top)  || 0;
        this._panX = -(targetX - VW / 2 + 50);
        this._panY = -(targetY - VH / 2 + 55);
        this._applyPan();
      }
      highlight(mosaicEl);
    }
    // Always pre-highlight the counterpart so it glows when user switches mode
    setTimeout(() => highlight(this.mode === 'scroll' ? mosaicEl : el), 200);
  },

  closeDropdown(dropdown) {
    dropdown.hidden = true;
    dropdown.innerHTML = '';
  },
};


/* ================================================================
   WORLD GLOBE
   Canvas-based rotating orthographic globe with country dots.
   ================================================================ */
const WorldMap = {
  /* Country lat/lon coordinates */
  COORDS: {
    AF:[33.9,67.7],   AL:[41.2,20.2],   DZ:[28.0,1.7],    AR:[-38.4,-63.6],
    AM:[40.1,45.0],   AU:[-25.3,133.8], AT:[47.5,14.6],   AZ:[40.1,47.6],
    BH:[26.0,50.6],   BD:[23.7,90.4],   BY:[53.7,27.9],   BE:[50.5,4.5],
    BO:[-16.3,-63.6], BA:[43.9,17.7],   BR:[-14.2,-51.9], BG:[42.7,25.5],
    CA:[60.0,-95.0],  CL:[-35.7,-71.5], CN:[35.9,104.2],  CO:[4.6,-74.1],
    HR:[45.1,15.2],   CY:[35.1,33.4],   CZ:[49.8,15.5],   DK:[56.3,9.5],
    EC:[-1.8,-78.2],  EG:[26.8,30.8],   EE:[58.6,25.0],   FI:[61.9,25.7],
    FR:[46.2,2.2],    GE:[42.3,43.4],   DE:[51.2,10.5],   GH:[7.9,-1.0],
    GR:[39.1,21.8],   HK:[22.4,114.1],  HU:[47.2,19.5],   IN:[20.6,79.0],
    ID:[-0.8,113.9],  IE:[53.1,-8.2],   IL:[31.0,35.0],   IT:[42.8,12.6],
    JP:[36.2,138.3],  JO:[30.6,36.2],   KZ:[48.0,68.0],   KE:[-1.3,36.8],
    KW:[29.3,47.7],   LV:[56.9,24.6],   LB:[33.9,35.9],   LT:[55.2,23.9],
    LU:[49.8,6.1],    MY:[4.2,108.0],   MT:[35.9,14.4],   MX:[23.6,-102.6],
    MD:[47.4,28.4],   MA:[31.8,-7.1],   NL:[52.1,5.3],    NZ:[-40.9,174.9],
    NG:[9.1,8.7],     MK:[41.6,21.7],   NO:[60.5,8.5],    PK:[30.4,69.3],
    PE:[-9.2,-75.0],  PH:[12.9,121.8],  PL:[51.9,19.1],   PT:[39.4,-8.2],
    QA:[25.4,51.2],   RO:[45.9,24.7],   RU:[61.5,105.3],  SA:[24.0,45.0],
    RS:[44.0,21.0],   SG:[1.4,103.8],   SK:[48.7,19.7],   SI:[46.2,14.9],
    ZA:[-30.6,22.9],  KR:[35.9,127.8],  ES:[40.5,-3.7],   SE:[60.1,18.6],
    CH:[46.8,8.2],    TW:[23.7,121.0],  TH:[15.9,100.9],  TR:[38.9,35.2],
    UA:[48.4,31.2],   AE:[23.4,53.8],   GB:[55.4,-3.4],   US:[37.1,-95.7],
    UY:[-32.5,-55.8], VE:[6.4,-66.6],   VN:[14.1,108.3],
  },

  /* Simplified continent polygons as [lat, lon] arrays */
  LAND: [
    // North America
    [[71,-156],[70,-141],[68,-137],[60,-137],[56,-132],[50,-128],[48,-124],[46,-124],[42,-124],[38,-122],[34,-120],[30,-116],[28,-110],[26,-110],[22,-106],[20,-105],[16,-92],[14,-88],[8,-78],[10,-75],[12,-70],[16,-62],[18,-66],[20,-74],[22,-72],[24,-74],[26,-78],[28,-80],[32,-80],[35,-76],[38,-75],[42,-70],[44,-66],[46,-64],[48,-54],[52,-56],[56,-62],[60,-64],[66,-68],[72,-74],[76,-82],[80,-90],[76,-110],[72,-120],[70,-132],[70,-141]],
    // Central America & Caribbean (separate)
    [[8,-77],[10,-84],[14,-92],[16,-92],[20,-87],[24,-84],[20,-87],[16,-88],[12,-84],[8,-77]],
    // South America
    [[12,-72],[10,-62],[8,-60],[4,-52],[2,-50],[0,-50],[-5,-36],[-10,-36],[-15,-39],[-20,-40],[-23,-43],[-26,-48],[-30,-51],[-33,-56],[-38,-62],[-42,-65],[-46,-67],[-52,-70],[-55,-67],[-53,-72],[-47,-74],[-42,-73],[-36,-72],[-28,-70],[-18,-70],[-12,-76],[-6,-80],[0,-78],[4,-78],[8,-78],[12,-72]],
    // Europe
    [[36,-6],[38,-9],[44,-8],[44,-2],[44,4],[50,8],[51,3],[52,4],[53,0],[55,-1],[57,2],[58,6],[56,10],[54,10],[54,18],[56,22],[58,24],[60,25],[60,28],[64,26],[68,28],[70,26],[68,20],[65,16],[60,17],[58,12],[54,18],[50,14],[47,9],[44,8],[42,14],[40,18],[38,16],[38,12],[40,10],[36,-6]],
    // Scandinavia
    [[56,10],[58,5],[60,5],[62,5],[64,8],[66,14],[68,18],[70,22],[72,26],[70,28],[68,20],[65,16],[60,17],[58,12],[56,14],[56,10]],
    // Finland/Kola
    [[60,28],[62,28],[65,28],[68,28],[70,28],[72,28],[70,30],[68,32],[65,30],[62,30],[60,28]],
    // Great Britain
    [[50,-5],[52,-4],[54,-3],[56,-2],[58,-4],[58,-6],[56,-6],[54,-3],[52,-4],[50,-5]],
    // Ireland
    [[52,-6],[54,-6],[54,-8],[52,-10],[51,-10],[52,-6]],
    // Iceland
    [[64,-22],[65,-18],[65,-14],[64,-13],[63,-17],[63,-22],[64,-22]],
    // Africa
    [[37,10],[36,12],[32,12],[28,34],[22,38],[12,44],[12,46],[4,40],[0,42],[-4,40],[-10,40],[-16,36],[-20,35],[-25,33],[-34,26],[-35,20],[-30,30],[-20,35],[-12,40],[-8,40],[-4,36],[0,10],[4,8],[4,2],[4,-2],[6,-4],[4,-8],[14,-16],[16,-16],[20,-16],[26,-14],[32,-16],[36,-6],[37,10]],
    // Madagascar
    [[-12,49],[-16,50],[-20,48],[-24,44],[-20,44],[-16,46],[-12,49]],
    // Asia (mainland)
    [[70,30],[70,50],[72,70],[72,100],[65,110],[55,90],[50,80],[46,60],[40,55],[36,40],[38,36],[42,38],[46,40],[50,52],[56,60],[54,78],[52,88],[48,138],[44,142],[40,132],[36,122],[24,120],[20,110],[10,100],[5,100],[0,104],[2,110],[6,118],[0,108],[0,104],[5,100],[10,100],[15,105],[20,106],[22,100],[26,95],[28,88],[24,88],[20,73],[8,77],[12,80],[16,82],[22,87],[26,92],[28,96],[28,98],[26,96],[22,92],[18,84],[14,80],[10,78],[8,76],[8,78],[12,80],[8,78],[8,76],[10,74],[16,74],[20,72],[22,68],[26,62],[28,60],[30,48],[28,50],[26,52],[24,56],[22,60],[20,58],[12,44],[28,34],[32,36],[36,36],[38,36],[40,36],[42,40],[46,40],[50,52],[65,42],[68,44],[70,50],[70,30]],
    // Indian subcontinent
    [[26,62],[28,68],[26,72],[22,68],[18,72],[14,74],[8,76],[10,78],[14,80],[18,82],[22,88],[26,92],[28,96],[28,92],[26,88],[24,88],[22,88],[20,86],[18,84],[14,80],[10,78],[8,78],[8,76],[10,74],[14,72],[18,72],[22,68],[26,64],[28,64],[28,60],[30,48],[26,52],[24,56],[22,60],[20,58],[22,60],[24,56],[26,62]],
    // Southeast Asia (Indochina)
    [[22,100],[20,100],[16,100],[12,100],[8,100],[4,100],[2,104],[0,104],[2,110],[6,116],[10,120],[16,108],[20,106],[22,100]],
    // Indonesia (Sumatra)
    [[6,96],[4,96],[2,100],[0,104],[2,106],[4,106],[6,98],[6,96]],
    // Indonesia (Borneo)
    [[8,114],[4,116],[0,110],[0,116],[2,116],[4,118],[6,118],[8,114]],
    // Japan (Honshu)
    [[31,130],[33,131],[35,136],[36,140],[38,142],[40,140],[38,138],[36,136],[34,132],[31,130]],
    // Japan (Hokkaido)
    [[42,140],[42,143],[44,143],[44,141],[42,140]],
    // Australia
    [[-14,128],[-12,136],[-12,142],[-16,146],[-20,148],[-28,154],[-32,152],[-38,148],[-38,140],[-35,136],[-32,128],[-22,114],[-16,122],[-14,128]],
    // New Zealand (North Island)
    [[-36,174],[-38,178],[-40,176],[-38,174],[-36,174]],
    // New Zealand (South Island)
    [[-40,172],[-44,168],[-46,168],[-46,170],[-44,170],[-42,172],[-40,172]],
    // Greenland
    [[60,-44],[64,-42],[68,-24],[72,-22],[78,-20],[82,-36],[82,-50],[78,-70],[72,-58],[66,-52],[60,-44]],
    // New Guinea
    [[-4,134],[-2,138],[0,140],[-2,142],[-4,140],[-6,134],[-4,134]],
    // Philippines (Luzon)
    [[14,120],[16,122],[18,122],[18,120],[16,120],[14,120]],
    // Sri Lanka
    [[10,80],[8,80],[8,82],[10,82],[10,80]],
    // Taiwan
    [[22,120],[24,122],[26,122],[24,120],[22,120]],
  ],

  /* State */
  canvas: null,
  ctx: null,
  lon0: 20,
  lat0: 18,
  raf: null,
  speed: 0.12,
  dots: [],
  isDragging: false,
  dragStartX: 0,
  dragLon0: 0,

  /* Orthographic projection */
  project(lat, lon) {
    const phi  = lat * Math.PI / 180;
    const lam  = (lon - this.lon0) * Math.PI / 180;
    const tilt = this.lat0 * Math.PI / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const cosL = Math.cos(lam), sinL = Math.sin(lam);
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

    const x0 = cosP * sinL;
    const y0 = sinP;
    const z0 = cosP * cosL;
    const y  = y0 * cosT - z0 * sinT;
    const z  = y0 * sinT + z0 * cosT;

    const R  = Math.min(this.canvas.width, this.canvas.height) * 0.43;
    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 2;
    return { x: cx + R * x0, y: cy - R * y, visible: z >= 0, z, R, cx, cy };
  },

  draw() {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R  = Math.min(W, H) * 0.43;

    ctx.clearRect(0, 0, W, H);

    /* Ocean — lighter teal-slate */
    const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
    ocean.addColorStop(0, '#1e6060');
    ocean.addColorStop(0.6, '#0e3838');
    ocean.addColorStop(1, '#061e1e');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = ocean;
    ctx.fill();

    /* Grid lines */
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.strokeStyle = lat === 0 ? 'rgba(10,191,191,0.22)' : 'rgba(10,191,191,0.10)';
      ctx.beginPath();
      let mv = true;
      for (let lon = -180; lon <= 180; lon += 2) {
        const p = this.project(lat, lon);
        if (!p.visible) { mv = true; continue; }
        mv ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        mv = false;
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.strokeStyle = 'rgba(10,191,191,0.09)';
      ctx.beginPath();
      let mv = true;
      for (let lat = -80; lat <= 80; lat += 2) {
        const p = this.project(lat, lon);
        if (!p.visible) { mv = true; continue; }
        mv ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        mv = false;
      }
      ctx.stroke();
    }

    /* Continents — brighter fill */
    for (const poly of this.LAND) {
      ctx.beginPath();
      let mv = true, lastVis = false;
      for (const [lat, lon] of poly) {
        const p = this.project(lat, lon);
        if (p.visible) {
          (!mv && lastVis) ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
          mv = false; lastVis = true;
        } else { lastVis = false; }
      }
      ctx.closePath();
      ctx.fillStyle   = 'rgba(10,191,191,0.26)';
      ctx.strokeStyle = 'rgba(10,191,191,0.55)';
      ctx.lineWidth   = 0.7;
      ctx.fill();
      ctx.stroke();
    }

    /* Globe border */
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10,191,191,0.35)';
    ctx.lineWidth   = 1.4;
    ctx.stroke();

    /* Country dots */
    for (const dot of this.dots) {
      const p = this.project(dot.lat, dot.lon);
      if (!p.visible) continue;
      const dr    = 3.5;
      const color = '#0abfbf';
      const glow  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dr * 5);
      glow.addColorStop(0, 'rgba(10,191,191,0.5)');
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, dr * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, dr, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    /* Atmosphere rim */
    const atm = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.06);
    atm.addColorStop(0, 'transparent');
    atm.addColorStop(1, 'rgba(10,191,191,0.14)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2);
    ctx.fillStyle = atm;
    ctx.fill();
  },

  animate() {
    if (!this.isDragging) {
      this.lon0 += this.speed;
      if (this.lon0 > 180) this.lon0 -= 360;
    }
    this.draw();
    this.raf = requestAnimationFrame(() => this.animate());
  },

  async init() {
    const mapEl   = document.getElementById('world-map');
    const statsEl = document.getElementById('world-stats');
    if (!mapEl) return;

    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }

    /* Canvas */
    mapEl.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;cursor:grab;';
    mapEl.appendChild(canvas);
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    /* Background floating paws */
    for (let i = 1; i <= 8; i++) {
      const s = document.createElement('span');
      s.className = `wmp wmp-${i}`;
      mapEl.appendChild(s);
    }

    const resize = () => {
      const rect = mapEl.getBoundingClientRect();
      const size = Math.min(rect.width, 520);
      canvas.width  = rect.width;
      canvas.height = size * 0.72;
      mapEl.style.minHeight = canvas.height + 'px';
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* Load data */
    const [entries, totalCount] = await Promise.all([
      StorageLayer.getAll(),
      StorageLayer.getCount(),
    ]);
    const countryMap = {};
    entries.forEach(e => {
      if (!e.countryCode) return;
      if (!countryMap[e.countryCode]) countryMap[e.countryCode] = { code: e.countryCode, name: e.countryName || e.countryCode, count: 0 };
      countryMap[e.countryCode].count++;
    });
    this.dots = Object.values(countryMap).map(c => {
      const coord = this.COORDS[c.code];
      if (!coord) return null;
      return { lat: coord[0], lon: coord[1], ...c };
    }).filter(Boolean);

    /* Stats */
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="world-stat">
          <span class="world-stat-number">${totalCount.toLocaleString()}</span>
          <span class="world-stat-label">Paws on the wall</span>
        </div>
        <div class="world-stat">
          <span class="world-stat-number">${Object.keys(countryMap).length}</span>
          <span class="world-stat-label">Countries represented</span>
        </div>`;
    }

    /* Drag to rotate */
    const startDrag = (x) => { this.isDragging = true; this.dragStartX = x; this.dragLon0 = this.lon0; canvas.style.cursor = 'grabbing'; };
    const moveDrag  = (x) => { if (this.isDragging) this.lon0 = this.dragLon0 - (x - this.dragStartX) * 0.35; };
    const endDrag   = ()  => { this.isDragging = false; canvas.style.cursor = 'grab'; };

    canvas.addEventListener('mousedown',  e => startDrag(e.clientX));
    window.addEventListener('mousemove',  e => moveDrag(e.clientX));
    window.addEventListener('mouseup',    endDrag);
    canvas.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
    canvas.addEventListener('touchmove',  e => moveDrag(e.touches[0].clientX),  { passive: true });
    canvas.addEventListener('touchend',   endDrag);

    this.animate();
  },
};


/* ================================================================
   COUNTRY AUTOCOMPLETE
   ================================================================ */
const CountrySelect = {
  selectedCode: '',
  selectedName: '',

  init() {
    const input    = document.getElementById('field-country');
    const listbox  = document.getElementById('country-listbox');
    const codeField = document.getElementById('field-country-code');
    const nameField = document.getElementById('field-country-name');
    if (!input || !listbox) return;

    let activeIndex = -1;

    const show = (items) => {
      listbox.innerHTML = '';
      activeIndex = -1;
      if (items.length === 0) { listbox.classList.remove('open'); return; }

      items.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = 'country-option';
        li.setAttribute('role', 'option');
        li.setAttribute('id', `country-opt-${i}`);
        li.innerHTML = `<span class="country-flag">${countryFlag(c.code)}</span> ${escapeHtml(c.name)}`;
        li.addEventListener('mousedown', () => this.select(c, input, listbox, codeField, nameField));
        listbox.appendChild(li);
      });
      listbox.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
    };

    const hide = () => {
      listbox.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
    };

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { hide(); return; }
      const matches = COUNTRIES.filter(c =>
        c.name.toLowerCase().startsWith(q) ||
        c.code.toLowerCase() === q
      ).slice(0, 8);
      show(matches);
      this.selectedCode = '';
      this.selectedName = '';
      codeField.value = '';
      nameField.value = '';
    });

    input.addEventListener('keydown', (e) => {
      const opts = listbox.querySelectorAll('.country-option');
      if (!listbox.classList.contains('open') || !opts.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, opts.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        opts[activeIndex].dispatchEvent(new Event('mousedown'));
      } else if (e.key === 'Escape') {
        hide();
      }
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === activeIndex)));
      if (activeIndex >= 0) input.setAttribute('aria-activedescendant', `country-opt-${activeIndex}`);
    });

    input.addEventListener('blur', () => setTimeout(hide, 150));
  },

  select(country, input, listbox, codeField, nameField) {
    this.selectedCode = country.code;
    this.selectedName = country.name;
    input.value = `${countryFlag(country.code)} ${country.name}`;
    codeField.value = country.code;
    nameField.value = country.name;
    listbox.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
  },

  reset() {
    this.selectedCode = '';
    this.selectedName = '';
    const input = document.getElementById('field-country');
    const codeField = document.getElementById('field-country-code');
    const nameField = document.getElementById('field-country-name');
    if (input) input.value = '';
    if (codeField) codeField.value = '';
    if (nameField) nameField.value = '';
  },
};


/* ================================================================
   PAW DETAIL OVERLAY
   ================================================================ */
const PawDetail = {
  overlay: null,

  init() {
    this.overlay = document.getElementById('paw-detail-overlay');
    document.getElementById('detail-close')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('active')) this.close();
    });
  },

  open(entry) {
    if (!this.overlay) return;

    const flag = entry.countryCode ? countryFlag(entry.countryCode) : '';
    const countryDisplay = entry.countryName ? `${flag} ${entry.countryName}` : '';

    document.getElementById('detail-name').textContent    = entry.hunterName;
    document.getElementById('detail-number').textContent  = entry.hunterNumber || '';
    document.getElementById('detail-country').textContent = countryDisplay;
    document.getElementById('detail-message').textContent = entry.message || '';
    document.getElementById('detail-origin').textContent  = entry.origin ? `Joining from ${entry.origin}` : '';

    document.getElementById('detail-number').style.display  = entry.hunterNumber  ? '' : 'none';
    document.getElementById('detail-country').style.display = countryDisplay      ? '' : 'none';
    document.getElementById('detail-message').style.display = entry.message       ? '' : 'none';
    document.getElementById('detail-origin').style.display  = entry.origin        ? '' : 'none';

    this.overlay.setAttribute('aria-hidden', 'false');
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('detail-close')?.focus();
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },
};


/* ================================================================
   FORM MODAL — with country selector, honeypot, cooldown
   ================================================================ */
const FormModal = {
  overlay: null,
  form: null,
  lastSubmit: 0,
  COOLDOWN_MS: 60_000,
  LS_KEY: 'packPrint_lastSubmit',

  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.form    = document.getElementById('paw-form');
    // Restore last submit time from localStorage so cooldown survives page reloads
    this.lastSubmit = parseInt(localStorage.getItem(this.LS_KEY) || '0', 10);

    document.getElementById('open-form-btn')?.addEventListener('click', () => this.open());

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('active')) this.close();
    });

    // Character counter
    const msgField    = document.getElementById('field-message');
    const charCounter = document.getElementById('char-counter');
    msgField?.addEventListener('input', () => {
      const len = msgField.value.length;
      charCounter.textContent = `${len} / 300`;
      charCounter.classList.toggle('near-limit', len >= 250 && len < 300);
      charCounter.classList.toggle('at-limit',   len >= 300);
    });

    this.form?.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
  },

  open() {
    if (!this.overlay) return;
    this.overlay.setAttribute('aria-hidden', 'false');
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('field-name')?.focus();
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.clearErrors();
  },

  clearErrors() {
    document.getElementById('error-name').textContent = '';
    document.getElementById('field-name')?.classList.remove('error');
    document.getElementById('form-cooldown').textContent = '';
  },

  async handleSubmit() {
    this.clearErrors();

    // Honeypot check
    if (document.getElementById('field-website')?.value) return;

    // Cooldown check
    const now = Date.now();
    if (now - this.lastSubmit < this.COOLDOWN_MS) {
      const remaining = Math.ceil((this.COOLDOWN_MS - (now - this.lastSubmit)) / 1000);
      document.getElementById('form-cooldown').textContent =
        `Please wait ${remaining}s before submitting again.`;
      return;
    }

    const hunterName   = document.getElementById('field-name').value.trim();
    const hunterNumber = document.getElementById('field-number').value.trim();
    const countryCode  = document.getElementById('field-country-code').value.trim();
    const countryName  = document.getElementById('field-country-name').value.trim();
    const message      = document.getElementById('field-message').value.trim();
    const origin       = '';

    // Validation
    if (!hunterName) {
      const errEl    = document.getElementById('error-name');
      const nameInput = document.getElementById('field-name');
      errEl.textContent = 'Hunter Name is required.';
      nameInput.classList.add('error');
      nameInput.focus();
      return;
    }

    // Basic content filter (catches the most obvious spam)
    if (containsSpam(message) || containsSpam(hunterName)) {
      document.getElementById('form-cooldown').textContent =
        'Your submission was flagged. Please keep messages respectful.';
      return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Adding…';

    try {
      const entry = { hunterName, hunterNumber, countryCode, countryName, message, origin };
      const saved = await StorageLayer.add(entry);

      this.lastSubmit = Date.now();
      localStorage.setItem(this.LS_KEY, String(this.lastSubmit));
      this.close();
      this.form.reset();
      CountrySelect.reset();
      document.getElementById('char-counter').textContent = '0 / 300';

      StampAnimation.play(() => {
        PawWallRenderer.addEntry(saved);
        document.getElementById('paw-wall')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Refresh world map and pack counter
        WorldMap.init();
        PackCountSection.updateLive();
      });
    } catch (err) {
      console.error(err);
      document.getElementById('form-cooldown').textContent =
        err.message === 'CONNECTION_ERROR'
          ? 'Could not connect — please check your internet and try again.'
          : 'Something went wrong. Please try again.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🐾</span> ADD MY PAW';
    }
  },
};

/** Expanded content filter — German + English profanity & hate speech */
function containsSpam(text) {
  if (!text) return false;
  // Normalise leet-speak substitutions before checking
  const lower = text.toLowerCase()
    .replace(/0/g,'o').replace(/@/g,'a').replace(/3/g,'e')
    .replace(/1/g,'i').replace(/!/g,'i').replace(/\$/g,'s');

  const BLOCKED = [
    // Links / injection
    'http://','https://','www.','<script','onclick','javascript:',
    // English
    'fuck','shit','cunt','bitch','asshole','nigger','nigga','faggot',
    'retard','whore','slut','bastard','motherfucker','kys',
    'kill yourself','rape','nazi','hitler',
    // German
    'hurensohn','wichser','wixer','arschloch','vollidiot',
    'schwuchtel','fotze','nutte','schlampe','pisser','drecksau',
    'fick dich','ficken','penner','depp','trottel','mongo',
    'verpiss','verpisst',
    // Chinese profanity & hate speech
    '操你','草你','操你妈','你妈的','妈的','去死','该死','死去',
    '废物','垃圾','滚开','傻逼','煞笔','智障','脑残','白痴',
    '贱人','臭婊子','婊子','妓女','混蛋','狗逼','狗杂种',
    '滚蛋','滚出去','死妈','死全家','全家死',
    // Ao Yin hate — fandom-specific
    '终于删了','该消失','消失吧','活该删','删的好','删了好',
  ];

  return BLOCKED.some(w => lower.includes(w));
}


/* ================================================================
   STAMP ANIMATION
   ================================================================ */
const StampAnimation = {
  overlay: null,
  init() { this.overlay = document.getElementById('stamp-overlay'); },

  play(onComplete) {
    if (!this.overlay) { onComplete?.(); return; }
    this.overlay.setAttribute('aria-hidden', 'false');
    this.overlay.classList.add('active');
    setTimeout(() => {
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
      setTimeout(onComplete, 300);
    }, 2200);
  },
};


/* ================================================================
   SCROLL REVEAL
   ================================================================ */
const ScrollReveal = {
  init() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const reveal = (el) => el.classList.add('visible');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { reveal(e.target); observer.unobserve(e.target); } }),
        { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
      );
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) reveal(el);
        else observer.observe(el);
      });
    } else {
      elements.forEach(reveal);
    }
  },
};


/* ================================================================
   NAVIGATION SCROLL EFFECT
   ================================================================ */
const NavScrollEffect = {
  nav: null,
  init() {
    this.nav = document.getElementById('site-nav');
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();
  },
  onScroll() {
    this.nav?.classList.toggle('scrolled', window.scrollY > 60);
  },
};


/* ================================================================
   SMOOTH SCROLL
   ================================================================ */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}


/* ================================================================
   AUDIO MANAGER
   Two-track scroll-based volume crossfade.
   - Track A (hero):     full volume at top, fades out as paw wall approaches
   - Track B (paw wall): silent at top, fades in as paw wall enters view

   Volumes update on every scroll event using a normalised 0–1 progress
   value between the hero section and the paw wall section.

   Autoplay policy: audio only starts after the first user click on the
   music toggle button. The button is shown always; user decides.
   ================================================================ */
const AudioManager = {
  heroAudio:   null,
  wallAudio:   null,
  btn:         null,
  enabled:     false,
  heroSection: null,
  wallSection: null,

  // Max volumes (0–1) — tune these to taste
  HERO_MAX: 0.55,
  WALL_MAX: 0.50,

  init() {
    this.heroAudio   = document.getElementById('audio-hero');
    this.wallAudio   = document.getElementById('audio-wall');
    this.btn         = document.getElementById('music-btn');
    this.heroSection = document.getElementById('hero');
    this.wallSection = document.getElementById('paw-wall');

    if (!this.heroAudio || !this.wallAudio || !this.btn) return;

    // Set initial volumes
    this.heroAudio.volume = this.HERO_MAX;
    this.wallAudio.volume = 0;

    // Toggle button
    this.btn.addEventListener('click', () => this.toggle());

    // Scroll listener — passive for performance
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  },

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  },

  enable() {
    this.enabled = true;
    this.btn.setAttribute('aria-pressed', 'true');
    this.btn.setAttribute('aria-label', 'Disable music');
    this.btn.querySelector('.music-icon-off').style.display = 'none';
    this.btn.querySelector('.music-icon-on').style.display  = '';
    this.btn.classList.add('active');

    // Load & start both tracks (begins paused at correct volume)
    this.heroAudio.load();
    this.wallAudio.load();

    const startPromise = this.heroAudio.play();
    if (startPromise !== undefined) {
      startPromise.catch(() => {/* browser blocked — user will retry */});
    }
    this.wallAudio.play().catch(() => {});

    // Apply volumes for current scroll position immediately
    this.onScroll();
  },

  disable() {
    this.enabled = false;
    this.btn.setAttribute('aria-pressed', 'false');
    this.btn.setAttribute('aria-label', 'Enable music');
    this.btn.querySelector('.music-icon-off').style.display = '';
    this.btn.querySelector('.music-icon-on').style.display  = 'none';
    this.btn.classList.remove('active');

    this.heroAudio.pause();
    this.wallAudio.pause();
  },

  /**
   * Calculates a 0–1 progress value:
   *   0 = user is at/above the hero bottom edge
   *   1 = user is at/below the paw wall centre
   *
   * Hero volume  = HERO_MAX × (1 − progress)
   * Wall volume  = WALL_MAX × progress
   */
  onScroll() {
    if (!this.enabled) return;

    const scrollY = window.scrollY;
    const vpH     = window.innerHeight;

    // Hero: its bottom edge is roughly heroSection.offsetTop + heroSection.offsetHeight
    const heroBottom = (this.heroSection?.offsetTop ?? 0) + (this.heroSection?.offsetHeight ?? vpH);

    // Wall: centre of the paw-wall section
    const wallTop    = this.wallSection?.offsetTop ?? document.body.scrollHeight;
    const wallCentre = wallTop + (this.wallSection?.offsetHeight ?? 0) * 0.35;

    // Normalised: 0 when at hero bottom, 1 when paw wall centre is at viewport top
    const range    = Math.max(1, wallCentre - heroBottom);
    const progress = Math.min(1, Math.max(0, (scrollY - heroBottom + vpH * 0.1) / range));

    // Ease the crossfade with a gentle curve
    const eased = progress * progress * (3 - 2 * progress); // smoothstep

    this.heroAudio.volume = this.HERO_MAX * (1 - eased);
    this.wallAudio.volume = this.WALL_MAX * eased;
  },
};


/* ================================================================
   PACK COUNT SECTION
   Count-up animation with scale pulse, triggered once on scroll.
   Also shows unique country count below the number.
   ================================================================ */
const PackCountSection = {

  async init() {
    const section = document.getElementById('pack-count');
    if (!section) return;

    const entries   = await StorageLayer.getAll();
    const total     = await StorageLayer.getCount();
    const countries = new Set(entries.map(e => e.countryCode).filter(Boolean)).size;

    const countriesEl = document.getElementById('pack-count-countries');
    if (countriesEl && countries > 0) {
      countriesEl.textContent = `from ${countries} countr${countries === 1 ? 'y' : 'ies'} around the world`;
    }

    // Re-run count-up every time the section enters viewport
    const observer = new IntersectionObserver((observed) => {
      if (!observed[0].isIntersecting) return;
      section.classList.remove('counted');
      void section.offsetWidth; // force reflow so CSS transition restarts
      this.run(total, section);
    }, { threshold: 0.2 });

    observer.observe(section);
  },

  run(target, section) {
    const numEl = document.getElementById('pack-count-number');
    if (!numEl) return;

    // Size the number so it never overflows: fewer digits = bigger font
    const digits = String(target).length;
    const sizes  = ['9rem','9rem','9rem','7rem','5.5rem','4.5rem'];
    numEl.style.fontSize = sizes[Math.min(digits, sizes.length - 1)];

    // Reveal card + labels
    section.classList.add('counted');

    // Start count-up immediately (number shows 0 while card fades in)
    const DURATION = 1200;
    const start    = performance.now();
    const easeOut  = t => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = Math.min(now - start, DURATION);
      numEl.textContent = Math.round(easeOut(elapsed / DURATION) * target).toLocaleString();

      if (elapsed < DURATION) {
        requestAnimationFrame(tick);
      } else {
        numEl.textContent = target.toLocaleString();
        numEl.classList.remove('pulse');
        void numEl.offsetWidth;
        numEl.classList.add('pulse');
        numEl.addEventListener('animationend', () => numEl.classList.remove('pulse'), { once: true });
      }
    };

    requestAnimationFrame(tick);
  },

  /** Called when a new paw is submitted live — updates number + pulse without re-running the full count-up */
  async updateLive() {
    const numEl      = document.getElementById('pack-count-number');
    const countriesEl = document.getElementById('pack-count-countries');
    if (!numEl) return;

    const entries  = await StorageLayer.getAll();
    const total    = await StorageLayer.getCount();
    const countries = new Set(entries.map(e => e.countryCode).filter(Boolean)).size;

    numEl.textContent = total.toLocaleString();
    numEl.classList.remove('pulse');
    void numEl.offsetWidth;
    numEl.classList.add('pulse');
    numEl.addEventListener('animationend', () => numEl.classList.remove('pulse'), { once: true });

    if (countriesEl && countries > 0) {
      countriesEl.textContent = `from ${countries} countr${countries === 1 ? 'y' : 'ies'} around the world`;
    }
  },
};


/* ================================================================
   HERO CTA
   ================================================================ */
function initHeroCTA() {
  document.getElementById('hero-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('leave-your-paw')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => FormModal.open(), 400);
  });
}


/* ================================================================
   UTILS
   ================================================================ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Always start at the top — prevents browser from restoring mid-page scroll position
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  await StorageLayer.seedIfEmpty();

  ScrollReveal.init();
  NavScrollEffect.init();
  StampAnimation.init();
  PawDetail.init();
  CountrySelect.init();
  FormModal.init();
  AudioManager.init();
  initSmoothAnchors();
  initHeroCTA();

  // Wall + map need layout width — defer one frame
  requestAnimationFrame(async () => {
    await PawWallRenderer.init();
    await WorldMap.init();
    await PackCountSection.init();
  });

  // Debounced resize: only re-init map (wall auto-handles with flex)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => WorldMap.init(), 350);
  }, { passive: true });
});
