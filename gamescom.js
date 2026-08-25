/* ================================================================
   PACK PRINT PROJECT — Gamescom Gallery
   gamescom.js
   ================================================================ */

'use strict';

const GamescomGallery = {
  categories: [],
  activeCategory: null,
  lightboxImages: [],
  lightboxIndex: 0,

  init() {
    if (typeof GAMESCOM_GALLERY === 'undefined') return;
    this.categories = GAMESCOM_GALLERY;

    const hasAnyImages = this.categories.some(c => c.images.length > 0);

    if (!hasAnyImages) {
      // Show the placeholder, nothing else to do
      document.getElementById('gc-placeholder').style.display = '';
      document.getElementById('gc-tabs-nav').style.display = 'none';
      return;
    }

    document.getElementById('gc-placeholder').style.display = 'none';

    this.buildTabs();
    this.buildSections();
    this.activateTab(this.categories.find(c => c.images.length > 0)?.category);
    this.initLightbox();
    NavScrollEffect.init?.();
  },

  buildTabs() {
    const tabsEl = document.getElementById('gc-tabs');
    if (!tabsEl) return;

    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'gc-tab';
      btn.textContent = cat.label;
      btn.dataset.category = cat.category;
      btn.addEventListener('click', () => this.activateTab(cat.category));
      tabsEl.appendChild(btn);
    });
  },

  buildSections() {
    const main = document.getElementById('gc-main');
    if (!main) return;

    this.categories.forEach(cat => {
      const section = document.createElement('section');
      section.className = 'gc-category';
      section.id = `gc-cat-${cat.category}`;
      section.setAttribute('aria-label', cat.label);

      if (cat.images.length === 0) {
        section.innerHTML = `
          <h2 class="gc-category-title">${escapeHtml(cat.label)}</h2>
          <p class="gc-category-desc">${escapeHtml(cat.description)}</p>
          <div class="gc-cat-placeholder">Photos will appear here after Gamescom.</div>`;
      } else {
        const gridItems = cat.images.map((img, i) => {
          const caption = img.caption ? `<span class="gc-grid-item-caption">${escapeHtml(img.caption)}</span>` : '';
          return `
            <div class="gc-grid-item" data-category="${cat.category}" data-index="${i}"
                 tabindex="0" role="button" aria-label="${escapeHtml(img.alt)}">
              <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy" />
              <div class="gc-grid-item-overlay">${caption}</div>
            </div>`;
        }).join('');

        section.innerHTML = `
          <h2 class="gc-category-title">${escapeHtml(cat.label)}</h2>
          <p class="gc-category-desc">${escapeHtml(cat.description)}</p>
          <div class="gc-grid">${gridItems}</div>`;

        section.querySelectorAll('.gc-grid-item').forEach(item => {
          const openLb = () => this.openLightbox(cat.category, parseInt(item.dataset.index, 10));
          item.addEventListener('click', openLb);
          item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(); } });
        });
      }

      main.appendChild(section);
    });
  },

  activateTab(categoryId) {
    if (!categoryId) return;
    this.activeCategory = categoryId;

    document.querySelectorAll('.gc-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === categoryId);
    });

    document.querySelectorAll('.gc-category').forEach(sec => {
      sec.classList.toggle('active', sec.id === `gc-cat-${categoryId}`);
    });

    // Build lightbox image list for current category
    const cat = this.categories.find(c => c.category === categoryId);
    this.lightboxImages = cat?.images || [];
  },

  /* ---- Lightbox ---- */
  initLightbox() {
    const lb    = document.getElementById('gc-lightbox');
    const close = document.getElementById('gc-lb-close');
    const prev  = document.getElementById('gc-lb-prev');
    const next  = document.getElementById('gc-lb-next');

    close?.addEventListener('click', () => this.closeLightbox());
    prev?.addEventListener('click',  () => this.shiftLightbox(-1));
    next?.addEventListener('click',  () => this.shiftLightbox(+1));

    lb?.addEventListener('click', e => { if (e.target === lb) this.closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (!lb?.classList.contains('active')) return;
      if (e.key === 'Escape')      this.closeLightbox();
      if (e.key === 'ArrowLeft')   this.shiftLightbox(-1);
      if (e.key === 'ArrowRight')  this.shiftLightbox(+1);
    });
  },

  openLightbox(categoryId, index) {
    this.lightboxImages = this.categories.find(c => c.category === categoryId)?.images || [];
    this.lightboxIndex  = index;
    this.renderLightbox();

    const lb = document.getElementById('gc-lightbox');
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('gc-lb-close')?.focus();
  },

  closeLightbox() {
    const lb = document.getElementById('gc-lightbox');
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  shiftLightbox(dir) {
    this.lightboxIndex = (this.lightboxIndex + dir + this.lightboxImages.length) % this.lightboxImages.length;
    this.renderLightbox();
  },

  renderLightbox() {
    const img     = this.lightboxImages[this.lightboxIndex];
    if (!img) return;
    document.getElementById('gc-lb-img').src             = img.src;
    document.getElementById('gc-lb-img').alt             = img.alt;
    document.getElementById('gc-lb-caption').textContent = img.caption || '';

    // Hide prev/next when only one image
    const showNav = this.lightboxImages.length > 1;
    document.getElementById('gc-lb-prev').style.display = showNav ? '' : 'none';
    document.getElementById('gc-lb-next').style.display = showNav ? '' : 'none';
  },
};

/* ---- Reuse escapeHtml ---- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---- Nav scroll (same as main site) ---- */
const NavScrollEffect = {
  nav: null,
  init() {
    this.nav = document.getElementById('site-nav');
    window.addEventListener('scroll', () => this.nav?.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
    this.nav?.classList.toggle('scrolled', window.scrollY > 60);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  NavScrollEffect.init();
  GamescomGallery.init();
});
