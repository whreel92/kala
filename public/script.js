/* KALA — landing & site-wide interactions */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer =
    window.matchMedia('(pointer: fine)').matches;

  /* ─────────────────── Scroll progress hairline ─────────────────── */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  /* ─────────────────── Sticky nav + scroll-driven UI ─────────────────── */
  const nav         = $('#nav');
  const stickyOrder = $('#stickyOrder');
  const scrollCue   = $('.scroll-cue');
  const hero        = $('.hero') || $('.page-header');

  const onScroll = () => {
    const y    = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
    progressBar.style.setProperty('--progress', `${pct}%`);

    if (nav) nav.classList.toggle('is-scrolled', y > 16);

    if (hero && stickyOrder) {
      const heroBottom = hero.offsetTop + hero.offsetHeight - 200;
      stickyOrder.classList.toggle('show', y > heroBottom);
    }

    if (scrollCue) scrollCue.classList.toggle('is-hidden', y > 80);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─────────────────── Homepage olive-drop scroll animation ─────────────────── */
  const tracker = $('[data-olive-tracker]');
  if (tracker && !prefersReducedMotion) {
    const heroHand   = $('.hero-hand');
    const fetaStage  = $('.feta-stage');
    const landedOlive = $('.olive-landed');

    if (heroHand && fetaStage && landedOlive) {
      // Anchors. Recomputed on layout changes.
      let startY = 0;   // viewport-relative Y where the olive starts (hand fingertip)
      let endY   = 0;   // viewport-relative Y where the olive lands on the feta
      let zoneTop = 0;     // document-absolute top of drop zone
      let zoneBottom = 0;  // document-absolute bottom of drop zone
      let scheduled = false;

      const measure = () => {
        // Hand fingertip ≈ horizontal-center-of-hand, ~38% from top of hand image.
        const handRect = heroHand.getBoundingClientRect();
        const handFingertipPageY = handRect.top + window.scrollY + handRect.height * 0.38;

        // Olive lands on top edge of feta block (matches .olive-landed top: 18%).
        const landedRect = landedOlive.getBoundingClientRect();
        const landingPageY = landedRect.top + window.scrollY + landedRect.height / 2;

        zoneTop    = handFingertipPageY - window.innerHeight * 0.05;
        zoneBottom = landingPageY;

        startY = handFingertipPageY;
        endY   = landingPageY;
      };

      const update = () => {
        scheduled = false;
        const y = window.scrollY;
        // progress: 0 when scroll is at zoneTop (or above), 1 when scroll past zoneBottom
        let progress = (y - zoneTop) / (zoneBottom - zoneTop);
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        // Olive's viewport-Y is interpolated: at progress=0 it's at the hand fingertip,
        // at progress=1 it's at the landing point. Subtract scrollY to convert
        // page-space to viewport-space (since the tracker is position: fixed).
        const oliveY = startY + (endY - startY) * progress - y;
        tracker.style.setProperty('--olive-y', `${oliveY}px`);

        // Activate (fade in) while inside the zone
        const inZone = y > zoneTop - window.innerHeight * 0.05 && y < zoneBottom + 100;
        tracker.classList.toggle('is-active', inZone);

        // Bounce-on-arrival: add .is-landed when progress first crosses .95;
        // remove it when progress drops back below .92, so re-scrolling up and
        // back down re-fires the bounce. Hysteresis prevents flicker.
        if (progress >= 0.95) {
          tracker.classList.add('is-landed');
        } else if (progress < 0.92) {
          tracker.classList.remove('is-landed');
        }

        // Hide the static landed copy until the falling olive has finished,
        // so we don't see two olives at once.
        landedOlive.style.opacity = progress >= 1 ? '1' : '0';
      };

      const onScrollOlive = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(update);
      };

      // Measure once initial layout settles; remeasure on resize.
      const remeasure = () => {
        measure();
        update();
      };
      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(remeasure);
        ro.observe(document.body);
      } else {
        window.addEventListener('resize', remeasure);
      }

      window.addEventListener('scroll', onScrollOlive, { passive: true });
      window.addEventListener('load', remeasure);
      // Initial run (in case load already fired or images are cached)
      remeasure();
    }
  }

  /* ─────────────────── Mobile menu (full-screen overlay) ─────────────────── */
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  if (navToggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
  }

  /* ─────────────────── Reveal-on-scroll (staggered) ─────────────────── */
  if ('IntersectionObserver' in window) {
    const revealEls = $$(
      '.menu-card, .section-header, .visit-info, .visit-map, .story-text, ' +
      '.story-visual, .menu-category-head, .story-block-text, .story-block-image, ' +
      '.value-card, .pull-quote, .page-header, .menu-item-card, .order-card, .step'
    );
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => {
      const parent = el.parentElement;
      const peers  = parent
        ? Array.from(parent.children).filter(c => revealEls.includes(c))
        : [el];
      const idx = peers.indexOf(el);
      const rowIdx = idx >= 0 ? idx % 4 : 0;
      el.style.setProperty('--rev-delay', `${rowIdx * 80}ms`);
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ─────────────────── Auto-active nav + magic underline ─────────────────── */
  const navLinks = $('.nav-links');
  if (navLinks) {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const links = $$('a', navLinks);
    links.forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === path) a.classList.add('is-active');
    });

    const magic = document.createElement('span');
    magic.className = 'nav-magic';
    navLinks.appendChild(magic);

    const positionMagic = (target) => {
      if (!target) {
        magic.style.opacity = '0';
        return;
      }
      const r  = target.getBoundingClientRect();
      const pr = navLinks.getBoundingClientRect();
      magic.style.opacity   = '1';
      magic.style.width     = `${r.width}px`;
      magic.style.transform = `translateX(${r.left - pr.left}px)`;
    };
    const active = navLinks.querySelector('a.is-active');
    requestAnimationFrame(() => active ? positionMagic(active) : (magic.style.opacity = '0'));

    links.forEach(a => a.addEventListener('mouseenter', () => positionMagic(a)));
    navLinks.addEventListener('mouseleave', () => {
      if (active) positionMagic(active);
      else magic.style.opacity = '0';
    });
    window.addEventListener('resize', () => {
      const hovered = navLinks.querySelector('a:hover') || active;
      if (hovered) positionMagic(hovered);
    });
  }

  /* ─────────────────── Mobile bottom-bar active state ─────────────────── */
  const mobileBar = $('.mobile-bar');
  if (mobileBar) {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const map = {
      'order.html': 'a[href="order.html"]',
      'contact.html': 'a[href="contact.html"]',
      'reservations.html': 'a[href="reservations.html"]',
    };
    const sel = map[path];
    if (sel) {
      const el = mobileBar.querySelector(sel);
      if (el) el.classList.add('is-current');
    }
  }

  /* ─────────────────── Menu page: filter chips ─────────────────── */
  const menuJump = $('.menu-jump');
  if (menuJump && $('.menu-item-card')) {
    const filtersBar = document.createElement('div');
    filtersBar.className = 'menu-filters';
    filtersBar.setAttribute('aria-label', 'Dietary filters');
    filtersBar.innerHTML = `
      <button type="button" class="menu-filter active" data-filter="all">All</button>
      <button type="button" class="menu-filter" data-filter="v">Vegetarian</button>
      <button type="button" class="menu-filter" data-filter="gf">Gluten-Free</button>
      <button type="button" class="menu-filter" data-filter="spicy">Spicy</button>
    `;
    menuJump.insertAdjacentElement('afterend', filtersBar);

    const cards = $$('.menu-item-card');
    filtersBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.menu-filter');
      if (!btn) return;
      filtersBar.querySelectorAll('.menu-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all') {
          card.classList.remove('is-hidden');
        } else {
          const has = card.querySelector(`.menu-tag.${filter}`);
          card.classList.toggle('is-hidden', !has);
        }
      });
      $$('.menu-category').forEach(cat => {
        const visible = cat.querySelectorAll('.menu-item-card:not(.is-hidden)').length;
        cat.style.display = visible === 0 ? 'none' : '';
      });
    });
  }

  /* ─────────────────── Menu page: scroll-spy + now-viewing pill ─────────────────── */
  if (menuJump) {
    const jumpInner = $('.menu-jump-inner');
    const jumpLinks = $$('.menu-jump a');
    const byHash = {};
    jumpLinks.forEach(a => {
      const id = a.getAttribute('href').replace('#', '');
      byHash[id] = a;
    });
    const categories = $$('.menu-category');

    const pill = document.createElement('div');
    pill.className = 'now-viewing';
    document.body.appendChild(pill);

    const visible = new Set();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      if (visible.size === 0 || window.scrollY < 200) {
        pill.classList.remove('show');
        jumpLinks.forEach(l => l.classList.remove('active'));
        return;
      }
      const top = Array.from(visible).sort((a, b) => a.offsetTop - b.offsetTop)[0];
      const id = top.id;
      const link = byHash[id];
      jumpLinks.forEach(l => l.classList.remove('active'));
      if (link) link.classList.add('active');
      const head = top.querySelector('h2');
      if (head) {
        pill.textContent = head.textContent.replace(/\s+/g, ' ').trim();
        pill.classList.add('show');
      }
      if (jumpInner && link && jumpInner.scrollWidth > jumpInner.clientWidth) {
        const target =
          link.offsetLeft - jumpInner.clientWidth / 2 + link.offsetWidth / 2;
        jumpInner.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

    categories.forEach(c => spy.observe(c));

    // also hide pill when scrolled near top
    window.addEventListener('scroll', () => {
      if (window.scrollY < 200) pill.classList.remove('show');
    }, { passive: true });
  }

  /* ─────────────────── Tap-to-zoom lightbox for menu photos ─────────────────── */
  const zoomImages = $$('.menu-item-card .card-image img');
  if (zoomImages.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Close">
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <path d="M3 3l12 12M15 3L3 15"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <img class="lightbox-img" alt="" />
      <div class="lightbox-caption"></div>
    `;
    document.body.appendChild(lb);

    const lbImg   = $('.lightbox-img', lb);
    const lbCap   = $('.lightbox-caption', lb);
    const lbClose = $('.lightbox-close', lb);

    const open = (src, caption) => {
      lbImg.src   = src;
      lbImg.alt   = caption || '';
      lbCap.textContent = caption || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    zoomImages.forEach(img => {
      const frame = img.closest('.card-image');
      if (!frame) return;
      frame.addEventListener('click', (e) => {
        e.preventDefault();
        const card = img.closest('.menu-item-card');
        const heading = card && card.querySelector('h3');
        open(img.currentSrc || img.src, heading ? heading.textContent.trim() : '');
      });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('open')) close();
    });
  }

  /* ─────────────────── Reservation: date-aware slots + live summary ─────────────────── */
  const reserveForm = $('.reserve-form');
  if (reserveForm) {
    const partySel  = $('#party', reserveForm);
    const dateInput = $('#date',  reserveForm);
    const slots     = $$('.time-chip', reserveForm);
    const submitBtn = $('button[type="submit"]', reserveForm);

    // default date = tomorrow
    if (dateInput && !dateInput.value) {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      dateInput.value = t.toISOString().split('T')[0];
    }

    // summary chip
    const summary = document.createElement('div');
    summary.className = 'reserve-summary';
    summary.innerHTML = `
      <span class="summary-label">Reserving</span>
      <span class="summary-text">—</span>
    `;
    if (submitBtn) submitBtn.insertAdjacentElement('beforebegin', summary);
    const summaryText = $('.summary-text', summary);

    // hours by day-of-week (0 = Sun, 1 = Mon, …)
    const hoursByDay = {
      0: { open: 12,   close: 20 },
      1: null,                       // Mon closed
      2: { open: 11,   close: 21 },
      3: { open: 11,   close: 21 },
      4: { open: 11,   close: 21 },
      5: { open: 11,   close: 22 },
      6: { open: 11,   close: 22 },
    };

    const parseChipTime = (txt) => {
      const m = txt.trim().match(/^(\d{1,2})(?::(\d{2}))?([ap])$/i);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const isP = m[3].toLowerCase() === 'p';
      if (isP && h !== 12) h += 12;
      if (!isP && h === 12) h = 0;
      return h + min / 60;
    };

    const formatDate = (val) => {
      if (!val) return '';
      const d = new Date(val + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
    };

    const updateSlots = () => {
      if (!dateInput || !dateInput.value) return;
      const d = new Date(dateInput.value + 'T00:00:00');
      const hrs = hoursByDay[d.getDay()];
      slots.forEach(chip => {
        const t = parseChipTime(chip.textContent);
        const disabled = !hrs || t === null || t < hrs.open || t > (hrs.close - 0.5);
        chip.classList.toggle('is-disabled', disabled);
        chip.disabled = disabled;
        if (disabled) chip.setAttribute('aria-disabled', 'true');
        else chip.removeAttribute('aria-disabled');
      });
      const active = $('.time-chip.active', reserveForm);
      if (!active || active.classList.contains('is-disabled')) {
        slots.forEach(c => c.classList.remove('active'));
        const firstAvail = slots.find(c => !c.classList.contains('is-disabled'));
        if (firstAvail) firstAvail.classList.add('active');
      }
    };

    const updateSummary = () => {
      const partyText = (partySel ? partySel.value : '').replace(' · contact us', '');
      const dateText  = formatDate(dateInput && dateInput.value);
      const activeChip = $('.time-chip.active:not(.is-disabled)', reserveForm);
      const dow = dateInput && dateInput.value
        ? new Date(dateInput.value + 'T00:00:00').getDay()
        : null;
      const hrs = dow !== null ? hoursByDay[dow] : undefined;

      summary.classList.remove('is-closed');
      if (!hrs) {
        summary.classList.add('is-closed');
        summaryText.textContent = `${dateText} · we're closed — try another day`;
      } else {
        const time = activeChip ? activeChip.textContent.trim() : '—';
        summaryText.textContent = `${partyText} · ${dateText} · ${time}`;
      }
    };

    slots.forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('is-disabled')) return;
        slots.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        updateSummary();
      });
    });
    if (partySel)  partySel .addEventListener('change', updateSummary);
    if (dateInput) dateInput.addEventListener('change', () => {
      updateSlots();
      updateSummary();
    });

    updateSlots();
    updateSummary();
  }

  /* ─────────────────── Order page: 3D hover tilt on option cards ─────────────────── */
  const orderCards = $$('.order-card');
  if (orderCards.length && !prefersReducedMotion && finePointer) {
    orderCards.forEach(card => {
      let raf = null;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top)  / r.height;
        const tiltX = (y - 0.5) * -4;
        const tiltY = (x - 0.5) *  4;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  /* ─────────────────── Magnetic primary CTAs ─────────────────── */
  if (!prefersReducedMotion && finePointer) {
    $$('.btn-primary.btn-lg').forEach(btn => {
      let raf;
      btn.addEventListener('mousemove', (e) => {
        const r  = btn.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) * 0.18;
        const dy = (e.clientY - cy) * 0.22;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate3d(${dx}px, ${dy - 1}px, 0)`;
        });
      });
      btn.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        btn.style.transform = '';
      });
    });
  }

  /* ─────────────────── Chapter rail (Our Story page) ─────────────────── */
  if (location.pathname.toLowerCase().includes('our-story')) {
    const main = $('main');
    const chapterEls = [];

    if (main) {
      const slugify = (s) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      const blocks = $$('main section');
      let chapterCount = 0;
      blocks.forEach(sec => {
        if (sec.querySelector('.story-block')) {
          chapterCount++;
          const eyebrow = sec.querySelector('.story-block-text .eyebrow');
          const label = eyebrow ? eyebrow.textContent.trim() : `Chapter ${chapterCount}`;
          const id = `chapter-${slugify(label) || String(chapterCount).padStart(2, '0')}`;
          sec.id = id;
          chapterEls.push({ id, label, el: sec });
        } else if (sec.classList.contains('values')) {
          sec.id = 'chapter-values';
          chapterEls.push({ id: 'chapter-values', label: 'Values', el: sec });
        } else if (sec.classList.contains('invite')) {
          sec.id = 'chapter-visit';
          chapterEls.push({ id: 'chapter-visit', label: 'Visit', el: sec });
        }
      });
    }

    if (chapterEls.length) {
      const rail = document.createElement('nav');
      rail.className = 'chapter-rail';
      rail.setAttribute('aria-label', 'Story chapters');
      rail.innerHTML = chapterEls.map(c => `
        <a href="#${c.id}">
          <span class="dot"></span>
          <span class="label">${c.label}</span>
        </a>
      `).join('');
      document.body.appendChild(rail);

      setTimeout(() => rail.classList.add('is-visible'), 500);

      const railLinks = $$('a', rail);
      const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            railLinks.forEach(l => l.classList.remove('is-active'));
            const link = rail.querySelector(`a[href="#${entry.target.id}"]`);
            if (link) link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
      chapterEls.forEach(c => spy.observe(c.el));
    }
  }

  /* ─────────────────── Page-fade transition between pages ─────────────────── */
  if (!prefersReducedMotion) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      let url;
      try { url = new URL(href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      document.body.classList.add('page-fading');
      setTimeout(() => { location.href = href; }, 210);
    });
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-fading');
    });
  }
})();
