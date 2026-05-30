/* KALA POS — customer-facing online ordering UI.
   Activates only on pages that contain [data-pos-ui]. */

(() => {
  'use strict';

  const root = document.querySelector('[data-pos-ui]');
  if (!root) return;   // Not on a POS page — bail.

  const menu = window.KALA_MENU;
  if (!menu) {
    console.warn('[KALA POS] window.KALA_MENU is not defined.');
    return;
  }

  const $  = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));

  const fulfillment = root.dataset.fulfillment;   // 'pickup' or 'delivery'

  /* ─── Menu render ─── */

  const catsContainer  = $('[data-pos-cats]');
  const menuContainer  = $('[data-pos-menu]');

  // Category chips
  catsContainer.innerHTML = menu.categories.map(cat => `
    <a class="pos-cat-chip" href="#pos-cat-${cat.id}" data-cat-id="${cat.id}">${escapeHtml(cat.name)}</a>
  `).join('');

  // Category sections
  menuContainer.innerHTML = menu.categories.map(cat => `
    <section class="pos-cat-section" id="pos-cat-${cat.id}" data-cat-id="${cat.id}">
      <header class="pos-cat-section-head">
        <h2>${escapeHtml(cat.name)}</h2>
        ${cat.blurb ? `<p>${escapeHtml(cat.blurb)}</p>` : ''}
      </header>
      <div class="pos-card-grid">
        ${cat.items.map(item => `
          <button type="button" class="pos-item-card" data-item-id="${item.id}" data-cat-id="${cat.id}">
            <div class="pos-item-image">
              <img src="${item.image}" alt="" loading="lazy" />
            </div>
            <div class="pos-item-body">
              <div class="pos-item-head">
                <h3>${escapeHtml(item.name)}</h3>
                <span class="pos-item-price">$${item.price}</span>
              </div>
              <p class="pos-item-desc">${escapeHtml(item.description)}</p>
            </div>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  /* ─── Scroll-spy on category chips ─── */

  const chips = $$('.pos-cat-chip');
  const sections = $$('.pos-cat-section');

  const setActiveChip = (catId) => {
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.catId === catId));
  };

  if ('IntersectionObserver' in window && sections.length) {
    const seen = new Map();   // catId → isIntersecting
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => seen.set(e.target.dataset.catId, e.isIntersecting));
      // Pick the first visible section by document order
      for (const cat of menu.categories) {
        if (seen.get(cat.id)) {
          setActiveChip(cat.id);
          return;
        }
      }
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
    // Initial highlight
    setActiveChip(menu.categories[0].id);
  }

  /* ─── Helpers ─── */

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Subsequent feature blocks (detail panel, cart, checkout, confirmation)
     are added in following tasks. */

})();
