/* ============================================================
   scroll.js — IntersectionObserver animations, navbar, stat counters
   ============================================================ */

(function () {

  /* ── NAVBAR SCROLL STATE ─────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function updateNav() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    // Active nav link tracking
    const sections = document.querySelectorAll('.score-section[id]');
    const links    = document.querySelectorAll('.nav-links a');
    let current = '';
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top <= 110) current = sec.id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── FADE / SLIDE ANIMATIONS ─────────────────────────────────── */
  const animEls = document.querySelectorAll('.anim-up, .anim-left, .anim-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.10 });

  animEls.forEach(el => revealObserver.observe(el));

  /* ── STAT COUNTER ANIMATION ──────────────────────────────────── */
  const statEls = document.querySelectorAll('.stat-num[data-target]');

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);

      if (target === 0) {
        // Special case: "0 auditions" — stays at 0 but flickers briefly
        el.textContent = '0';
        statObserver.unobserve(el);
        return;
      }

      const DURATION = 1500; // ms
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => statObserver.observe(el));

})();
