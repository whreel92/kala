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

  /* ─── Cart state (in-memory only for now; localStorage in Task 6) ─── */

  let cart = [];    // [{ lineId, itemId, catId, name, image, basePrice, modifiers: [{groupId, optionId, label, delta}], qty, lineTotal }]

  const newLineId = () => 'l-' + Math.random().toString(36).slice(2, 9);

  /* ─── Detail panel ─── */

  const detail        = $('[data-pos-detail]');
  const detailImg     = $('[data-pos-detail-img]');
  const detailName    = $('[data-pos-detail-name]');
  const detailBase    = $('[data-pos-detail-base-price]');
  const detailDesc    = $('[data-pos-detail-desc]');
  const detailMods    = $('[data-pos-detail-mods]');
  const detailQtyEl   = $('[data-pos-detail-qty]');
  const detailQtyMinus= $('[data-pos-detail-qty-minus]');
  const detailQtyPlus = $('[data-pos-detail-qty-plus]');
  const detailAdd     = $('[data-pos-detail-add]');
  const detailTotalEl = $('[data-pos-detail-total]');

  let detailState = null;
  // { item, selections: { [groupId]: optionId }, qty }

  const findItem = (catId, itemId) => {
    const cat = menu.categories.find(c => c.id === catId);
    if (!cat) return null;
    return cat.items.find(i => i.id === itemId) || null;
  };

  const computeDetailTotal = () => {
    if (!detailState) return 0;
    const { item, selections, qty } = detailState;
    let unit = item.price;
    item.modifiers.forEach(group => {
      const selOptId = selections[group.id];
      if (!selOptId) return;
      const opt = group.options.find(o => o.id === selOptId);
      if (opt) unit += opt.delta;
    });
    return unit * qty;
  };

  const renderDetail = () => {
    if (!detailState) return;
    const { item, selections, qty } = detailState;

    detailImg.src = item.image;
    detailImg.alt = item.name;
    detailName.textContent = item.name;
    detailBase.textContent = '$' + item.price;
    detailDesc.textContent = item.description;
    detailQtyEl.textContent = String(qty);
    detailTotalEl.textContent = '$' + computeDetailTotal();

    // Modifier groups
    detailMods.innerHTML = item.modifiers.map(group => `
      <div class="pos-mod-group" data-group-id="${group.id}">
        <div class="pos-mod-group-head">
          <span class="pos-mod-group-name">${escapeHtml(group.name)}</span>
          <span class="pos-mod-group-req">${group.required ? 'Required' : 'Optional'}</span>
        </div>
        <div class="pos-mod-options">
          ${group.options.map(opt => {
            const isSel = selections[group.id] === opt.id;
            const deltaStr = opt.delta > 0 ? `<span class="pos-mod-delta">+$${opt.delta}</span>` : '';
            return `<button type="button" class="pos-mod-pill ${isSel ? 'is-selected' : ''}" data-opt-id="${opt.id}">${escapeHtml(opt.label)}${deltaStr}</button>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Wire pill clicks
    detailMods.querySelectorAll('.pos-mod-group').forEach(groupEl => {
      const gid = groupEl.dataset.groupId;
      groupEl.querySelectorAll('.pos-mod-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          detailState.selections[gid] = pill.dataset.optId;
          renderDetail();
        });
      });
    });
  };

  const openDetail = (catId, itemId) => {
    const item = findItem(catId, itemId);
    if (!item) return;

    // Default selections: first option of each REQUIRED group; nothing for optional
    const selections = {};
    item.modifiers.forEach(g => {
      if (g.required && g.options.length) selections[g.id] = g.options[0].id;
    });

    detailState = { item, selections, qty: 1 };
    detail.hidden = false;
    // Force a reflow so the transition runs
    requestAnimationFrame(() => detail.classList.add('is-open'));
    renderDetail();
    // Focus the close button so keyboard users can dismiss
    setTimeout(() => $('[data-pos-detail-close]', detail)?.focus(), 100);
  };

  const closeDetail = () => {
    detail.classList.remove('is-open');
    setTimeout(() => {
      detail.hidden = true;
      detailState = null;
    }, 300);
  };

  // Open on item card click
  menuContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.pos-item-card');
    if (!card) return;
    openDetail(card.dataset.catId, card.dataset.itemId);
  });

  // Close on backdrop, close button, Esc
  $$('[data-pos-detail-close]').forEach(el => el.addEventListener('click', closeDetail));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !detail.hidden) closeDetail();
  });

  // Quantity stepper
  detailQtyMinus.addEventListener('click', () => {
    if (!detailState) return;
    if (detailState.qty <= 1) return;
    detailState.qty--;
    renderDetail();
  });
  detailQtyPlus.addEventListener('click', () => {
    if (!detailState) return;
    detailState.qty++;
    renderDetail();
  });

  // Add to cart — stores the line and closes the panel.
  // Cart sidebar render is wired in Task 6.
  detailAdd.addEventListener('click', () => {
    if (!detailState) return;
    const { item, selections, qty } = detailState;
    const modifiers = item.modifiers.map(g => {
      const selOptId = selections[g.id];
      if (!selOptId) return null;
      const opt = g.options.find(o => o.id === selOptId);
      if (!opt) return null;
      return { groupId: g.id, optionId: opt.id, label: opt.label, delta: opt.delta };
    }).filter(Boolean);

    const lineTotal = computeDetailTotal();
    cart.push({
      lineId: newLineId(),
      itemId: item.id,
      catId: detailState.item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      modifiers,
      qty,
      lineTotal
    });

    closeDetail();
  });

  /* ─── Cart render + persistence ─── */

  const CART_KEY = 'kala-cart';

  const cartItemsEl    = $('[data-pos-cart-items]');
  const cartEmptyEl    = $('[data-pos-cart-empty]');
  const cartFootEl     = $('[data-pos-cart-foot]');
  const cartSubtotalEl = $('[data-pos-cart-subtotal]');

  // Load any persisted cart
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cart = parsed;
    }
  } catch (e) {
    console.warn('[KALA POS] Failed to load cart from localStorage', e);
  }

  const saveCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('[KALA POS] Failed to save cart', e);
    }
  };

  const computeSubtotal = () => cart.reduce((sum, line) => sum + line.lineTotal, 0);

  const formatModSummary = (modifiers) => {
    if (!modifiers || !modifiers.length) return '';
    return modifiers.map(m => m.label).filter(l => l && l !== 'No thanks').join(' · ');
  };

  const renderCart = () => {
    const isEmpty = cart.length === 0;
    cartEmptyEl.hidden = !isEmpty;
    cartItemsEl.hidden = isEmpty;
    cartFootEl.hidden  = isEmpty;

    if (!isEmpty) {
      cartItemsEl.innerHTML = cart.map(line => `
        <li class="pos-cart-line" data-line-id="${line.lineId}">
          <div class="pos-cart-line-thumb">
            <img src="${line.image}" alt="" />
          </div>
          <div class="pos-cart-line-body">
            <p class="pos-cart-line-name">${escapeHtml(line.name)}</p>
            ${formatModSummary(line.modifiers) ? `<p class="pos-cart-line-mods">${escapeHtml(formatModSummary(line.modifiers))}</p>` : ''}
            <div class="pos-cart-line-row">
              <div class="pos-cart-qty-stepper">
                <button type="button" class="pos-qty-btn" data-cart-qty-minus aria-label="Decrease quantity">−</button>
                <span class="pos-qty-value">${line.qty}</span>
                <button type="button" class="pos-qty-btn" data-cart-qty-plus aria-label="Increase quantity">+</button>
              </div>
              <span class="pos-cart-line-price">$${line.lineTotal}</span>
            </div>
          </div>
          <button type="button" class="pos-cart-line-remove" data-cart-remove aria-label="Remove ${escapeHtml(line.name)}">×</button>
        </li>
      `).join('');

      cartSubtotalEl.textContent = '$' + computeSubtotal();
    }
  };

  const recomputeLineTotal = (line) => {
    let unit = line.basePrice + line.modifiers.reduce((s, m) => s + (m.delta || 0), 0);
    line.lineTotal = unit * line.qty;
  };

  const findLine = (lineId) => cart.find(l => l.lineId === lineId);

  // Wire cart interactions via event delegation
  cartItemsEl.addEventListener('click', (e) => {
    const lineEl = e.target.closest('.pos-cart-line');
    if (!lineEl) return;
    const line = findLine(lineEl.dataset.lineId);
    if (!line) return;

    if (e.target.closest('[data-cart-qty-minus]')) {
      if (line.qty > 1) {
        line.qty--;
        recomputeLineTotal(line);
        saveCart();
        renderCart();
      }
    } else if (e.target.closest('[data-cart-qty-plus]')) {
      line.qty++;
      recomputeLineTotal(line);
      saveCart();
      renderCart();
    } else if (e.target.closest('[data-cart-remove]')) {
      cart = cart.filter(l => l.lineId !== line.lineId);
      saveCart();
      renderCart();
    }
  });

  // Re-render after add-to-cart in the detail panel (extend the existing handler)
  // We can't easily reach inside the handler above, so we monkey-wrap detailAdd's click:
  // Instead, observe cart mutations indirectly: wrap the existing handler.
  const _origDetailAdd = detailAdd.onclick;
  detailAdd.addEventListener('click', () => {
    // The add-to-cart logic from Task 5 ran first because it's bound earlier.
    // Just re-render and persist now.
    saveCart();
    renderCart();
  });

  // Initial render
  renderCart();

  /* ─── Checkout ─── */

  const checkoutEl       = $('[data-pos-checkout]');
  const checkoutOpenBtn  = $('[data-pos-checkout-open]');
  const checkoutCloseBtn = $('[data-pos-checkout-close]');
  const cartContainer    = $('.pos-cart');
  const checkoutForm     = $('[data-pos-checkout-form]');
  const slotsContainer   = $('[data-pos-cko-slots]');
  const timeLegend       = $('[data-pos-cko-time-legend]');
  const addressField     = $('[data-pos-cko-address-field]');
  const ckoTotalEl       = $('[data-pos-cko-total]');

  // Time-slot generation: ASAP + next 4 15-min slots
  const buildSlots = () => {
    const readyMin = (menu.fulfillment[fulfillment] && menu.fulfillment[fulfillment].ready_minutes) || 25;
    const now = new Date();
    // Round up to next 15-min mark for the first non-ASAP slot
    const next = new Date(now.getTime() + readyMin * 60000);
    next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15, 0, 0);

    const fmt = (d) => {
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'p' : 'a';
      h = ((h + 11) % 12) + 1;
      return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
    };

    const slots = [{ value: 'asap', label: `ASAP (~${readyMin} min)` }];
    for (let i = 0; i < 4; i++) {
      const d = new Date(next.getTime() + i * 15 * 60000);
      slots.push({ value: d.toISOString(), label: fmt(d) });
    }
    return slots;
  };

  const renderSlots = () => {
    const slots = buildSlots();
    slotsContainer.innerHTML = slots.map((s, i) => `
      <button type="button" class="pos-cko-slot ${i === 0 ? 'is-selected' : ''}" data-slot-value="${escapeHtml(s.value)}" data-slot-label="${escapeHtml(s.label)}">
        ${escapeHtml(s.label)}
      </button>
    `).join('');
  };

  const openCheckout = () => {
    cartContainer.hidden = true;
    checkoutEl.hidden = false;
    // Fulfillment-specific
    timeLegend.textContent = fulfillment === 'pickup' ? 'Pickup time' : 'Delivery time';
    addressField.hidden = fulfillment !== 'delivery';
    if (fulfillment === 'delivery') {
      addressField.querySelector('input').required = true;
    }
    renderSlots();
    ckoTotalEl.textContent = '$' + computeSubtotal();
  };

  const closeCheckout = () => {
    checkoutEl.hidden = true;
    cartContainer.hidden = false;
  };

  checkoutOpenBtn.addEventListener('click', () => {
    if (cart.length === 0) return;   // shouldn't happen but defensive
    openCheckout();
  });
  checkoutCloseBtn.addEventListener('click', closeCheckout);

  // Slot pill click selects exclusively
  slotsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pos-cko-slot');
    if (!pill) return;
    slotsContainer.querySelectorAll('.pos-cko-slot').forEach(p => p.classList.remove('is-selected'));
    pill.classList.add('is-selected');
  });

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(checkoutForm);
    const selectedSlot = slotsContainer.querySelector('.pos-cko-slot.is-selected');
    const order = {
      fulfillment,
      slot: selectedSlot ? selectedSlot.dataset.slotLabel : 'ASAP',
      name: (fd.get('name') || '').toString().trim() || 'guest',
      phone: fd.get('phone'),
      email: fd.get('email'),
      address: fd.get('address') || null,
      items: cart.slice(),
      subtotal: computeSubtotal(),
      orderNo: 'KALA-' + Math.floor(100000 + Math.random() * 900000).toString()
    };
    renderConfirmation(order);
    // Clear cart from state + storage
    cart = [];
    saveCart();
  });

  /* ─── Confirmation ─── */

  const confirmEl       = $('[data-pos-confirm]');
  const confirmName     = $('[data-pos-confirm-name]');
  const confirmNo       = $('[data-pos-confirm-no]');
  const confirmEta      = $('[data-pos-confirm-eta]');
  const confirmItems    = $('[data-pos-confirm-items]');
  const confirmSubtotal = $('[data-pos-confirm-subtotal]');

  const renderConfirmation = (order) => {
    confirmName.textContent = order.name;
    confirmNo.textContent = order.orderNo;

    const ready = order.slot.startsWith('ASAP')
      ? new Date(Date.now() + (menu.fulfillment[fulfillment].ready_minutes || 25) * 60000)
      : null;
    const etaLabel = order.slot.startsWith('ASAP')
      ? `${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} ready by ~${formatTime(ready)}`
      : `${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} at ${order.slot}`;
    confirmEta.textContent = etaLabel;

    confirmItems.innerHTML = order.items.map(line => `
      <li>
        <div>
          <strong>${escapeHtml(line.name)}</strong>
          ${formatModSummary(line.modifiers) ? `<span class="pos-confirm-line-meta">${escapeHtml(formatModSummary(line.modifiers))}</span>` : ''}
          ${line.qty > 1 ? `<span class="pos-confirm-line-meta">Qty ${line.qty}</span>` : ''}
        </div>
        <span>$${line.lineTotal}</span>
      </li>
    `).join('');
    confirmSubtotal.textContent = '$' + order.subtotal;

    root.classList.add('is-confirming');
    confirmEl.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (d) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'p' : 'a';
    h = ((h + 11) % 12) + 1;
    return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
  };

})();
