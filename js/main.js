/* ============================================================
   main.js — Smooth scroll, mobile nav
   ============================================================ */

(function () {

  /* ── SMOOTH SCROLL ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('navbar')?.offsetHeight || 68;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: 'smooth',
      });
      window.closeMobileMenu && window.closeMobileMenu();
    });
  });

  /* ── MOBILE NAV ──────────────────────────────────────────────── */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn   = document.getElementById('mobile-close');

  function openMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add('open');
    mobileMenu.removeAttribute('aria-hidden');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  window.closeMobileMenu = function () {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger && hamburger.addEventListener('click', openMenu);
  closeBtn  && closeBtn.addEventListener('click', window.closeMobileMenu);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeMobileMenu && window.closeMobileMenu();
  });

})();
