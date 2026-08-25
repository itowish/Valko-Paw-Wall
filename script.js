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
const SUPABASE_URL      = '';   // e.g. 'https://xxxx.supabase.co'
const SUPABASE_ANON_KEY = '';   // your anon/public key

const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/* ================================================================
   STORAGE LAYER
   Async-first. Falls back to localStorage when Supabase is not
   configured. Swap only this object to change the backend.
   ================================================================ */
const StorageLayer = {
  STORAGE_KEY: 'packPrintProject_paws_v1',

  /** Return all visible paw entries, oldest first */
  async getAll() {
    if (USE_SUPABASE) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/paw_entries?is_visible=eq.true&order=created_at.asc&select=*`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('Supabase read failed, using localStorage:', err);
      }
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
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
              hunter_name:   entry.hunterName,
              hunter_id:     entry.hunterNumber || null,
              country_code:  entry.countryCode  || null,
              country_name:  entry.countryName  || null,
              message:       entry.message      || null,
              origin:        entry.origin       || null,
              is_visible:    true,
            }),
          }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        const [row] = await res.json();
        return this._normaliseRow(row);
      } catch (err) {
        console.warn('Supabase write failed, saving locally:', err);
      }
    }

    // localStorage fallback
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
      hunterName:   row.hunter_name,
      hunterNumber: row.hunter_id    || '',
      countryCode:  row.country_code || '',
      countryName:  row.country_name || '',
      message:      row.message      || '',
      origin:       row.origin       || '',
    };
  },

  /** Seed demo entries if the wall is empty (localStorage only) */
  async seedIfEmpty() {
    if (USE_SUPABASE) return;
    const all = await this.getAll();
    if (all.length > 0) return;

    const demo = [
      { hunterName: 'Moonlight',   hunterNumber: '#00042', countryCode: 'DE', countryName: 'Germany',     message: 'Valko, you mean the world to so many of us. Thank you for everything you give the community. 🌙', origin: 'Gamescom' },
      { hunterName: 'LittleWolf',  hunterNumber: '#00011', countryCode: 'DE', countryName: 'Germany',     message: 'The Pack howls for you! See you in Cologne!', origin: 'Gamescom' },
      { hunterName: 'StarHunter',  hunterNumber: '#00088', countryCode: 'US', countryName: 'United States', message: 'Sending love from across the ocean. You inspire me every single day.', origin: 'From afar' },
      { hunterName: 'GravityGirl', hunterNumber: '',       countryCode: 'CA', countryName: 'Canada',       message: 'I cried watching you hit your milestone. Worth every second. Pack forever.', origin: 'From afar' },
      { hunterName: 'PawPrint',    hunterNumber: '#00007', countryCode: 'DE', countryName: 'Germany',      message: 'First time attending Gamescom because of you. I am so nervous and so excited!', origin: 'Gamescom' },
      { hunterName: 'Wish',        hunterNumber: '#00001', countryCode: 'DE', countryName: 'Germany',      message: 'This wall exists because of how much the Pack loves you. We are all here.', origin: 'Gamescom' },
      { hunterName: 'Lumi',        hunterNumber: '#00215', countryCode: 'JP', countryName: 'Japan',        message: 'たくさんの愛を贈ります、Valko。あなたのことをずっと応援しています！', origin: 'From afar' },
      { hunterName: 'Echo',        hunterNumber: '#00099', countryCode: 'GB', countryName: 'United Kingdom', message: 'Couldn\'t be there in person but my heart is with the whole Pack.', origin: 'From afar' },
      { hunterName: 'Cipher',      hunterNumber: '#00334', countryCode: 'BR', countryName: 'Brazil',       message: 'Valko, you helped me through some really dark times. Thank you.', origin: 'From afar' },
      { hunterName: 'Solstice',    hunterNumber: '#00156', countryCode: 'DE', countryName: 'Germany',      message: 'The energy at Gamescom is going to be unreal. Cheering from Berlin!', origin: 'Gamescom' },
      { hunterName: 'Flare',       hunterNumber: '#00028', countryCode: 'AT', countryName: 'Austria',      message: 'See you by Hall 9! 🐾🐾🐾', origin: 'Gamescom' },
      { hunterName: 'Riven',       hunterNumber: '',       countryCode: 'AU', countryName: 'Australia',    message: 'Joining from Australia! The time zone won\'t stop me from being part of this.', origin: 'From afar' },
      { hunterName: 'Nova',        hunterNumber: '#00071', countryCode: 'KR', countryName: 'South Korea',  message: 'Every stream, every moment, every memory — thank you for sharing them with us.', origin: 'From afar' },
      { hunterName: 'Dusk',        hunterNumber: '#00403', countryCode: 'NL', countryName: 'Netherlands',  message: 'Pack Print Project is such a beautiful idea. So happy to be a part of it.', origin: 'Gamescom' },
      { hunterName: 'Glimmer',     hunterNumber: '#00192', countryCode: 'FR', countryName: 'France',       message: '', origin: 'From afar' },
      { hunterName: 'Zephyr',      hunterNumber: '#00577', countryCode: 'CH', countryName: 'Switzerland',  message: 'Can\'t stop smiling thinking about Valko seeing all these paws. 🐾', origin: 'Gamescom' },
      { hunterName: 'Sable',       hunterNumber: '',       countryCode: 'MX', countryName: 'Mexico',       message: 'The Pack is real and the Pack is here.', origin: 'From afar' },
      { hunterName: 'Aurel',       hunterNumber: '#00261', countryCode: 'DE', countryName: 'Germany',      message: 'Vielen Dank, Valko. Du bedeutest uns so viel.', origin: 'Gamescom' },
    ];

    const base = Date.now() - demo.length * 3_600_000;
    demo.forEach((d, i) => {
      const saved = { id: `demo_${i}`, timestamp: base + i * 3_600_000, ...d };
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
  mode: 'scroll', // 'scroll' | 'mosaic'

  init() {
    this.track  = document.getElementById('paw-wall-track');
    this.mosaic = document.getElementById('paw-wall-mosaic');
    this.render();
    this.initDragScroll();
    this.initArrows();
    this.initModeSwitcher();
    this.initSearch();
  },

  async render() {
    if (!this.track) return;
    const entries = await StorageLayer.getAll();

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

    this.updateCounter(entries.length);
    // Layout mosaic after DOM is ready
    requestAnimationFrame(() => this.layoutMosaic());
  },

  /**
   * Randomly positions every paw entry in the fixed mosaic container.
   * Uses a seeded pseudo-random approach (index-based) so positions are
   * stable across re-renders.  Packs paws loosely: each one is placed at
   * a random spot, nudged slightly so they cluster naturally.
   */
  layoutMosaic() {
    if (!this.mosaic) return;
    const items = this.mosaic.querySelectorAll('.paw-entry');
    if (!items.length) return;

    const W = this.mosaic.offsetWidth  || 900;
    const H = this.mosaic.offsetHeight || 520;

    // Paw card is roughly 80×110px in the mosaic; leave some edge padding
    const PAD_X = 20, PAD_Y = 20;
    const CARD_W = 82, CARD_H = 108;

    items.forEach((el, i) => {
      // Deterministic "random" using two prime multipliers on the index
      const rx  = ((i * 2357 + 431)  % 1000) / 1000; // 0–1
      const ry  = ((i * 1753 + 877)  % 1000) / 1000; // 0–1
      const rdx = ((i * 3001 + 199)  % 1000) / 1000; // 0–1  (drift X)
      const rdy = ((i * 1301 + 761)  % 1000) / 1000; // 0–1  (drift Y)
      const rdd = ((i * 1117 + 503)  % 1000) / 1000; // 0–1  (duration variance)

      const x = PAD_X + rx * (W - CARD_W - PAD_X * 2);
      const y = PAD_Y + ry * (H - CARD_H - PAD_Y * 2);

      // Drift amplitude: ±4–8px X, ±5–10px Y — slow, organic
      const driftX = (rdx - 0.5) * 14; // –7 to +7 px
      const driftY = (rdy - 0.5) * 16; // –8 to +8 px
      const dur    = 10 + rdd * 8;      // 10–18 s per cycle

      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.setProperty('--drift-x',     `${driftX}px`);
      el.style.setProperty('--drift-y',     `${driftY}px`);
      el.style.setProperty('--drift-dur',   `${dur}s`);
      el.style.setProperty('--drift-delay', `${-(rdd * dur).toFixed(1)}s`); // negative = already mid-cycle
    });
  },

  /** Add a newly submitted entry at the right end without full re-render */
  addEntry(entry) {
    if (!this.track) return;

    const count = this.track.querySelectorAll('.paw-entry').length + 1;

    // Add to scroll wall
    const scrollEl = this.createPawElement(entry, count - 1);
    scrollEl.style.animationDelay = '0ms';
    this.track.appendChild(scrollEl);

    // Add to mosaic wall
    if (this.mosaic) {
      const mosaicEl = this.createPawElement(entry, count - 1);
      mosaicEl.style.animationDelay = '0ms';
      this.mosaic.appendChild(mosaicEl);
      requestAnimationFrame(() => this.layoutMosaic());
    }

    this.updateCounter(count);

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
    el.style.animationDelay = `${Math.min(index * 30, 600)}ms`;

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

    const SPEED = 0.4; // px per frame — gentle drift
    const tick = () => {
      if (!this._autoScrollPaused && this.mode === 'scroll') {
        track.scrollLeft += SPEED;
        // Seamless loop: when we reach the end, jump back to start
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
          track.scrollLeft = 0;
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
    const section   = document.getElementById('paw-wall');
    const btnScroll = document.getElementById('mode-scroll');
    const btnMosaic = document.getElementById('mode-mosaic');
    if (!section || !btnScroll || !btnMosaic) return;

    const activate = (mode) => {
      this.mode = mode;
      // Update button states
      btnScroll.classList.toggle('active', mode === 'scroll');
      btnMosaic.classList.toggle('active', mode === 'mosaic');
      btnScroll.setAttribute('aria-pressed', String(mode === 'scroll'));
      btnMosaic.setAttribute('aria-pressed', String(mode === 'mosaic'));
      // Show/hide via data attribute (CSS uses [data-wall-mode])
      section.setAttribute('data-wall-mode', mode);
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
    // Switch to scroll mode so we can scroll to it
    const btnScroll = document.getElementById('mode-scroll');
    if (this.mode !== 'scroll' && btnScroll) btnScroll.click();

    // Find matching element in scroll track
    setTimeout(() => {
      const track = this.track;
      track.scrollTo({ left: el.offsetLeft - track.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
      // Highlight
      document.querySelectorAll('.paw-entry--found').forEach(e => e.classList.remove('paw-entry--found'));
      el.classList.add('paw-entry--found');
      setTimeout(() => el.classList.remove('paw-entry--found'), 2500);
    }, 100);
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
    [[70,-140],[72,-90],[60,-64],[47,-54],[44,-66],[41,-72],[35,-76],[25,-77],[15,-88],[8,-77],[10,-75],[15,-86],[22,-88],[28,-96],[30,-82],[25,-80],[32,-78],[38,-75],[42,-70],[45,-66],[47,-54],[60,-64],[65,-78],[72,-83],[80,-90],[75,-140],[70,-140]],
    // South America
    [[12,-72],[10,-62],[5,-52],[0,-50],[-5,-35],[-10,-35],[-15,-39],[-23,-43],[-30,-51],[-34,-58],[-38,-62],[-42,-65],[-52,-70],[-55,-67],[-50,-73],[-40,-73],[-30,-71],[-20,-70],[-10,-76],[-5,-80],[0,-78],[5,-78],[10,-72],[12,-72]],
    // Europe mainland
    [[35,-10],[36,-6],[38,-9],[44,-8],[44,-2],[44,4],[50,8],[51,4],[51,2],[53,-4],[55,-3],[57,2],[58,5],[56,10],[55,8],[54,18],[56,22],[58,24],[60,25],[60,28],[65,25],[68,28],[70,30],[65,25],[60,18],[58,12],[54,18],[50,14],[47,8],[44,8],[42,12],[40,18],[38,15],[38,12],[40,10],[35,-10]],
    // Scandinavia
    [[56,10],[58,5],[62,8],[65,15],[70,20],[72,28],[70,30],[67,20],[65,17],[60,18],[58,12],[56,10]],
    // Africa
    [[37,10],[35,12],[32,12],[22,37],[12,43],[12,45],[4,40],[0,42],[-4,40],[-10,40],[-17,35],[-20,35],[-25,33],[-33,26],[-35,18],[-35,20],[-30,30],[-17,35],[-10,35],[0,10],[5,3],[5,-8],[15,-17],[20,-17],[25,-15],[32,-17],[37,-10],[37,10]],
    // Asia mainland
    [[70,30],[72,55],[72,80],[72,100],[65,110],[55,90],[50,80],[45,60],[40,55],[37,42],[40,36],[45,38],[45,40],[50,50],[55,60],[55,80],[52,90],[48,135],[43,141],[40,130],[35,120],[25,120],[20,110],[10,100],[5,100],[12,43],[15,43],[22,37],[25,35],[30,35],[35,35],[37,36],[40,36],[45,38],[48,40],[65,42],[68,45],[70,50],[72,75],[70,30]],
    // Indian subcontinent
    [[25,68],[30,68],[30,62],[25,57],[20,73],[8,77],[12,80],[18,84],[25,90],[28,88],[28,80],[25,72],[25,68]],
    // Indochina/SE Asia
    [[22,100],[20,100],[15,100],[10,100],[5,100],[5,104],[0,104],[5,116],[10,120],[15,105],[20,105],[22,100]],
    // Australia
    [[-16,122],[-14,128],[-12,136],[-12,142],[-16,146],[-20,148],[-28,154],[-32,152],[-38,148],[-38,140],[-35,136],[-32,128],[-26,114],[-22,114],[-16,122]],
    // Japan
    [[31,130],[33,131],[35,135],[37,138],[40,140],[43,141],[43,144],[40,140],[36,137],[33,131],[31,130]],
    // Greenland
    [[60,-44],[65,-42],[72,-22],[78,-20],[83,-36],[83,-52],[78,-72],[72,-58],[62,-46],[60,-44]],
    // British Isles
    [[51,-5],[52,-3],[54,-3],[58,-5],[58,-6],[55,-6],[53,-6],[51,-5]],
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
    const ocean = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
    ocean.addColorStop(0, '#1a5555');
    ocean.addColorStop(1, '#0a2828');
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
      ctx.fillStyle   = 'rgba(10,191,191,0.18)';
      ctx.strokeStyle = 'rgba(10,191,191,0.35)';
      ctx.lineWidth   = 0.9;
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
    const entries    = await StorageLayer.getAll();
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
          <span class="world-stat-number">${entries.length}</span>
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
  COOLDOWN_MS: 30_000,

  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.form    = document.getElementById('paw-form');

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
        'Something went wrong. Please try again.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🐾</span> ADD MY PAW';
    }
  },
};

/** Very basic spam word filter */
function containsSpam(text) {
  if (!text) return false;
  const BLOCKED = ['http://', 'https://', 'www.', '<script', 'onclick'];
  const lower = text.toLowerCase();
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
    const total     = entries.length;
    const countries = new Set(entries.map(e => e.countryCode).filter(Boolean)).size;

    const countriesEl = document.getElementById('pack-count-countries');
    if (countriesEl && countries > 0) {
      countriesEl.textContent = `from ${countries} countr${countries === 1 ? 'y' : 'ies'} around the world`;
    }

    // Fire exactly once when section enters viewport; disconnect immediately so
    // scrolling back up never re-triggers it
    const observer = new IntersectionObserver((observed) => {
      if (!observed[0].isIntersecting) return;
      observer.disconnect();
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
    const total    = entries.length;
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

  // Demo entries disabled — wall starts empty

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
