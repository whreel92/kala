/* KALA — site-wide interactions (simplified) */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Astro's ClientRouter re-executes `is:inline` body scripts on every view
  // transition. Anything appended to a persisted region (body, nav) would
  // duplicate without this guard. Per-page handlers below still re-attach
  // because main is swapped fresh.
  const isFirstRun = !window.__kalaSiteChrome;
  window.__kalaSiteChrome = true;

  // Sync the `is-pos` body class with whether the current page mounts the POS
  // UI. pos.js adds the class; we clear it here when the user navigates away.
  document.body.classList.toggle('is-pos', !!document.querySelector('[data-pos-ui]'));

  /* ─────────────────── Sticky nav shadow on scroll ─────────────────── */
  const onScroll = () => {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 16);
  };
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
  // NODE (guarded by a dataset flag) rather than once-globally.
  const closeMobileMenu = () => {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
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
  if (isFirstRun) {
    document.addEventListener('keydown', (e) => {
      const menu = document.getElementById('mobileMenu');
      if (e.key === 'Escape' && menu && menu.classList.contains('open')) closeMobileMenu();
    });
  }

  /* ─────────────────── Active underline on primary nav ─────────────────── */
  // .nav-links lives inside transition:persist #nav, so we create the sliding
  // element once. The active class is set server-side via the `current` prop.
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
      if (!target) { magic.style.opacity = '0'; return; }
      const r  = target.getBoundingClientRect();
      const pr = navLinks.getBoundingClientRect();
      magic.style.opacity   = '1';
      magic.style.width     = `${r.width}px`;
      magic.style.transform = `translateX(${r.left - pr.left}px)`;
    };
    const getActive = () => navLinks.querySelector('a.is-active');
    requestAnimationFrame(() => {
      const a = getActive();
      if (a) positionMagic(a); else magic.style.opacity = '0';
    });
    if (!navLinks.dataset.kalaMagicBound) {
      navLinks.dataset.kalaMagicBound = 'true';
      links.forEach(a => a.addEventListener('mouseenter', () => positionMagic(a)));
      navLinks.addEventListener('mouseleave', () => {
        const a = getActive();
        if (a) positionMagic(a); else magic.style.opacity = '0';
      });
    }
    if (isFirstRun) {
      window.addEventListener('resize', () => {
        const a = navLinks.querySelector('a:hover') || getActive();
        if (a) positionMagic(a);
      });
    }
  }

  /* ─────────────────── Menu page: category scroll-spy ─────────────────── */
  const menuJump = $('.menu-jump');
  if (menuJump) {
    const jumpInner = $('.menu-jump-inner');
    const jumpLinks = $$('.menu-jump a');
    const allLink   = $('.menu-jump a.is-all');
    const byHash = {};
    jumpLinks.forEach(a => { byHash[a.getAttribute('href').replace('#', '')] = a; });
    const categories = $$('.menu-category');

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
      if (visible.size === 0 || window.scrollY < 200) { setActive(allLink); return; }
      const top = Array.from(visible).sort((a, b) => a.offsetTop - b.offsetTop)[0];
      setActive(byHash[top.id]);
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    categories.forEach(c => spy.observe(c));
  }

  /* ─────────────────── Reservation: date-aware slots + live summary ─────────────────── */
  const reserveForm = $('.reserve-form');
  if (reserveForm) {
    const partySel  = $('#party', reserveForm);
    const dateInput = $('#date',  reserveForm);
    const slots     = $$('.time-chip', reserveForm);
    const submitBtn = $('button[type="submit"]', reserveForm);

    if (dateInput && !dateInput.value) {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      dateInput.value = t.toISOString().split('T')[0];
    }

    const summary = document.createElement('div');
    summary.className = 'reserve-summary';
    summary.innerHTML = `
      <span class="summary-label">Reserving</span>
      <span class="summary-text">—</span>
    `;
    if (submitBtn) submitBtn.insertAdjacentElement('beforebegin', summary);
    const summaryText = $('.summary-text', summary);

    const hoursByDay = {
      0: { open: 12, close: 20 },
      1: null,
      2: { open: 11, close: 21 },
      3: { open: 11, close: 21 },
      4: { open: 11, close: 21 },
      5: { open: 11, close: 22 },
      6: { open: 11, close: 22 },
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
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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
    if (dateInput) dateInput.addEventListener('change', () => { updateSlots(); updateSummary(); });

    updateSlots();
    updateSummary();
  }

  /* ─────────────────── Page-fade transition ─────────────────── */
  if (isFirstRun) {
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-fading');
    });
  }

  /* ─────────────────── Coming-soon modal (social links) ─────────────────── */
  const socialModal = $('[data-social-modal]');
  const socialLinks = $$('[data-social-link]');
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
