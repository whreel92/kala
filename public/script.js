/* KALA — landing & site-wide interactions */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer =
    window.matchMedia('(pointer: fine)').matches;

  // Astro's ClientRouter re-executes `is:inline` body scripts on every view
  // transition. Anything appended to a persisted region (body, nav) would
  // duplicate without this guard. Per-page handlers below still re-attach
  // because main is swapped fresh.
  const isFirstRun = !window.__kalaSiteChrome;
  window.__kalaSiteChrome = true;

  // Sync the `is-pos` body class with whether the current page mounts the POS
  // UI. pos.js adds the class; we clear it here when the user navigates away.
  document.body.classList.toggle('is-pos', !!document.querySelector('[data-pos-ui]'));

  // Reduced-motion: drop the autoplaying hero loop back to its still poster.
  if (prefersReducedMotion) {
    const heroVid = document.querySelector('.hero-bg-video');
    if (heroVid) {
      heroVid.removeAttribute('autoplay');
      try { heroVid.pause(); } catch (e) {}
    }
  }

  /* ─────────────────── Scroll progress hairline ─────────────────── */
  let progressBar = $('.scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
  }

  /* ─────────────────── Sticky nav + scroll-driven UI ─────────────────── */
  // Refs re-queried every scroll because main is swapped between pages.
  const onScroll = () => {
    const y    = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
    progressBar.style.setProperty('--progress', `${pct}%`);

    const nav         = document.getElementById('nav');
    const stickyOrder = document.getElementById('stickyOrder');
    const scrollCue   = document.querySelector('.scroll-cue');
    const hero        = document.querySelector('.hero') || document.querySelector('.page-header');

    if (nav) nav.classList.toggle('is-scrolled', y > 16);

    if (hero && stickyOrder) {
      const heroBottom = hero.offsetTop + hero.offsetHeight - 200;
      stickyOrder.classList.toggle('show', y > heroBottom);
    }

    if (scrollCue) scrollCue.classList.toggle('is-hidden', y > 80);
  };
  // rAF-throttle so the layout reads above happen at most once per frame
  // instead of on every scroll event (avoids thrash on the long menu page).
  let scrollTicking = false;
  const onScrollThrottled = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { scrollTicking = false; onScroll(); });
  };
  if (isFirstRun) window.addEventListener('scroll', onScrollThrottled, { passive: true });
  onScroll();

  /* ─────────────────── Mobile menu (full-screen overlay) ─────────────────── */
  // The nav sits in a transition:persist region, but navigating THROUGH a
  // `bare` page (e.g. /printed-menu renders no nav) tears the nav down and
  // rebuilds it fresh on return. So node-level listeners must be bound PER
  // NODE (guarded by a dataset flag) rather than once-globally — otherwise the
  // rebuilt toggle would have no click handler and the menu couldn't open.
  // closeMobileMenu re-queries the live nodes so it never holds a stale ref.
  const closeMobileMenu = () => {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    // Move focus out of the menu first so the browser doesn't trap it on an
    // element that's about to be marked inert.
    if (menu.contains(document.activeElement)) document.activeElement.blur();
    menu.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
    document.body.style.overflow = '';
  };
  {
    const navToggle = $('#navToggle');
    const mobileMenu = $('#mobileMenu');
    // inert + aria-hidden together keep the closed menu out of focus/pointer
    // order and avoid the "aria-hidden with a focused descendant" warning.
    if (navToggle && mobileMenu && !navToggle.dataset.kalaNavBound) {
      navToggle.dataset.kalaNavBound = 'true';
      navToggle.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) mobileMenu.removeAttribute('inert');
        else mobileMenu.setAttribute('inert', '');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMobileMenu);
      });
    }
  }
  // Document-level Escape handler: bound once (document survives swaps).
  if (isFirstRun) {
    document.addEventListener('keydown', (e) => {
      const menu = document.getElementById('mobileMenu');
      if (e.key === 'Escape' && menu && menu.classList.contains('open')) closeMobileMenu();
    });
  }

  /* ─────────────────── Reveal-on-scroll (staggered) ─────────────────── */
  // Skip entirely under reduced-motion: elements keep their natural (visible)
  // state rather than animating in.
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealEls = $$(
      '.menu-card, .section-header, .visit-info, .visit-map, .story-text, ' +
      '.story-visual, .menu-category-head, .story-block-text, .story-block-image, ' +
      '.value-card, .pull-quote, .page-header, .menu-item-card, .order-card, .step, ' +
      '.callout-frame, .invite-inner, .menu-cta > .container, .walk-in-inner, ' +
      '.reserve-card, .dish-marquee-eyebrow, .sharedtable-media, .sharedtable-text, ' +
      '.favorites-head, .fav-card, .menu-feature-card, .timeline-step, ' +
      '.contact-atmos, .action-card, .events-card, ' +
      '.os-hero-media, .os-hero-text, .os-quote-band, .os-ed-media, .os-ed-text, ' +
      '.promise-col, .journey-point, .os-cta-panel, ' +
      '.res-hero-inner, .res-image-card, .res-walkin-inner, .res-parties-text, ' +
      '.order-options-head, .banner-ribbon'
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
      // Skip if already revealed (e.g. on view-transition rerun)
      if (el.classList.contains('in-view')) return;
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

  /* ─────────────────── Magic sliding underline on primary nav ─────────────────── */
  // .nav-links lives inside transition:persist #nav, so we only create the
  // sliding element once. The active class is already set server-side via the
  // `current` prop in Base.astro; on each transition we just reposition based
  // on whichever link is active now.
  const navLinks = $('.nav-links');
  if (navLinks) {
    let magic = navLinks.querySelector('.nav-magic');
    if (!magic) {
      magic = document.createElement('span');
      magic.className = 'nav-magic';
      navLinks.appendChild(magic);
    }

    const links = $$('a', navLinks);
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
    const getActive = () => navLinks.querySelector('a.is-active');
    requestAnimationFrame(() => {
      const a = getActive();
      if (a) positionMagic(a);
      else magic.style.opacity = '0';
    });

    // Hover listeners bound per-node (same rationale as the mobile menu): the
    // nav can be rebuilt fresh after navigating through a `bare` page.
    if (!navLinks.dataset.kalaMagicBound) {
      navLinks.dataset.kalaMagicBound = 'true';
      links.forEach(a => a.addEventListener('mouseenter', () => positionMagic(a)));
      navLinks.addEventListener('mouseleave', () => {
        const a = getActive();
        if (a) positionMagic(a);
        else magic.style.opacity = '0';
      });
    }
    if (isFirstRun) {
      window.addEventListener('resize', () => {
        const a = navLinks.querySelector('a:hover') || getActive();
        if (a) positionMagic(a);
      });
    }
  }

  /* ─────────────────── Menu page: sticky category nav reference ─────────────────── */
  const menuJump = $('.menu-jump');

  /* ─────────────────── Menu page: scroll-spy + now-viewing pill ─────────────────── */
  if (menuJump) {
    const jumpInner = $('.menu-jump-inner');
    const jumpLinks = $$('.menu-jump a');
    const allLink   = $('.menu-jump a.is-all');
    const byHash = {};
    jumpLinks.forEach(a => {
      const id = a.getAttribute('href').replace('#', '');
      byHash[id] = a;
    });
    const categories = $$('.menu-category');

    const pill = document.createElement('div');
    pill.className = 'now-viewing';
    document.body.appendChild(pill);

    const setActive = (link) => {
      jumpLinks.forEach(l => l.classList.remove('active'));
      if (link) link.classList.add('active');
      if (jumpInner && link && jumpInner.scrollWidth > jumpInner.clientWidth) {
        const target = link.offsetLeft - jumpInner.clientWidth / 2 + link.offsetWidth / 2;
        jumpInner.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    };

    const visible = new Set();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      // Near the top (House Favorites / intro) → highlight "All", hide pill.
      if (visible.size === 0 || window.scrollY < 260) {
        pill.classList.remove('show');
        setActive(allLink);
        return;
      }
      const top = Array.from(visible).sort((a, b) => a.offsetTop - b.offsetTop)[0];
      const link = byHash[top.id];
      setActive(link);
      const head = top.querySelector('h2');
      if (head) {
        pill.textContent = head.textContent.replace(/\s+/g, ' ').trim();
        pill.classList.add('show');
      }
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

    categories.forEach(c => spy.observe(c));

    // also reset to "All" + hide pill when scrolled near top. script.js reruns
    // on every view transition and window survives swaps, so replace any prior
    // handler (which referenced a now-discarded pill) rather than stacking.
    if (window.__kalaMenuTopScroll) window.removeEventListener('scroll', window.__kalaMenuTopScroll);
    window.__kalaMenuTopScroll = () => {
      if (window.scrollY < 260) { pill.classList.remove('show'); setActive(allLink); }
    };
    window.addEventListener('scroll', window.__kalaMenuTopScroll, { passive: true });
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

    let lbLastFocus = null;
    const open = (src, caption, trigger) => {
      lbLastFocus = trigger || document.activeElement;
      lbImg.src   = src;
      lbImg.alt   = caption || '';
      lbCap.textContent = caption || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => lbClose.focus(), 50);
    };
    const close = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Return focus to whatever opened the lightbox.
      if (lbLastFocus && typeof lbLastFocus.focus === 'function') lbLastFocus.focus();
      lbLastFocus = null;
    };

    zoomImages.forEach(img => {
      const frame = img.closest('.card-image');
      if (!frame) return;
      // Make the image frame a real button so it's keyboard-operable.
      const card = img.closest('.menu-item-card');
      const heading = card && card.querySelector('h3');
      const name = heading ? heading.textContent.trim() : '';
      frame.setAttribute('role', 'button');
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('aria-label', name ? `View larger photo of ${name}` : 'View larger photo');
      const trigger = (e) => {
        e.preventDefault();
        open(img.currentSrc || img.src, name, frame);
      };
      frame.addEventListener('click', trigger);
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') trigger(e);
      });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    // document survives view-transition swaps — replace any prior Esc handler
    // (bound to a now-discarded lightbox) instead of stacking a new one.
    if (window.__kalaLbKey) document.removeEventListener('keydown', window.__kalaLbKey);
    window.__kalaLbKey = (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); };
    document.addEventListener('keydown', window.__kalaLbKey);
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

  /* ─────────────────── Page-fade transition ─────────────────── */
  // Astro's ClientRouter handles cross-document transitions via the View
  // Transitions API. We just clear any lingering fade class on pageshow so a
  // back-button navigation never leaves the body invisible.
  if (isFirstRun) {
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-fading');
    });
  }

  /* ─────────────────── Coming-soon modal (social links) ─────────────────── */
  const socialModal = $('[data-social-modal]');
  const socialLinks = $$('[data-social-link]');
  // Modal + links live in the transition:persist footer, so bind once per node
  // lifetime (matches the mobile-nav kalaNavBound pattern) — otherwise the
  // data-astro-rerun re-execution stacks duplicate handlers every navigation.
  if (socialModal && socialLinks.length && !socialModal.dataset.kalaSocialBound) {
    socialModal.dataset.kalaSocialBound = 'true';
    const platformEls = socialModal.querySelectorAll('[data-social-platform]');
    const closeEls = socialModal.querySelectorAll('[data-social-modal-close]');

    let lastTrigger = null;

    const openSocialModal = (platform, trigger) => {
      platformEls.forEach(el => { el.textContent = platform; });
      lastTrigger = trigger || null;
      socialModal.hidden = false;
      requestAnimationFrame(() => socialModal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      // Focus the close button so keyboard users can dismiss
      setTimeout(() => closeEls[0]?.focus(), 80);
    };

    const closeSocialModal = () => {
      socialModal.classList.remove('is-open');
      setTimeout(() => {
        socialModal.hidden = true;
        document.body.style.overflow = '';
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
        lastTrigger = null;
      }, 240);
    };

    socialLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openSocialModal(link.dataset.socialLink || 'this', link);
      });
    });

    closeEls.forEach(el => el.addEventListener('click', closeSocialModal));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !socialModal.hidden) closeSocialModal();
    });
  }
})();
