/* KALA — landing page interactions */

(() => {
  const nav = document.getElementById('nav');
  const stickyOrder = document.getElementById('stickyOrder');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const hero = document.querySelector('.hero') || document.querySelector('.page-header');

  /* Sticky nav border on scroll */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 16);

    /* Show sticky order button once user scrolls past hero */
    if (hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight - 200;
      stickyOrder.classList.toggle('show', y > heroBottom);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  /* Reveal on scroll (cards + sections) */
  const revealEls = document.querySelectorAll('.menu-card, .section-header, .visit-info, .visit-map, .story-text, .story-visual, .menu-category-head, .story-block-text, .story-block-image, .value-card, .pull-quote, .page-header');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      el.style.setProperty('--rev-delay', `${(i % 4) * 70}ms`);
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();
